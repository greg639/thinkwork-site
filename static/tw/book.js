/* Book a 30-minute Google Meet call with Greg, from the thanks pages.
   Slots come from the app host; booking creates the event in Greg's calendar
   and Google emails the invite. If online booking isn't switched on, or the
   times can't load, the page keeps its plain "Greg will email you" message. */
(function () {
  "use strict";
  var API = "https://app.peerlab.ai";
  var box = document.getElementById("book-call");
  if (!box) return;
  var params = new URLSearchParams(location.search);
  var ref = params.get("ref") || "";
  var source = box.getAttribute("data-source") || "main";
  var fallback = document.getElementById("book-fallback");
  var chosen = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render(days) {
    box.innerHTML = "";
    box.appendChild(el("h2", "bk-title", "Pick a time to talk"));
    box.appendChild(el("p", "bk-sub", "30 minutes on Google Meet with Greg. UK time."));
    var dayRow = el("div", "bk-days"), timeRow = el("div", "bk-times");
    dayRow.setAttribute("role", "tablist"); dayRow.setAttribute("aria-label", "Day");
    var who = null;
    if (!ref) {
      who = el("div", "bk-who");
      who.innerHTML = '<label for="bk-name">Your name</label><input id="bk-name" type="text" autocomplete="name" maxlength="120">' +
                      '<label for="bk-email">Email</label><input id="bk-email" type="email" autocomplete="email" maxlength="254">';
    }
    var go = el("button", "bk-go", "Pick a time above");
    go.type = "button"; go.disabled = true;
    var msg = el("p", "bk-msg"); msg.setAttribute("role", "status");

    function showDay(i) {
      [].forEach.call(dayRow.children, function (b, j) { b.setAttribute("aria-selected", i === j ? "true" : "false"); });
      timeRow.innerHTML = "";
      days[i].slots.forEach(function (s) {
        var t = el("button", "bk-time", s.label); t.type = "button";
        t.addEventListener("click", function () {
          [].forEach.call(timeRow.children, function (x) { x.setAttribute("aria-pressed", "false"); });
          t.setAttribute("aria-pressed", "true");
          chosen = s.start;
          go.disabled = false;
          go.textContent = "Book " + days[i].day_label + " at " + s.label;
        });
        timeRow.appendChild(t);
      });
    }
    days.forEach(function (d, i) {
      var b = el("button", "bk-day", d.day_label); b.type = "button"; b.setAttribute("role", "tab");
      b.addEventListener("click", function () { chosen = null; go.disabled = true; go.textContent = "Pick a time above"; showDay(i); });
      dayRow.appendChild(b);
    });

    go.addEventListener("click", function () {
      if (!chosen) return;
      var body = { ref: ref, slot: chosen, source: source };
      if (who) {
        body.full_name = document.getElementById("bk-name").value.trim();
        body.email = document.getElementById("bk-email").value.trim();
      }
      go.disabled = true; go.textContent = "Booking…"; msg.textContent = "";
      fetch(API + "/api/thinkwork/book", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.ok) {
          msg.textContent = d.error || "That didn't work. Try another time.";
          go.disabled = false; go.textContent = "Try again";
          if (/gone/i.test(d.error || "")) load();
          return;
        }
        box.innerHTML = "";
        box.appendChild(el("h2", "bk-title", "Booked."));
        box.appendChild(el("p", "bk-done", d.when));
        box.appendChild(el("p", "bk-sub", d.invited
          ? "Google has sent the invite, with the Meet link, to " + d.email + "."
          : "Greg will send the invite, with the Meet link, to " + d.email + " shortly."));
      }).catch(function () {
        msg.textContent = "Couldn't reach the booking system. Greg will email you to arrange a time.";
        go.disabled = false; go.textContent = "Try again";
      });
    });

    box.appendChild(dayRow); box.appendChild(timeRow);
    if (who) box.appendChild(who);
    box.appendChild(go); box.appendChild(msg);
    showDay(0);
  }

  function load() {
    fetch(API + "/api/thinkwork/book/slots").then(function (r) { return r.json(); }).then(function (d) {
      if (!d.enabled || !d.days || !d.days.length) return;
      if (fallback) fallback.hidden = true;
      box.hidden = false;
      render(d.days);
    }).catch(function () { /* keep the fallback message */ });
  }
  load();
})();
