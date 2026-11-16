// Light and dark toggle.
// Dark by default; once the visitor picks a theme, that choice is
// remembered via data-theme on <html> and localStorage.
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
  root.dataset.theme = stored === "light" ? "light" : "dark";

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
