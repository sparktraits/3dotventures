/* 3DOT Ventures — site behavior */
(function () {
  // Where the contact form sends leads. Point this at the 3DOT CRM's /api/lead
  // endpoint once it's deployed (and allows this origin via CORS). Until then
  // the form falls back to opening an email to CONTACT_EMAIL.
  const CONFIG = {
    leadEndpoint: "", // e.g. "https://crm.3dotventures.com/api/lead"
    workspace: "3dot",
    page: "website-contact",
    contactEmail: "hello@3dotventures.com",
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Nav
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  $("#burger").addEventListener("click", (e) => {
    const open = nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  $$(".nav ul a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  // Count-up numbers
  const fmt = (n) => n.toLocaleString("en-US");
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const end = +el.dataset.count;
    const dur = 1400;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Reveal on scroll
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal, #rail, #gantt").forEach((el) => io.observe(el));

  // Revenue leak estimator
  const ids = ["leads", "value", "close", "lift"];
  const inputs = Object.fromEntries(ids.map((k) => [k, $("#c-" + k)]));
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  function paint(el) {
    const p = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--p", p + "%");
  }
  function calc() {
    const leads = +inputs.leads.value;
    const value = +inputs.value.value;
    const close = +inputs.close.value;
    // Lift can't push close rate past 100%
    const lift = Math.min(+inputs.lift.value, 100 - close);
    $("#o-leads").textContent = fmt(leads);
    $("#o-value").textContent = money(value);
    $("#o-close").textContent = close + "%";
    $("#o-lift").textContent = "+" + lift + " pts";
    const cust = (leads * lift) / 100;
    const month = cust * value;
    $("#r-cust").textContent = cust >= 10 ? fmt(Math.round(cust)) : cust.toFixed(1);
    $("#r-month").textContent = money(month);
    $("#r-year").textContent = money(month * 12);
    $("#r-math").textContent = `${fmt(leads)} leads × ${lift}% lift × ${money(value)} × 12 months`;
    ids.forEach((k) => paint(inputs[k]));
  }
  ids.forEach((k) => inputs[k].addEventListener("input", calc));
  calc();

  // Platform tabs
  const tabs = $$(".tab");
  function show(id) {
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.pane === id));
    $$(".pane").forEach((p) => p.classList.toggle("on", p.id === id));
    $$(".side a[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === id));
  }
  tabs.forEach((t) => t.addEventListener("click", () => { show(t.dataset.pane); stopAuto(); }));
  $$(".side a[data-nav]").forEach((a) => a.addEventListener("click", () => { show(a.dataset.nav); stopAuto(); }));
  // Gently rotate tabs until the visitor clicks one
  let i = 0;
  let timer = setInterval(() => {
    const app = $(".app").getBoundingClientRect();
    if (app.top > innerHeight || app.bottom < 0) return;
    i = (i + 1) % tabs.length;
    show(tabs[i].dataset.pane);
  }, 6000);
  function stopAuto() { clearInterval(timer); }

  // Contact form
  const form = $("#leadForm");
  const msg = $("#formMsg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    msg.className = "msg full";
    if (d.company) return; // honeypot
    if (!d.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
      msg.classList.add("err");
      msg.textContent = "Please add your name and a valid email.";
      return;
    }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.firstChild.textContent = "Sending… ";
    const note = [`Business: ${d.business || "-"}`, `Headache: ${d.topic}`, d.message].filter(Boolean).join("\n");

    let sent = false;
    if (CONFIG.leadEndpoint) {
      try {
        const r = await fetch(CONFIG.leadEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ws: CONFIG.workspace, page: CONFIG.page,
            name: d.name, email: d.email, phone: d.phone,
            sms_consent: d.sms_consent === "on", company: d.company, note,
          }),
        });
        sent = r.ok;
      } catch (_) { sent = false; }
    }

    if (sent) {
      form.reset();
      msg.classList.add("ok");
      msg.textContent = "Got it. We'll be in touch within one business day · · ·";
      btn.firstChild.textContent = "Sent ";
    } else {
      const body = encodeURIComponent(`Name: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone || "-"}\n${note}`);
      location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent("Diagnostic call request: " + (d.business || d.name))}&body=${body}`;
      msg.classList.add("ok");
      msg.textContent = "Opening your email app so you can send this to us.";
      btn.disabled = false;
      btn.firstChild.textContent = "Book my diagnostic ";
    }
  });

  $("#yr").textContent = new Date().getFullYear();
})();
