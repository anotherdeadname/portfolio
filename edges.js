// Edge blur: mark the page as scrolled so the top blur band fades in.
// The bottom band is always visible (see the end of styles.css).

(function () {
  var root = document.documentElement;

  function update() {
    root.classList.toggle("is-scrolled", window.scrollY > 0);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
})();
