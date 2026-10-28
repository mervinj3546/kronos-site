// Kronos marketing site: scroll reveal and the beta signup form.
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  // Reveal sections as they scroll into view.
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          seen.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { seen.observe(el); });
  }

  // Beta signup. The form posts JSON to data-endpoint. Until a backend is
  // connected the attribute is empty and the form says so instead of
  // pretending the signup went through.
  var form = document.getElementById("beta-form");
  if (!form) return;
  var msg = form.querySelector(".form__msg");
  var button = form.querySelector("button[type=submit]");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // ?src= tags where the visitor came from (x for tweets); the server cleans it.
  var source = new URLSearchParams(location.search).get("src") || "direct";

  // Count the visit by source. sendBeacon posts text/plain, so no CORS preflight.
  var visitUrl = form.getAttribute("data-visit");
  if (visitUrl && navigator.sendBeacon) {
    try { navigator.sendBeacon(visitUrl, JSON.stringify({ source: source })); } catch (e) { /* not critical */ }
  }

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "form__msg" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = form.email.value.trim();
    var style = form.trading.value;
    form.email.setAttribute("aria-invalid", String(!EMAIL.test(email)));
    form.trading.setAttribute("aria-invalid", String(!style));
    if (!EMAIL.test(email)) { say("Enter a valid email address.", "err"); form.email.focus(); return; }
    if (!style) { say("Choose how you trade.", "err"); form.trading.focus(); return; }
    if (form.company.value) { say("Thanks. You're on the list.", "ok"); return; } // honeypot

    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) { say("Signup isn't connected yet. Please check back soon.", "err"); return; }

    button.disabled = true;
    say("Sending…");
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // simple request, no CORS preflight
      body: JSON.stringify({ email: email, style: style, source: source })
    }).then(function (response) {
      if (!response.ok) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          var error = new Error(data.error || "");
          error.fromServer = true;
          throw error;
        });
      }
      form.reset();
      say("Thanks. You're on the list, and we'll email you when your spot opens.", "ok");
    }).catch(function (error) {
      say((error.fromServer && error.message) || "Something went wrong. Please try again in a minute.", "err");
    }).finally(function () {
      button.disabled = false;
    });
  });
})();
