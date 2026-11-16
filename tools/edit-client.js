// In-browser editor (development only).
// Loaded only by tools/edit-server.py, and only on pages opened with ?edit.
// Makes the copy editable in place, lists the page's images in a DialKit
// panel, and saves back to the real files through the edit server.
//
// Saving never serialises the live page. It re-reads the original file and
// splices in only the parts you changed, so everything scripts add at
// runtime (theme, footer time and weather, tuner variables, DialKit itself)
// can't leak into the HTML, and the rest of the file stays byte-for-byte.

(function () {
  if (!new URLSearchParams(location.search).has("edit")) return;
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  var CDN = "https://cdn.jsdelivr.net/npm/dialkit@2.0.0/dist/vanilla/";
  var SITE = new URL("..", document.currentScript.src); // folder above tools/
  var PAGE = decodeURIComponent(location.pathname.slice(SITE.pathname.length)) || "index.html";
  var UP = PAGE.indexOf("/") === -1 ? "" : "../"; // path prefix back to the root

  // Copy you can edit in place
  var TEXT = [
    ".intro h1", ".intro > p", "main h2",
    ".row-title", ".row-desc", ".row-year",
    ".case-title", ".case-summary", ".case-meta > span", ".case-points > li",
    ".account-handle",
  ];

  var texts = [];      // { sel, i, el, before }
  var images = [];     // { kind, sel, i, el, key, name, initial, value, alt, initialAlt }
  var accounts = [];   // { i, el, key, initialText, initialHref }
  var kit, toast, leaving = false;

  fetch(SITE.href + "__edit/ping", { cache: "no-store" })
    .then(function (r) { if (r.ok) loadDialKit(); })
    .catch(function () {});

  function loadDialKit() {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = CDN + "styles.css";
    document.head.appendChild(css);
    var script = document.createElement("script");
    script.src = CDN + "browser.global.js";
    script.onload = start;
    document.head.appendChild(script);
  }

  // ---------------------------------------------------------------- setup

  function start() {
    TEXT.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.setAttribute("contenteditable", "true");
        el.setAttribute("spellcheck", "true");
        texts.push({ sel: sel, i: i, el: el, before: el.innerHTML });
      });
    });

    document.querySelectorAll(".thumb").forEach(function (el, i) {
      var row = el.closest(".row");
      var title = row && row.querySelector(".row-title");
      var href = row && row.getAttribute("href");
      var base = href ? href.split("/").pop().replace(/\.html.*$/, "") : slug(title ? title.textContent : "row-" + i);
      var img = el.querySelector("img");
      images.push({
        kind: "thumb", sel: ".thumb", i: i, el: el,
        key: label(title ? title.textContent : "Row " + (i + 1)),
        name: slug(base) + "-thumb",
        initial: img ? img.getAttribute("src") : "",
        path: img ? img.getAttribute("src") : "",
      });
    });

    document.querySelectorAll(".hero .frame").forEach(function (el, i) {
      var img = el.querySelector(":scope > img");
      var base = PAGE.split("/").pop().replace(/\.html$/, "");
      images.push({
        kind: "hero", sel: ".hero .frame", i: i, el: el,
        key: i ? "Hero " + (i + 1) : "Hero",
        name: slug(base) + "-hero" + (i ? "-" + (i + 1) : ""),
        initial: img ? img.getAttribute("src") : "",
        path: img ? img.getAttribute("src") : "",
        initialAlt: img ? img.getAttribute("alt") || "" : "",
      });
    });

    document.querySelectorAll(".account > a").forEach(function (el, i) {
      accounts.push({
        i: i, el: el, key: i ? "Account link " + (i + 1) : "Account link",
        initialText: leadText(el), initialHref: el.getAttribute("href"),
      });
    });

    window.DialKit.createDialRoot({ position: "bottom-right", defaultOpen: true });
    kit = window.DialKit.createDialKit("Edit page", buildConfig(), {
      id: "portfolio-edit-" + PAGE,
      persist: false,
      onAction: onAction,
    });
    kit.subscribe(applyPanel);

    guardInteractions();
    acceptDrops();
    toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.style.cssText =
      "position:fixed;left:16px;bottom:16px;z-index:2147483647;max-width:min(420px,calc(100vw - 32px));" +
      "padding:10px 14px;border-radius:10px;font:14px/1.4 system-ui,sans-serif;" +
      "background:#111;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,.3);opacity:0;transition:opacity .2s;pointer-events:none";
    document.body.appendChild(toast);
    say("Editing " + PAGE + ". Click any text to change it; images are in the panel.");
  }

  function buildConfig() {
    var config = {};
    if (images.length) {
      var folder = {};
      images.forEach(function (slot) {
        folder[slot.key] = slot.initial
          ? { type: "image", options: [{ value: slot.initial, label: "Current" }], default: slot.initial }
          : { type: "image" };
        if (slot.kind === "hero") {
          folder[slot.key + " alt text"] = {
            type: "text", default: slot.initialAlt || "",
            placeholder: "Describe what the image shows",
          };
        }
      });
      config.images = folder;
    }
    accounts.forEach(function (a) {
      config[a.key] = {
        text: { type: "text", default: a.initialText },
        link: { type: "text", default: a.initialHref },
      };
    });
    config.save = { type: "action", label: "Save to files" };
    config.discard = { type: "action", label: "Discard changes" };
    return config;
  }

  // Show panel changes on the page right away
  function applyPanel(values) {
    images.forEach(function (slot) {
      var v = values.images[slot.key] || "";
      slot.value = v;
      if (slot.kind === "hero") slot.alt = values.images[slot.key + " alt text"] || "";
      if (v === (slot.shown || slot.initial)) return;
      slot.shown = v;
      preview(slot, v);
    });
    accounts.forEach(function (a) {
      var v = values[a.key];
      a.text = v.text;
      a.href = v.link;
      setLeadText(a.el, v.text);
    });
  }

  function preview(slot, src) {
    if (slot.kind === "thumb") {
      var img = slot.el.querySelector("img");
      if (!src) { if (img) img.remove(); return; }
      if (!img) { img = document.createElement("img"); img.alt = ""; slot.el.appendChild(img); }
      img.src = src;
    } else {
      var hero = slot.el.querySelector(":scope > img");
      var placeholder = slot.el.querySelector(".placeholder");
      if (!src) return;
      if (!hero) { hero = document.createElement("img"); slot.el.insertBefore(hero, slot.el.firstChild); }
      hero.src = src;
      if (placeholder) placeholder.hidden = true;
    }
  }

  // Keep clicks from following links while editing, and keep text single-line
  function guardInteractions() {
    document.addEventListener("click", function (event) {
      if (event.target.closest("[contenteditable], .account > a")) {
        event.preventDefault();
        return;
      }
      // Ask before leaving with unsaved edits, before case.js starts its exit animation
      var link = event.target.closest("a[href]");
      if (link && !link.closest(".dialkit-root") && dirty()) {
        if (confirm("Leave without saving your changes?")) {
          leaving = true;
        } else {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    }, true);
    document.addEventListener("keydown", function (event) {
      if (event.target.isContentEditable && event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        save();
      }
    });
    document.addEventListener("paste", function (event) {
      if (!event.target.isContentEditable && !(event.target.closest && event.target.closest("[contenteditable]"))) return;
      event.preventDefault();
      var text = (event.clipboardData.getData("text/plain") || "").replace(/\s+/g, " ");
      document.execCommand("insertText", false, text);
    });
    // Keep ?edit when moving between pages
    document.querySelectorAll("a[href$='.html'], a[href*='.html#'], a.mark").forEach(function (a) {
      var url = new URL(a.getAttribute("href"), location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("edit", "");
      a.href = url.href.replace("edit=", "edit");
    });
    window.addEventListener("beforeunload", function (event) {
      if (!leaving && dirty()) { event.preventDefault(); event.returnValue = ""; }
    });
  }

  // Drop a photo straight onto a thumbnail or hero on the page
  function acceptDrops() {
    images.forEach(function (slot) {
      var target = slot.kind === "thumb" ? slot.el.closest(".row") || slot.el : slot.el;
      target.addEventListener("dragover", function (event) {
        if (!event.dataTransfer || event.dataTransfer.types.indexOf("Files") === -1) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        slot.el.style.outline = "2px dashed currentColor";
      });
      target.addEventListener("dragleave", function () { slot.el.style.outline = ""; });
      target.addEventListener("drop", function (event) {
        event.preventDefault();
        slot.el.style.outline = "";
        var file = event.dataTransfer.files[0];
        if (!file || !/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
          say("Drop a JPG, PNG, WebP, GIF or AVIF image.");
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { kit.setValue("images." + slot.key, reader.result); };
        reader.readAsDataURL(file);
      });
    });
    // Don't let a missed drop open the image in the tab
    window.addEventListener("dragover", function (event) { event.preventDefault(); });
    window.addEventListener("drop", function (event) { event.preventDefault(); });
  }

  function onAction(action) {
    if (action === "save") save();
    if (action === "discard") {
      if (!dirty() || confirm("Discard your unsaved changes?")) { leaving = true; location.reload(); }
    }
  }

  // ---------------------------------------------------------------- saving

  function dirty() {
    return texts.some(function (t) { return t.el.innerHTML !== t.before; }) ||
      images.some(function (s) { return s.value !== s.initial || (s.kind === "hero" && s.value && s.alt !== s.initialAlt); }) ||
      accounts.some(function (a) { return a.text !== a.initialText || a.href !== a.initialHref; });
  }

  var saving = false;

  function save() {
    if (saving) return;
    var pending = images.filter(function (s) { return s.value && s.value !== s.initial; });
    for (var k = 0; k < images.length; k++) {
      var s = images[k];
      if (s.kind === "hero" && s.value && !s.alt.trim()) {
        var alt = prompt("Alt text for the " + s.key.toLowerCase() + " image (describe what it shows):", "");
        if (!alt || !alt.trim()) { say("Not saved: the hero image needs alt text."); return; }
        s.alt = alt.trim();
        var update = { images: {} };
        update.images[s.key + " alt text"] = s.alt;
        kit.setValues(update);
      }
    }
    saving = true;
    say("Saving…");

    // 1. Upload new photos into assets/
    var uploads = pending.filter(function (s) { return /^data:/.test(s.value); }).map(function (s) {
      return post("upload", { name: s.name, data: s.value }).then(function (res) { s.file = res.file; });
    });

    Promise.all(uploads)
      // 2. Re-read the original file and splice in the changes
      .then(function () {
        return fetch(location.pathname, { cache: "no-store" }).then(function (r) {
          if (!r.ok) throw new Error("Couldn't read " + PAGE);
          return r.text();
        });
      })
      .then(function (source) {
        var html = patch(source);
        return post("save", { path: PAGE, html: html });
      })
      .then(function (res) {
        // Everything on screen now matches the files
        texts.forEach(function (t) { t.before = t.el.innerHTML; });
        images.forEach(function (s) {
          if (s.file) s.path = UP + "assets/" + s.file;
          if (!s.value) s.path = "";
          s.initial = s.value;
          s.file = null;
          s.initialAlt = s.alt;
        });
        accounts.forEach(function (a) { a.initialText = a.text; a.initialHref = a.href; });
        say(res.changed ? "Saved " + PAGE + ". Commit when you're ready." : "No changes to save.");
      })
      .catch(function (error) { say("Not saved: " + error.message); })
      .then(function () { saving = false; });
  }

  function post(route, body) {
    return fetch(SITE.href + "__edit/" + route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || "server said " + r.status);
        return data;
      });
    });
  }

  // Build the new file from the original text plus the edits
  function patch(source) {
    var doc = new DOMParser().parseFromString(source, "text/html");
    var all = Array.prototype.slice.call(doc.getElementsByTagName("*"));
    var spans = scan(source);
    if (spans.length !== all.length || spans.some(function (s, n) { return s.tag !== all[n].tagName.toLowerCase(); })) {
      throw new Error("couldn't line up the file's tags; edit this page in VS Code instead");
    }
    function span(sel, i) {
      var el = doc.querySelectorAll(sel)[i];
      if (!el) throw new Error("couldn't find " + sel + " in the file");
      return spans[all.indexOf(el)];
    }
    function indentOf(pos) {
      var lineStart = source.lastIndexOf("\n", pos - 1) + 1;
      return source.slice(lineStart, pos).match(/^\s*/)[0];
    }

    var edits = [];

    texts.forEach(function (t) {
      if (t.el.innerHTML === t.before) return;
      var s = span(t.sel, t.i);
      // Keep the file's own line breaks and indentation around the text
      var old = source.slice(s.openEnd, s.closeStart);
      var lead = old.match(/^\s*/)[0], trail = old.match(/\s*$/)[0];
      edits.push({ start: s.openEnd, end: s.closeStart, text: lead + clean(t.el).trim() + trail });
    });

    images.forEach(function (s) {
      var path = s.file ? UP + "assets/" + s.file : s.path; // new upload, or what's in the file
      var sp = span(s.sel, s.i);
      if (s.kind === "thumb") {
        if (s.value === s.initial) return;
        var inner = s.value ? '<img src="' + attr(path) + '" alt="">' : "";
        edits.push({ start: sp.openEnd, end: sp.closeStart, text: inner });
      } else {
        var changedImage = s.value && s.value !== s.initial;
        var changedAlt = s.value && s.alt !== s.initialAlt;
        if (!changedImage && !changedAlt) return;
        var pad = indentOf(sp.start);
        edits.push({
          start: sp.openEnd, end: sp.closeStart,
          text: "\n" + pad + "  " + '<img src="' + attr(path) + '" alt="' + attr(s.alt.trim()) + '">' + "\n" + pad,
        });
      }
    });

    accounts.forEach(function (a) {
      var sp = span(".account > a", a.i);
      if (a.href !== a.initialHref) {
        var tag = source.slice(sp.start, sp.openEnd);
        var m = /(\shref=")([^"]*)(")/.exec(tag);
        if (!m) throw new Error("couldn't find the account link's href");
        var at = sp.start + m.index + m[1].length;
        edits.push({ start: at, end: at + m[2].length, text: attr(a.href.trim()) });
      }
      if (a.text !== a.initialText) {
        var lead = /^[^<]*/.exec(source.slice(sp.openEnd, sp.closeStart))[0];
        edits.push({ start: sp.openEnd, end: sp.openEnd + lead.length, text: escapeText(a.text) });
      }
    });

    edits.sort(function (a, b) { return b.start - a.start; });
    var out = source;
    edits.forEach(function (e, n) {
      if (n && e.end > edits[n - 1].start) throw new Error("two edits overlap");
      out = out.slice(0, e.start) + e.text + out.slice(e.end);
    });
    return out;
  }

  // Tidy what contenteditable produced: no stray styles, spans or breaks
  function clean(el) {
    var copy = el.cloneNode(true);
    copy.querySelectorAll("[style], [contenteditable], [spellcheck]").forEach(function (n) {
      n.removeAttribute("style");
      n.removeAttribute("contenteditable");
      n.removeAttribute("spellcheck");
    });
    copy.querySelectorAll("span:not([class]), font").forEach(function (n) {
      if (n.attributes.length) return;
      n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes));
    });
    copy.querySelectorAll("b").forEach(function (n) {
      var strong = document.createElement("strong");
      strong.append.apply(strong, Array.prototype.slice.call(n.childNodes));
      n.replaceWith(strong);
    });
    copy.querySelectorAll("br").forEach(function (n) { n.remove(); });
    return copy.innerHTML.replace(/&nbsp;/g, " ");
  }

  // Element positions in the original text, in document order:
  // { tag, start, openEnd, closeStart }
  var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
  var RAW = /^(script|style|textarea|title)$/;

  function scan(src) {
    var els = [], stack = [], i = 0, n = src.length, lower = src.toLowerCase();
    while (i < n) {
      var lt = src.indexOf("<", i);
      if (lt === -1) break;
      if (src.startsWith("<!--", lt)) {
        var endComment = src.indexOf("-->", lt + 4);
        i = endComment === -1 ? n : endComment + 3;
        continue;
      }
      if (src[lt + 1] === "!" || src[lt + 1] === "?") {
        i = src.indexOf(">", lt) + 1 || n;
        continue;
      }
      if (src[lt + 1] === "/") {
        var close = /^<\/([A-Za-z][\w:-]*)\s*>/.exec(src.slice(lt, lt + 80));
        if (!close) { i = lt + 1; continue; }
        var closeTag = close[1].toLowerCase();
        for (var k = stack.length - 1; k >= 0; k--) {
          if (stack[k].tag === closeTag) { stack[k].closeStart = lt; stack.length = k; break; }
        }
        i = lt + close[0].length;
        continue;
      }
      var open = /^<([A-Za-z][\w:-]*)/.exec(src.slice(lt, lt + 80));
      if (!open) { i = lt + 1; continue; }
      var j = lt + open[0].length, quote = null;
      for (; j < n; j++) {
        var c = src[j];
        if (quote) { if (c === quote) quote = null; }
        else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
      }
      var tag = open[1].toLowerCase();
      var el = { tag: tag, start: lt, openEnd: j + 1 };
      els.push(el);
      i = j + 1;
      if (VOID.test(tag) || src[j - 1] === "/") { el.closeStart = el.openEnd; continue; }
      if (RAW.test(tag)) {
        el.closeStart = lower.indexOf("</" + tag, i);
        i = src.indexOf(">", el.closeStart) + 1;
        continue;
      }
      stack.push(el);
    }
    return els;
  }

  // ---------------------------------------------------------------- helpers

  function leadText(a) {
    var first = a.firstChild;
    return first && first.nodeType === 3 ? first.nodeValue : "";
  }

  function setLeadText(a, text) {
    var first = a.firstChild;
    if (first && first.nodeType === 3) first.nodeValue = text;
    else a.insertBefore(document.createTextNode(text), first);
  }

  function slug(text) {
    return String(text).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  }

  function label(text) {
    var words = String(text).replace(/\./g, "\u2024").replace(/[^A-Za-z0-9\u2024& ]+/g, " ").trim().split(/\s+/).filter(function (w) { return w !== "&"; }).slice(0, 2).join(" ").toLowerCase();
    return words || "Image";
  }

  function attr(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function escapeText(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var toastTimer;
  function say(message) {
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.style.opacity = "0"; }, 4000);
  }
})();
