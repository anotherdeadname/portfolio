// Articles: work and side-project pages open as a layer over the home page.
//
// On the home page, clicking a row fetches that page (e.g. work/dropbox.html),
// takes its <article> and shows it in a dialog over the blurred, dimmed home
// page. The address bar changes to the page's URL, so the link can be shared
// and the browser's Back button closes it. The back button, Escape and a
// click on the blurred background close it too.
//
// On a case or side-project page (loaded in <head>), this sends the visitor
// to the home page with ?open=work/dropbox.html, which then shows the article
// over the home page. The pages themselves stay complete HTML, so they still
// work without JavaScript, and with ?edit, ?tune or ?solo they open on their
// own (for the in-browser editor and the spacing tuner).

(function () {
  var script = document.currentScript;
  var HOME_DIR = new URL(".", script.src).href;     // ".../portfolio/"
  var HOME = HOME_DIR + "index.html";
  var BASE_PATH = new URL(HOME_DIR).pathname;
  var PAGE_RE = /^(?:work|side)\/[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;
  var LEAVE_MS = 300;                                // matches the close animation in styles.css

  var params = new URLSearchParams(location.search);
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // "work/dropbox.html" for an article URL on this site, otherwise null
  function pathOf(href) {
    var url = new URL(href, location.href);
    if (url.origin !== location.origin || url.pathname.indexOf(BASE_PATH) !== 0) return null;
    var rest = url.pathname.slice(BASE_PATH.length);
    return PAGE_RE.test(rest) ? rest : null;
  }

  // --- On an article page: hand over to the home page -------------------

  var here = pathOf(location.href);
  if (here) {
    if (!params.has("edit") && !params.has("tune") && !params.has("solo")) {
      location.replace(HOME + "?open=" + encodeURIComponent(here));
    }
    return;
  }

  // --- On the home page --------------------------------------------------

  if (params.has("edit")) return; // the editor follows links to the full pages

  // The address bar shows an article's URL while it's open. A <base> keeps the
  // home page's own relative links and images pointing at the right files.
  var base = document.createElement("base");
  base.href = HOME;
  document.head.prepend(base);

  var homeUrl = location.href;
  var initial = params.get("open");
  if (initial && PAGE_RE.test(initial)) {
    params.delete("open");
    var query = params.toString();
    homeUrl = HOME + (query ? "?" + query : "");
    root.classList.add("has-article");
    history.replaceState(null, "", HOME_DIR + initial);
  } else {
    initial = null;
  }

  var sheet = null;      // the open dialog
  var current = null;    // its path, e.g. "work/dropbox.html"
  var opener = null;     // the row to return focus to
  var closing = 0;       // timer while the close animation plays
  var inerted = [];
  var homeTitle = "";
  var cache = {};

  function load(path) {
    if (!cache[path]) {
      cache[path] = fetch(HOME_DIR + path).then(function (response) {
        if (!response.ok) throw new Error(response.status);
        return response.text();
      });
      cache[path].catch(function () { delete cache[path]; });
    }
    return cache[path];
  }

  function rowFor(path) {
    var rows = document.querySelectorAll("a.row[href]");
    for (var i = 0; i < rows.length; i++) {
      if (pathOf(rows[i].href) === path) return rows[i];
    }
    return null;
  }

  // Shell first (blur, back button), so it starts animating straight away
  function shell(path) {
    var el = document.createElement("div");
    el.className = "sheet case-page";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", rowTitle(path));
    el.tabIndex = -1;
    el.innerHTML =
      '<div class="sheet-backdrop"></div>' +
      '<button class="back" type="button" aria-label="Back to home">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg></button>" +
      '<div class="case"></div>';

    var downInArticle = false;
    el.addEventListener("pointerdown", function (event) {
      downInArticle = !!event.target.closest("article");
    });
    el.addEventListener("click", function (event) {
      if (event.target.closest(".back")) return requestClose();
      if (!event.target.closest("article") && !downInArticle) requestClose();
    });
    el.addEventListener("scroll", function () {
      root.classList.toggle("is-scrolled", el.scrollTop > 0);
    }, { passive: true });
    return el;
  }

  function rowTitle(path) {
    var row = rowFor(path);
    var title = row && row.querySelector(".row-title");
    return title ? title.textContent.trim() : "Article";
  }

  // Move the fetched page's <article> into the dialog
  function fill(el, html, path) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var article = doc.querySelector("main article") || doc.querySelector("article");
    if (!article) throw new Error("No article in " + path);

    // Its links and images are relative to the page, so make them absolute
    var pageUrl = HOME_DIR + path;
    article.querySelectorAll("[href], [src], [poster]").forEach(function (node) {
      ["href", "src", "poster"].forEach(function (name) {
        var value = node.getAttribute(name);
        if (value && value.charAt(0) !== "#") node.setAttribute(name, new URL(value, pageUrl).href);
      });
    });
    article.querySelectorAll("[srcset]").forEach(function (node) {
      node.setAttribute("srcset", node.getAttribute("srcset").split(",").map(function (part) {
        var bits = part.trim().split(/\s+/);
        bits[0] = new URL(bits[0], pageUrl).href;
        return bits.join(" ");
      }).join(", "));
    });

    var back = doc.querySelector(".back");
    if (back && back.getAttribute("aria-label")) {
      el.querySelector(".back").setAttribute("aria-label", back.getAttribute("aria-label"));
    }
    if (doc.title) document.title = doc.title;

    article = el.querySelector(".case").appendChild(document.importNode(article, true));

    var title = article.querySelector("h1");
    if (title) {
      title.id = "sheet-title";
      title.tabIndex = -1;
      el.removeAttribute("aria-label");
      el.setAttribute("aria-labelledby", "sheet-title");
    }
    if (el.contains(document.activeElement) || document.activeElement === document.body) {
      (title || el).focus({ preventScroll: true });
    }
  }

  function lock() {
    root.classList.add("has-article");
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child === sheet || child.inert || child.tagName === "SCRIPT") return;
      child.inert = true;
      inerted.push(child);
    });
  }

  function unlock() {
    root.classList.remove("has-article", "is-scrolled");
    inerted.forEach(function (child) { child.inert = false; });
    inerted = [];
  }

  function removeNow() {
    clearTimeout(closing);
    closing = 0;
    if (sheet) sheet.remove();
    sheet = null;
    current = null;
    unlock();
  }

  function open(path, push, from) {
    if (sheet && current === path && !closing) return;
    var returnTo = from || (sheet ? opener : null) || rowFor(path);
    if (!sheet) homeTitle = document.title;
    if (sheet) removeNow();

    current = path;
    opener = returnTo;
    if (push) history.pushState({ article: path, pushed: true }, "", HOME_DIR + path);

    var el = sheet = shell(path);
    document.body.appendChild(el);
    lock();
    el.focus({ preventScroll: true });

    load(path).then(function (html) {
      if (sheet === el) fill(el, html, path);
    }).catch(function () {
      // Couldn't fetch it: show the page on its own instead
      if (sheet === el) location.assign(HOME_DIR + path + "?solo");
    });
  }

  // Close through history when this page added the entry, so Back and
  // Forward stay in step; otherwise add a home entry (shared links).
  function requestClose() {
    if (!sheet || closing) return;
    var state = history.state;
    if (state && state.pushed && state.article === current) {
      history.back();
    } else {
      history.pushState(null, "", homeUrl);
      close();
    }
  }

  function close() {
    if (!sheet || closing) return;
    var el = sheet;
    var returnTo = opener;
    document.title = homeTitle;
    root.classList.remove("is-scrolled");

    function finish() {
      if (sheet !== el) return;
      removeNow();
      if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
    }

    if (reduced.matches) return finish();
    el.classList.add("is-leaving");
    closing = setTimeout(finish, LEAVE_MS);
  }

  window.addEventListener("popstate", function () {
    var path = pathOf(location.href);
    if (path) open(path, false);
    else close();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sheet && !event.defaultPrevented) {
      event.preventDefault();
      requestClose();
    }
  });

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    var path = pathOf(link.href);
    if (!path) return;
    event.preventDefault();
    open(path, true, sheet && sheet.contains(link) ? opener : link);
  });

  // Start fetching when a row is pointed at or focused, so it opens instantly
  function prefetch(event) {
    var link = event.target.closest && event.target.closest("a.row[href]");
    var path = link && pathOf(link.href);
    if (path) load(path).catch(function () {});
  }
  document.addEventListener("pointerover", prefetch);
  document.addEventListener("focusin", prefetch);

  if (initial) {
    document.addEventListener("DOMContentLoaded", function () {
      open(initial, false);
    });
  }
})();
