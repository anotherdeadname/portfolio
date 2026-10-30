// Light and dark toggle.
// Follows the system setting until the visitor picks a theme, then
// remembers that choice via data-theme on <html> and localStorage.
// Loaded in <head> (not deferred) so the saved theme applies before paint.

(function () {
  var KEY = "theme";
  var root = document.documentElement;
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function saved() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function current() {
    return root.dataset.theme || (systemDark.matches ? "dark" : "light");
  }

  function updateButton() {
    var button = document.querySelector(".theme-toggle");
    if (!button) return;
    var next = current() === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", "Switch to " + next + " theme");
  }

  var stored = saved();
  if (stored === "light" || stored === "dark") {
    root.dataset.theme = stored;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".theme-toggle");
    if (!button) return;

    updateButton();

    button.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {}
      updateButton();
    });
  });

  systemDark.addEventListener("change", updateButton);
})();
