// Case pages: play a short close animation before leaving through the
// back button or the previous/next links. The browser's own Back button
// can't be delayed, so it simply navigates. Skipped for reduced motion.

(function () {
  var LEAVE_MS = 260;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a.back, .pager a");
    if (!link || reduced.matches) return;
    // Let new-tab and modified clicks behave normally
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (link.target && link.target !== "_self") return;

    event.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(function () {
      window.location.href = link.href;
    }, LEAVE_MS);
  });

  // Coming back via the browser's history cache: show the page again
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) document.body.classList.remove("is-leaving");
  });
})();
