/* ThinkWork site behaviour. Everything here is progressive: every page reads
   and works with JavaScript off, apart from the calculator and the chat. */
(function () {
  "use strict";

  // The app host that accepts this static site's forms and chat. GitHub Pages
  // cannot take a POST, so both go cross-origin to it.
  var API = "https://app.peerlab.ai";
  // Chat stays hidden until its endpoint is live. A chat button that errors
  // on every message is worse than no chat button.
  var CHAT_ENABLED = false;

  // ---- mobile nav ----
  var mb = document.querySelector(".menu-btn"), nav = document.querySelector(".nav");
  if (mb && nav) mb.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    mb.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // ---- reveal on scroll, with a safety net ----
  var rv = [].slice.call(document.querySelectorAll(".rv"));
  function showAll() { rv.forEach(function (el) { el.classList.add("in"); }); }
  if ("IntersectionObserver" in window && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 2500);
  } else { showAll(); }

  // ---- business-type picker ----
  document.querySelectorAll("[data-picker]").forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll("[role=tab]"));
    function pick(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(t); });
      t.addEventListener("keydown", function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length];
        pick(n); n.focus();
      });
    });
  });

  // ---- savings calculator ----
  var calc = document.querySelector("[data-calc]");
  if (calc) {
    var SETUP = 650, PLANS = { starter: ["Starter", 35], growth: ["Growth", 99] };
    var ins = [].slice.call(calc.querySelectorAll("input[data-cost]"));
    var fmt = function (n) { return "£" + Math.round(n).toLocaleString("en-GB"); };
    var out = function (k, v) { var el = calc.querySelector("[data-out=" + k + "]"); if (el) el.textContent = v; };
    function run() {
      var monthly = 0, extras = false, oneOff = 0;
      ins.forEach(function (i) {
        var v = Math.max(0, parseFloat(i.value) || 0);
        if (i.dataset.cost === "once") oneOff += v;
        else { monthly += v; if (i.dataset.cost === "extra" && v > 0) extras = true; }
      });
      var plan = extras ? PLANS.growth : PLANS.starter;
      var yourYear = monthly * 12 + oneOff, ourYear = plan[1] * 12 + SETUP;
      out("monthly", fmt(monthly)); out("oneoff", fmt(oneOff)); out("year", fmt(yourYear));
      out("plan", plan[0]); out("planm", fmt(plan[1])); out("ouryear", fmt(ourYear));
      out("year2", fmt(monthly * 12)); out("ouryear2", fmt(plan[1] * 12));
      var v = calc.querySelector("[data-out=verdict]");
      if (!monthly && !oneOff) { v.textContent = "Fill in what you pay now. Leave anything you don't pay for at zero."; return; }
      var y1 = yourYear - ourYear, y2 = (monthly - plan[1]) * 12;
      if (y1 >= 0) v.textContent = "You'd save " + fmt(y1) + " in year one, and " + fmt(Math.max(y2, 0)) + " a year after that. Before any new money it brings in.";
      else if (y2 > 0) v.textContent = "Year one costs " + fmt(-y1) + " more, because of the setup fee. From year two you'd save " + fmt(y2) + " a year.";
      else v.textContent = "On price alone you're paying less than we charge. The case for you is the money you're not making yet, not what you'd save. Ask us what that could look like.";
      var q = calc.querySelector("[data-quote-link]");
      if (q) q.href = "/book/?spend=" + Math.round(monthly) + "#quote";
    }
    ins.forEach(function (i) { i.addEventListener("input", run); });
    run();
  }

  // ---- forms: show the error banner and carry values across ----
  var params = new URLSearchParams(location.search);
  if (params.get("error")) document.querySelectorAll(".alert").forEach(function (a) { a.hidden = false; });
  var spend = params.get("spend"), sp = document.querySelector("[name=monthly_spend]");
  if (spend && sp && !sp.value) sp.value = spend;
  var biz = params.get("type"), bt = document.querySelector("[name=business_type]");
  if (biz && bt) bt.value = biz;
  document.querySelectorAll("form[data-return]").forEach(function (f) {
    var r = f.querySelector("[name=return_to]");
    if (r) r.value = location.origin + f.getAttribute("data-return");
  });

  // ---- chat ----
  if (!CHAT_ENABLED) return;
  var history = [];
  var launch = document.createElement("button");
  launch.className = "chat-launch"; launch.type = "button";
  launch.innerHTML = "<i></i>Ask us anything";
  var box = document.createElement("div");
  box.className = "chat-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Chat with ThinkWork");
  box.innerHTML =
    '<div class="chat-head"><div><b>ThinkWork</b><span>AI assistant. Greg reads every enquiry.</span></div><button type="button" aria-label="Close chat">&times;</button></div>' +
    '<div class="chat-log" aria-live="polite"></div>' +
    '<form class="chat-form"><input name="q" autocomplete="off" maxlength="600" placeholder="Type a question" aria-label="Your message"><button>Send</button></form>' +
    '<div class="chat-note">Answers come from an AI. Prices and details on this site are the final word.</div>';
  document.body.appendChild(launch); document.body.appendChild(box);
  var log = box.querySelector(".chat-log"), form = box.querySelector("form"), input = form.q;
  function say(text, who) {
    var m = document.createElement("div"); m.className = "msg " + who; m.textContent = text;
    log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  launch.addEventListener("click", function () {
    box.classList.add("open"); launch.style.display = "none";
    if (!log.children.length) say("Hi. I can answer questions about what we build, what it costs, and what might earn your business more. What kind of business do you run?", "bot");
    input.focus();
  });
  box.querySelector(".chat-head button").addEventListener("click", function () { box.classList.remove("open"); launch.style.display = ""; });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q) return;
    input.value = ""; say(q, "me"); history.push({ role: "user", content: q });
    var wait = say("…", "bot");
    fetch(API + "/api/thinkwork/chat", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12), page: location.pathname })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || "failed");
      wait.textContent = d.reply; history.push({ role: "assistant", content: d.reply });
    }).catch(function () {
      wait.className = "msg bot err";
      wait.textContent = "Sorry, the assistant isn't answering right now. Use the quote form and Greg will get back to you.";
    });
  });
})();
