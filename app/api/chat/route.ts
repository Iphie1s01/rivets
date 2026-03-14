import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const runtime = "edge";

const HTML_TEMPLATE = `<!DOCTYPE html>
<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║              BASE LANDING PAGE TEMPLATE — Single-file edition                ║
║                                                                              ║
║  HOW TO CUSTOMIZE:                                                           ║
║  1. Edit the SITE CONFIG block in the <script> section (bottom of file)      ║
║  2. Swap colors/fonts in the :root CSS block                                 ║
║  3. All section content is clearly labeled with <!-- EDIT: ... --> markers   ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <!-- ═══════════════════════════════════════════════
       EDIT: Page title & meta description
  ═══════════════════════════════════════════════ -->
  <title>YourBrand — Your Tagline Here</title>
  <meta name="description" content="Your meta description here. Keep under 160 characters for SEO.">

  <!-- ═══════════════════════════════════════════════
       EDIT: Fonts
       Replace the Google Fonts URL below to change fonts.
       Current: Cormorant Garamond (display) + DM Mono (body)
       Alternatives:
         Display: Playfair Display, Libre Baskerville, Fraunces
         Body:    Space Mono, IBM Plex Mono, Fira Code, Inter
  ═══════════════════════════════════════════════ -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">

  <style>

    /* ════════════════════════════════════════════════════════════
       DESIGN TOKENS — Edit these to retheme the entire page
       ════════════════════════════════════════════════════════════ */
    :root {
      /* --- Colors --- */
      --bg:         #080808;        /* Page background */
      --surface:    #111111;        /* Card / hover background */
      --border:     rgba(255,255,255,0.07); /* Subtle dividers */
      --text:       #f0ede6;        /* Primary text */
      --muted:      rgba(240,237,230,0.38); /* Secondary / placeholder text */
      --accent:     #c8f060;        /* Brand accent (buttons, highlights) */
      --accent-dim: rgba(200,240,96,0.12);  /* Transparent accent for hover fills */

      /* --- Typography --- */
      --font-display: 'Cormorant Garamond', Georgia, serif; /* Headlines */
      --font-body:    'DM Mono', monospace;                 /* Body / UI text */

      /* --- Spacing --- */
      --page-padding: 48px;   /* Horizontal page gutter */
      --section-gap:  120px;  /* Vertical section spacing */
    }

    /* ════════════════════════════════════════════════════════════
       BASE RESET & GLOBAL STYLES — Safe to leave as-is
       ════════════════════════════════════════════════════════════ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      font-weight: 300;
      font-size: 13px;
      line-height: 1.7;
      overflow-x: hidden;
      cursor: none; /* hides default cursor; custom cursor below */
    }

    /* ── Custom cursor (remove .cursor div + this block to disable) ── */
    .cursor {
      position: fixed; top: 0; left: 0;
      width: 10px; height: 10px;
      background: var(--accent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: width 0.3s ease, height 0.3s ease;
      mix-blend-mode: difference;
    }
    .cursor.hover { width: 40px; height: 40px; }

    /* ── Noise texture overlay (remove body::before to disable) ── */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.028; /* Increase for more grain, decrease to reduce */
      pointer-events: none;
      z-index: 1000;
    }

    /* ════════════════════════════════════════════════════════════
       COMPONENTS
       ════════════════════════════════════════════════════════════ */

    /* ── Buttons ── */
    .btn-primary {
      background: var(--accent);
      color: var(--bg);
      font-family: var(--font-body);
      font-size: 11px; font-weight: 400;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 14px 32px;
      border: none; cursor: none;
      text-decoration: none; display: inline-block;
      position: relative; overflow: hidden;
      transition: transform 0.2s ease;
    }
    .btn-primary::after {
      content: ''; position: absolute; inset: 0;
      background: rgba(0,0,0,0.12);
      transform: translateX(-101%);
      transition: transform 0.3s ease;
    }
    .btn-primary:hover::after { transform: translateX(0); }
    .btn-primary:hover { transform: translateY(-1px); }

    .btn-outline {
      border: 1px solid var(--border); background: transparent;
      color: var(--text); font-family: var(--font-body);
      font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 10px 22px; cursor: none;
      transition: border-color 0.3s, background 0.3s;
      text-decoration: none; display: inline-block;
    }
    .btn-outline:hover { border-color: var(--accent); background: var(--accent-dim); }

    /* ── Section label / title pattern ── */
    .section-label {
      font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--accent);
      margin-bottom: 16px;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: clamp(36px, 4vw, 56px);
      font-weight: 300; letter-spacing: -0.01em; line-height: 1.1;
    }

    /* ── Scroll reveal ── */
    .reveal {
      opacity: 0; transform: translateY(24px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .reveal.visible { opacity: 1; transform: translateY(0); }

    /* ════════════════════════════════════════════════════════════
       NAVIGATION
       ════════════════════════════════════════════════════════════ */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px var(--page-padding);
      border-bottom: 1px solid transparent;
      transition: border-color 0.4s, backdrop-filter 0.4s, background 0.4s;
    }
    nav.scrolled {
      border-color: var(--border);
      backdrop-filter: blur(20px);
      background: rgba(8,8,8,0.75);
    }
    .nav-logo {
      font-family: var(--font-display); font-size: 22px; font-weight: 300;
      letter-spacing: 0.04em; color: var(--text); text-decoration: none;
      opacity: 0; animation: fadeUp 0.8s 0.1s forwards;
    }
    .nav-links {
      display: flex; gap: 36px; list-style: none;
      opacity: 0; animation: fadeUp 0.8s 0.2s forwards;
    }
    .nav-links a {
      color: var(--muted); text-decoration: none;
      font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      transition: color 0.3s;
    }
    .nav-links a:hover { color: var(--text); }
    .nav-cta { opacity: 0; animation: fadeUp 0.8s 0.3s forwards; }

    /* ════════════════════════════════════════════════════════════
       HERO SECTION
       ════════════════════════════════════════════════════════════ */
    .hero {
      min-height: 100vh;
      display: grid; grid-template-rows: 1fr auto;
      padding: 0 var(--page-padding);
      position: relative; overflow: hidden;
    }
    .hero-content {
      display: flex; flex-direction: column; justify-content: center;
      padding-top: 120px; max-width: 900px;
    }
    .hero-label {
      font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--accent);
      margin-bottom: 32px;
      opacity: 0; animation: fadeUp 0.9s 0.4s forwards;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(64px, 9vw, 130px);
      font-weight: 300; line-height: 0.95;
      letter-spacing: -0.02em; margin-bottom: 40px;
      opacity: 0; animation: fadeUp 1s 0.55s forwards;
    }
    .hero-title em { font-style: italic; color: var(--muted); }
    .hero-sub {
      font-size: 13px; color: var(--muted);
      max-width: 360px; line-height: 1.9; margin-bottom: 52px;
      opacity: 0; animation: fadeUp 0.9s 0.7s forwards;
    }
    .hero-actions {
      display: flex; align-items: center; gap: 32px;
      opacity: 0; animation: fadeUp 0.9s 0.85s forwards;
    }
    .hero-link {
      color: var(--muted); font-size: 11px; letter-spacing: 0.08em;
      text-decoration: none; display: flex; align-items: center; gap: 8px;
      transition: color 0.3s;
    }
    .hero-link:hover { color: var(--text); }
    .hero-link .arrow { transition: transform 0.3s; display: inline-block; }
    .hero-link:hover .arrow { transform: translateX(4px); }

    /* Decorative large background number/word */
    .hero-bg-num {
      position: absolute; right: -40px; top: 50%; transform: translateY(-50%);
      font-family: var(--font-display);
      font-size: clamp(260px, 30vw, 440px);
      font-weight: 300;
      color: rgba(255,255,255,0.025);
      line-height: 1; pointer-events: none; user-select: none;
      letter-spacing: -0.05em;
    }

    /* Scrolling ticker at hero bottom */
    .hero-ticker {
      border-top: 1px solid var(--border);
      overflow: hidden; white-space: nowrap; padding: 18px 0;
      opacity: 0; animation: fadeUp 0.9s 1s forwards;
    }
    .ticker-track { display: inline-flex; animation: ticker 28s linear infinite; }
    .ticker-item {
      font-size: 10px; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--muted);
      padding: 0 48px;
    }
    .ticker-item .star { color: var(--accent); margin-right: 8px; }

    /* ════════════════════════════════════════════════════════════
       STATS BAR
       ════════════════════════════════════════════════════════════ */
    .stats {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      display: grid; grid-template-columns: repeat(3, 1fr);
      padding: 0 var(--page-padding);
    }
    .stat {
      padding: 52px 48px;
      border-right: 1px solid var(--border);
    }
    .stat:first-child { padding-left: 0; }
    .stat:last-child { border-right: none; }
    .stat-num {
      font-family: var(--font-display);
      font-size: clamp(42px, 5vw, 72px);
      font-weight: 300; letter-spacing: -0.02em;
      line-height: 1; margin-bottom: 10px;
    }
    .stat-label {
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--muted);
    }

    /* ════════════════════════════════════════════════════════════
       FEATURES SECTION
       ════════════════════════════════════════════════════════════ */
    .features { padding: var(--section-gap) var(--page-padding); }
    .section-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-bottom: 80px;
      border-bottom: 1px solid var(--border); padding-bottom: 32px;
    }
    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 1px; background: var(--border);
    }
    .feature-card {
      background: var(--bg); padding: 48px 40px;
      position: relative; overflow: hidden;
      transition: background 0.3s;
    }
    .feature-card::before {
      content: ''; position: absolute;
      top: 0; left: 0; right: 0; height: 1px;
      background: var(--accent);
      transform: scaleX(0); transform-origin: left;
      transition: transform 0.4s ease;
    }
    .feature-card:hover { background: var(--surface); }
    .feature-card:hover::before { transform: scaleX(1); }
    .feature-num {
      font-size: 10px; letter-spacing: 0.16em;
      color: var(--accent); margin-bottom: 32px; font-weight: 400;
    }
    .feature-icon { width: 36px; height: 36px; margin-bottom: 24px; opacity: 0.7; }
    .feature-title {
      font-family: var(--font-display); font-size: 26px;
      font-weight: 300; margin-bottom: 16px; letter-spacing: -0.01em;
    }
    .feature-desc { color: var(--muted); font-size: 12px; line-height: 1.9; }

    /* ════════════════════════════════════════════════════════════
       MARQUEE STRIP
       ════════════════════════════════════════════════════════════ */
    .marquee-section {
      padding: 100px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      overflow: hidden;
    }
    .marquee-text {
      font-family: var(--font-display);
      font-size: clamp(52px, 7vw, 96px);
      font-weight: 300; font-style: italic;
      white-space: nowrap;
      color: rgba(240,237,230,0.06);
      animation: ticker 20s linear infinite;
      display: inline-block;
    }
    .marquee-text .accent-word { color: rgba(200,240,96,0.15); font-style: normal; }

    /* ════════════════════════════════════════════════════════════
       TESTIMONIAL
       ════════════════════════════════════════════════════════════ */
    .testimonial {
      padding: var(--section-gap) var(--page-padding);
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 80px; align-items: center;
    }
    .testimonial-quote {
      font-family: var(--font-display);
      font-size: clamp(28px, 3.5vw, 46px);
      font-weight: 300; font-style: italic;
      line-height: 1.3; letter-spacing: -0.01em;
    }
    .testimonial-quote::before {
      content: '\\201C'; font-size: 1.3em; color: var(--accent);
      line-height: 0; vertical-align: -0.3em; margin-right: 4px;
    }
    .testimonial-visual { position: relative; height: 340px; }
    .grid-visual {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 40px 40px;
      border: 1px solid var(--border);
    }
    .grid-dot {
      position: absolute; width: 8px; height: 8px;
      background: var(--accent); border-radius: 50%;
      animation: pulse 3s ease-in-out infinite;
    }
    .grid-dot:nth-child(2) { top: 25%; left: 35%; animation-delay: 0.8s; }
    .grid-dot:nth-child(3) { top: 60%; left: 65%; animation-delay: 1.6s; }
    .grid-dot:nth-child(4) { top: 75%; left: 20%; animation-delay: 0.4s; }
    .grid-line-h {
      position: absolute; height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      left: 0; right: 0; top: 25%;
      opacity: 0.25; animation: scanline 4s ease-in-out infinite;
    }
    .testimonial-meta {
      border-top: 1px solid var(--border); padding-top: 32px; margin-top: 32px;
    }
    .testimonial-name { font-size: 12px; letter-spacing: 0.1em; margin-bottom: 6px; }
    .testimonial-role {
      font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--muted);
    }

    /* ════════════════════════════════════════════════════════════
       CTA / EMAIL CAPTURE
       ════════════════════════════════════════════════════════════ */
    .cta-section {
      padding: var(--section-gap) var(--page-padding);
      text-align: center;
      border-top: 1px solid var(--border);
      position: relative; overflow: hidden;
    }
    .cta-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(200,240,96,0.04) 0%, transparent 70%);
      pointer-events: none;
    }
    .cta-title {
      font-family: var(--font-display);
      font-size: clamp(48px, 7vw, 96px);
      font-weight: 300; letter-spacing: -0.02em;
      line-height: 1; margin-bottom: 48px;
    }
    .cta-title em { font-style: italic; color: var(--muted); }
    .email-form {
      display: flex; align-items: stretch;
      max-width: 440px; margin: 0 auto 32px;
      border: 1px solid var(--border);
      transition: border-color 0.3s;
    }
    .email-form:focus-within { border-color: var(--accent); }
    .email-input {
      flex: 1; background: transparent; border: none;
      color: var(--text); font-family: var(--font-body);
      font-size: 12px; padding: 16px 20px; outline: none;
      letter-spacing: 0.04em;
    }
    .email-input::placeholder { color: var(--muted); }
    .email-submit {
      background: var(--accent); color: var(--bg); border: none;
      font-family: var(--font-body); font-size: 10px; font-weight: 400;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 16px 22px; cursor: none; transition: opacity 0.2s;
    }
    .email-submit:hover { opacity: 0.85; }
    .cta-note { font-size: 10px; color: var(--muted); letter-spacing: 0.08em; }

    /* ════════════════════════════════════════════════════════════
       FOOTER
       ════════════════════════════════════════════════════════════ */
    footer {
      border-top: 1px solid var(--border);
      padding: 36px var(--page-padding);
      display: flex; align-items: center; justify-content: space-between;
    }
    .footer-copy { font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
    .footer-links { display: flex; gap: 28px; }
    .footer-links a {
      font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--muted); text-decoration: none; transition: color 0.3s;
    }
    .footer-links a:hover { color: var(--text); }

    /* ════════════════════════════════════════════════════════════
       ANIMATIONS
       ════════════════════════════════════════════════════════════ */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ticker {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.6); opacity: 0.5; }
    }
    @keyframes scanline {
      0%, 100% { top: 15%; opacity: 0.2; }
      50%       { top: 75%; opacity: 0.4; }
    }

    /* ════════════════════════════════════════════════════════════
       RESPONSIVE
       ════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      :root { --page-padding: 24px; --section-gap: 80px; }
      .nav-links { display: none; }
      .hero-bg-num { display: none; }
      .stats { grid-template-columns: 1fr; }
      .stat { border-right: none; border-bottom: 1px solid var(--border); padding: 36px 0; }
      .stat:last-child { border-bottom: none; }
      .features-grid { grid-template-columns: 1fr; }
      .testimonial { grid-template-columns: 1fr; }
      .testimonial-visual { display: none; }
      .section-header { flex-direction: column; align-items: flex-start; gap: 24px; }
      footer { flex-direction: column; gap: 20px; text-align: center; }
    }
  </style>
</head>
<body>

  <!-- Custom cursor dot (remove if you want the default cursor) -->
  <div class="cursor" id="cursor"></div>

  <!-- ═══════════════════════════════════════════════════════════
       NAVIGATION
       Edit: logo text, nav links, CTA button label + href
  ═══════════════════════════════════════════════════════════ -->
  <nav id="nav">
    <a class="nav-logo" href="#">YourBrand</a><!-- EDIT: logo name -->

    <ul class="nav-links">
      <!-- EDIT: Add / remove <li> items as needed -->
      <li><a href="#features">Product</a></li>
      <li><a href="#">Company</a></li>
      <li><a href="#">Pricing</a></li>
      <li><a href="#">Blog</a></li>
    </ul>

    <div class="nav-cta">
      <a href="#cta" class="btn-outline">Get Early Access</a><!-- EDIT: CTA label + href -->
    </div>
  </nav>

  <!-- ═══════════════════════════════════════════════════════════
       HERO
       Edit: label, headline (use <br> for line breaks,
             <em> for italic/muted words), subtext, CTA buttons,
             background number/word, ticker items
  ═══════════════════════════════════════════════════════════ -->
  <section class="hero">
    <div class="hero-content">

      <!-- EDIT: Small eyebrow label above headline -->
      <p class="hero-label">Launching 2025 — Now in Beta</p>

      <!-- EDIT: Main headline. Wrap words in <em> for italic+muted style -->
      <h1 class="hero-title">
        Build<br><em>what</em><br>matters.
      </h1>

      <!-- EDIT: One or two sentence value proposition -->
      <p class="hero-sub">
        YourBrand gives product teams the infrastructure to ship faster,
        iterate smarter, and scale without friction.
      </p>

      <div class="hero-actions">
        <!-- EDIT: Primary CTA -->
        <a href="#cta" class="btn-primary">Start for Free</a>
        <!-- EDIT: Secondary link (remove if not needed) -->
        <a href="#" class="hero-link">Watch the demo <span class="arrow">→</span></a>
      </div>
    </div>

    <!-- EDIT: Large decorative text behind hero content (or remove the div) -->
    <div class="hero-bg-num">01</div>

    <!-- EDIT: Repeating ticker items — duplicate each item to fill the loop -->
    <div class="hero-ticker">
      <div class="ticker-track" id="ticker-track">
        <!-- Items are duplicated in JS automatically — just list them once here -->
        <span class="ticker-item"><span class="star">✦</span> Benefit one</span>
        <span class="ticker-item"><span class="star">✦</span> Key feature two</span>
        <span class="ticker-item"><span class="star">✦</span> Social proof three</span>
        <span class="ticker-item"><span class="star">✦</span> Differentiator four</span>
        <span class="ticker-item"><span class="star">✦</span> Trust signal five</span>
        <span class="ticker-item"><span class="star">✦</span> Value prop six</span>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════
       STATS BAR
       Edit: numbers, labels, and counter targets in JS below
       For static numbers (with symbols like &lt; or +), skip the
       data-target attribute and the counter won't animate it.
  ═══════════════════════════════════════════════════════════ -->
  <div class="stats reveal">
    <!-- EDIT: Stat 1 — set data-target & data-suffix for animation -->
    <div class="stat">
      <div class="stat-num" data-target="2.4" data-suffix="M">2.4M</div>
      <div class="stat-label">Deployments per month</div>
    </div>
    <!-- EDIT: Stat 2 -->
    <div class="stat">
      <div class="stat-num" data-target="99.99" data-suffix="%">99.99%</div>
      <div class="stat-label">Uptime SLA</div>
    </div>
    <!-- EDIT: Stat 3 — no data-target = no animation (for static values) -->
    <div class="stat">
      <div class="stat-num">&lt; 80ms</div>
      <div class="stat-label">Global avg. latency</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       FEATURES SECTION
       Edit: section label, title, CTA link, and each feature card.
       Add or remove .feature-card divs (grid auto-fills columns of 3).
  ═══════════════════════════════════════════════════════════ -->
  <section class="features" id="features">
    <div class="section-header reveal">
      <div>
        <p class="section-label">What we offer</p><!-- EDIT -->
        <h2 class="section-title">Precision tools<br>for modern teams.</h2><!-- EDIT -->
      </div>
      <a href="#" class="btn-outline">View all features</a><!-- EDIT or remove -->
    </div>

    <div class="features-grid">

      <!-- EDIT: Feature card 1 — replace SVG icon or use an <img> -->
      <div class="feature-card reveal">
        <div class="feature-num">001</div>
        <!-- Icon: replace path data or swap for your own SVG / <img> -->
        <svg class="feature-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="34" height="34" stroke="currentColor" stroke-width="0.8"/>
          <path d="M10 18h16M18 10v16" stroke="currentColor" stroke-width="0.8"/>
        </svg>
        <h3 class="feature-title">Feature Name</h3><!-- EDIT -->
        <p class="feature-desc">Describe the feature benefit in 1–2 sentences. Focus on outcomes, not mechanics. What does the user gain?</p><!-- EDIT -->
      </div>

      <!-- EDIT: Feature card 2 -->
      <div class="feature-card reveal" style="transition-delay: 0.1s">
        <div class="feature-num">002</div>
        <svg class="feature-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="12" stroke="currentColor" stroke-width="0.8"/>
          <circle cx="18" cy="18" r="4" stroke="currentColor" stroke-width="0.8"/>
          <line x1="18" y1="1" x2="18" y2="6" stroke="currentColor" stroke-width="0.8"/>
          <line x1="18" y1="30" x2="18" y2="35" stroke="currentColor" stroke-width="0.8"/>
          <line x1="1" y1="18" x2="6" y2="18" stroke="currentColor" stroke-width="0.8"/>
          <line x1="30" y1="18" x2="35" y2="18" stroke="currentColor" stroke-width="0.8"/>
        </svg>
        <h3 class="feature-title">Feature Name</h3><!-- EDIT -->
        <p class="feature-desc">Describe the feature benefit in 1–2 sentences. Focus on outcomes, not mechanics. What does the user gain?</p><!-- EDIT -->
      </div>

      <!-- EDIT: Feature card 3 -->
      <div class="feature-card reveal" style="transition-delay: 0.2s">
        <div class="feature-num">003</div>
        <svg class="feature-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="2,28 12,16 20,22 34,8" stroke="currentColor" stroke-width="0.8"/>
          <circle cx="12" cy="16" r="2" fill="currentColor"/>
          <circle cx="20" cy="22" r="2" fill="currentColor"/>
          <circle cx="34" cy="8" r="2" fill="currentColor"/>
        </svg>
        <h3 class="feature-title">Feature Name</h3><!-- EDIT -->
        <p class="feature-desc">Describe the feature benefit in 1–2 sentences. Focus on outcomes, not mechanics. What does the user gain?</p><!-- EDIT -->
      </div>

    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════
       MARQUEE STRIP
       Edit: the 4 words/phrases separated by ✦ symbols.
       The strip loops by duplicating itself — just edit one copy.
  ═══════════════════════════════════════════════════════════ -->
  <div class="marquee-section">
    <div class="marquee-text">
      <!-- EDIT: 4 brand/product words -->
      Clarity &nbsp;&nbsp; <span class="accent-word">✦</span> &nbsp;&nbsp;
      Speed &nbsp;&nbsp;   <span class="accent-word">✦</span> &nbsp;&nbsp;
      Scale &nbsp;&nbsp;   <span class="accent-word">✦</span> &nbsp;&nbsp;
      Precision &nbsp;&nbsp; <span class="accent-word">✦</span> &nbsp;&nbsp;
      Clarity &nbsp;&nbsp; <span class="accent-word">✦</span> &nbsp;&nbsp;
      Speed &nbsp;&nbsp;   <span class="accent-word">✦</span> &nbsp;&nbsp;
      Scale &nbsp;&nbsp;   <span class="accent-word">✦</span> &nbsp;&nbsp;
      Precision &nbsp;&nbsp; <span class="accent-word">✦</span> &nbsp;&nbsp;
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       TESTIMONIAL
       Edit: quote, name, role/company
  ═══════════════════════════════════════════════════════════ -->
  <section class="testimonial">
    <div class="reveal">
      <!-- EDIT: Customer quote (keep it punchy — 1–2 sentences) -->
      <blockquote class="testimonial-quote">
        This product cut our deploy time from 40 minutes to under 90 seconds.
        It's the infrastructure layer we've always wanted.
      </blockquote>
    </div>
    <div class="reveal" style="transition-delay: 0.15s">
      <!-- Decorative animated grid — leave as-is or remove entirely -->
      <div class="testimonial-visual">
        <div class="grid-visual">
          <div class="grid-dot"></div>
          <div class="grid-dot"></div>
          <div class="grid-dot"></div>
          <div class="grid-dot"></div>
          <div class="grid-line-h"></div>
        </div>
      </div>
      <div class="testimonial-meta">
        <p class="testimonial-name">First Last</p><!-- EDIT -->
        <p class="testimonial-role">Title, Company Name</p><!-- EDIT -->
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════
       CTA / EMAIL CAPTURE
       Edit: label, headline, button label, fine print
  ═══════════════════════════════════════════════════════════ -->
  <section class="cta-section reveal" id="cta">
    <div class="cta-bg"></div>

    <!-- EDIT: Eyebrow label -->
    <p class="section-label" style="margin-bottom:24px">Early Access — Limited Spots</p>

    <!-- EDIT: CTA headline — use <em> for italic/muted word(s) -->
    <h2 class="cta-title">Ready to<br><em>transform</em><br>your workflow?</h2>

    <!-- EDIT: Email form — wire up action/method or JS as needed -->
    <div class="email-form">
      <input class="email-input" type="email" placeholder="your@email.com" />
      <button class="email-submit" id="cta-submit">Join the waitlist</button><!-- EDIT: button label -->
    </div>

    <!-- EDIT: Fine print below the form -->
    <p class="cta-note">No spam. No noise. Just the product when it's ready.</p>
  </section>

  <!-- ═══════════════════════════════════════════════════════════
       FOOTER
       Edit: company name, year, and footer links
  ═══════════════════════════════════════════════════════════ -->
  <footer>
    <p class="footer-copy">© 2025 YourCompany, Inc.</p><!-- EDIT -->
    <div class="footer-links">
      <!-- EDIT: Add / remove links as needed -->
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
      <a href="#">Status</a>
      <a href="#">Contact</a>
    </div>
  </footer>

  <script>
    /* ════════════════════════════════════════════════════════════
       INTERACTIONS — Generally safe to leave as-is
       ════════════════════════════════════════════════════════════ */

    // ── Custom cursor ──
    const cursor = document.getElementById('cursor');
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, input').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // ── Nav background on scroll ──
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    // ── Scroll reveal ──
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ── Ticker: auto-duplicate items so the loop is seamless ──
    const track = document.getElementById('ticker-track');
    if (track) {
      track.innerHTML += track.innerHTML; // duplicate once
    }

    // ── Animated stat counters ──
    // Reads data-target and data-suffix from each .stat-num element.
    // Elements without data-target are left as static text.
    function animateCounter(el) {
      const raw     = el.dataset.target;
      const suffix  = el.dataset.suffix || '';
      if (!raw) return;
      const target    = parseFloat(raw);
      const isDecimal = raw.includes('.');
      const duration  = 1800;
      const start     = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        const value    = target * eased;
        el.textContent = (isDecimal ? value.toFixed(2) : Math.round(value).toLocaleString()) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }

    const statObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.stat-num[data-target]').forEach(animateCounter);
          statObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    const statsEl = document.querySelector('.stats');
    if (statsEl) statObserver.observe(statsEl);

    // ── Email form ──
    // EDIT: Replace this with your real form handler (Mailchimp, ConvertKit, fetch, etc.)
    document.getElementById('cta-submit').addEventListener('click', () => {
      const input = document.querySelector('.email-input');
      const email = input.value.trim();
      if (!email || !email.includes('@')) {
        input.style.borderColor = 'tomato';
        setTimeout(() => input.style.borderColor = '', 1500);
        return;
      }
      // TODO: POST email to your backend / mailing list provider
      // Example: fetch('/api/waitlist', { method:'POST', body: JSON.stringify({ email }) })
      alert(\`Thanks! We'll be in touch at \${email}.\`); // replace with real success UI
      input.value = '';
    });
  </script>
</body>
</html>`;

const SYSTEM_PROMPT = `
You are RivetsAI, an expert web developer and UI/UX designer.
Your goal is to build and modify websites based on user requests.
You must return your response in a structured JSON format.

Format:
{
  "explanation": "Brief explanation of what you built or changed (plain text).",
  "code": "The full HTML/CSS/JS code for the page. OR null if using patch.",
  "patch": [
    { 
      "search": "The exact, full block of code you want to replace. Make this unique and large enough (e.g. an entire <style> block, a full CSS class definition like '.btn-primary { ... }', or an entire <section> element) so there are no whitespace or generic matching errors.", 
      "replace": "The new block of code to replace it with." 
    }
  ]
}

Rules:
1. NEW SITES: When starting a new site or receiving a prompt starting with no current code, you MUST use the provided HTML TEMPLATE below as your absolute foundation. You must use this template regardless of what kind of page the user asks for (landing page, blog, coffee shop, app, etc.). You must adapt the template to fit their request by mostly updating the text, altering the CSS tokens in the :root element (colors, fonts), modifying images (using pollinations.ai), and tweaking the layout slightly if necessary. Do not start from scratch. Output the modified template in the "code" field.
2. EXISTING SITES: If current code is provided, ONLY use the "patch" field for changes. Set "code" to null.
3. PATCHING: The "search" string in a patch MUST be an exact, unique match from the existing code (including whitespace, tabs, and newlines). Because of this, DO NOT patch single words or lines. Patch entire logical blocks. For example, to change an H1 class, include the entire \\\`<h1 class="...">...</h1>\\\` block in your "search". To change a CSS variable, include the entire \\\`:root { ... }\\\` block.
4. IMAGE SUPPORT: Use images from the internet that suits the needs of the website.
5. Do NOT output markdown code blocks. Just the raw JSON.

HTML TEMPLATE:
\${HTML_TEMPLATE}
`;

export async function POST(req: Request) {
  try {
    const { messages, projectId, userId, currentCode } = await req.json();

    // Sanitize and format messages for Gemini
    const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const latestMessage = messages[messages.length - 1].content;

    // 1. Generate AI Response
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_PROMPT + "\\n\\n" + "CURRENT CODE:\\n" + (currentCode || "EMPTY"),
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(latestMessage);
    const responseContent = result.response.text();

    if (!responseContent) throw new Error("No response from AI");

    const parsed = JSON.parse(responseContent);
    let finalCode = parsed.code;

    // 2. Apply Patch if provided
    if (parsed.patch && Array.isArray(parsed.patch) && currentCode) {
      finalCode = currentCode;
      for (const item of parsed.patch) {
        if (item.search && item.replace !== undefined) {
          // Use split/join for simple global replacement of exact matches
          // Since the AI is instructed to use large semantic blocks, this is much safer now
          finalCode = finalCode.split(item.search).join(item.replace);
        }
      }
    }

    if (!finalCode) {
      // Fallback or if AI returned nothing
      finalCode = currentCode || "";
    }

    // 3. Persist to Database (if authenticated)
    let finalProjectId = projectId;
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
        },
      );

      if (!finalProjectId) {
        const { data: newProject, error: projError } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            title: messages[messages.length - 1].content.slice(0, 50) + "...",
            current_code: finalCode,
          })
          .select()
          .single();

        if (projError) console.error("Project Create Error:", projError);
        if (newProject) finalProjectId = newProject.id;
      } else {
        await supabase
          .from("projects")
          .update({
            current_code: finalCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", finalProjectId);
      }

      if (finalProjectId) {
        const userMsg = messages[messages.length - 1];
        const aiMsg = { role: "assistant", content: parsed.explanation };

        await supabase.from("messages").insert([
          {
            project_id: finalProjectId,
            role: userMsg.role,
            content: userMsg.content,
          },
          {
            project_id: finalProjectId,
            role: aiMsg.role,
            content: aiMsg.content,
          },
        ]);
      }
    }

    return NextResponse.json({
      ...parsed,
      code: finalCode,
      projectId: finalProjectId,
    });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate website." },
      { status: 500 },
    );
  }
}
