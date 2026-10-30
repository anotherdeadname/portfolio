// Spacing tuner (development only).
// Open any page with ?tune at the end of the URL to show a DialKit panel
// with sliders for the layout spacing in styles.css. Without ?tune this
// file does nothing. Values persist in this browser; use the panel's Copy
// button to export them, then update the defaults in styles.css.

(function () {
  if (!new URLSearchParams(location.search).has("tune")) return;

  var CDN = "https://cdn.jsdelivr.net/npm/dialkit@2.0.0/dist/vanilla/";

  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = CDN + "styles.css";
  document.head.appendChild(css);

  var script = document.createElement("script");
  script.src = CDN + "browser.global.js";
  script.onload = mount;
  document.head.appendChild(script);

  function mount() {
    var root = document.documentElement;

    window.DialKit.createDialRoot({ position: "bottom-right" });

    // [default, min, max, step] in px, matching the defaults in styles.css
    var kit = window.DialKit.createDialKit(
      "Spacing",
      {
        column: [600, 480, 800, 8],
        page: {
          headerPad: [24, 0, 64, 4],
          introTop: [24, 0, 96, 4],
          sectionGap: [40, 8, 120, 4],
          labelGap: [8, 0, 32, 4],
          footerTop: [40, 8, 120, 4],
        },
        rows: {
          workThumb: [96, 48, 160, 8],
          rowPad: [8, 0, 32, 2],
          thumbToText: [16, 4, 48, 2],
          titleToDesc: [4, 0, 16, 1],
        },
      },
      { id: "portfolio-spacing", persist: true }
    );

    kit.subscribe(function (v) {
      var px = function (n) { return n + "px"; };
      root.style.setProperty("--column", "calc(" + px(v.column) + " + 2 * var(--gutter))");
      root.style.setProperty("--header-pad", px(v.page.headerPad));
      root.style.setProperty("--intro-top", px(v.page.introTop));
      root.style.setProperty("--section-gap", px(v.page.sectionGap));
      root.style.setProperty("--label-gap", px(v.page.labelGap));
      root.style.setProperty("--footer-top", px(v.page.footerTop));
      root.style.setProperty("--thumb-w", px(v.rows.workThumb));
      root.style.setProperty("--row-pad", px(v.rows.rowPad));
      root.style.setProperty("--row-col-gap", px(v.rows.thumbToText));
      root.style.setProperty("--row-text-gap", px(v.rows.titleToDesc));
    });

    // Case pages get a second panel for the space above and inside a case
    if (document.body.classList.contains("case-page")) {
      var caseKit = window.DialKit.createDialKit(
        "Case spacing",
        {
          caseTop: [24, 0, 160, 4],
          heroToTitle: [40, 8, 120, 4],
          titleToSummary: [16, 0, 48, 2],
          summaryToMeta: [24, 0, 64, 4],
          metaToBullets: [40, 8, 96, 4],
          betweenBullets: [16, 0, 40, 2],
          bulletsToPager: [64, 16, 160, 8],
        },
        { id: "portfolio-case-spacing", persist: true }
      );

      caseKit.subscribe(function (v) {
        var px = function (n) { return n + "px"; };
        root.style.setProperty("--case-top", px(v.caseTop));
        root.style.setProperty("--case-hero-gap", px(v.heroToTitle));
        root.style.setProperty("--case-title-gap", px(v.titleToSummary));
        root.style.setProperty("--case-summary-gap", px(v.summaryToMeta));
        root.style.setProperty("--case-meta-gap", px(v.metaToBullets));
        root.style.setProperty("--case-bullet-gap", px(v.betweenBullets));
        root.style.setProperty("--case-pager-gap", px(v.bulletsToPager));
      });
    }
  }
})();
