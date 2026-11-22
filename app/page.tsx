"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./landing.css";

const repository = "https://github.com/paulos-ui/koraguard-stellar";
const fmt = (value: number) => Math.max(0, value).toLocaleString("en-US", { maximumFractionDigits: 0 });

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className="kg-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    {diagonal ? <path d="M4 14 14 4M6 4h8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M2.5 9h12M10 4.5 14.5 9 10 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}

function Monogram({ large = false }: { large?: boolean }) {
  return <span className={`kg-monogram ${large ? "kg-monogram-large" : ""}`} aria-hidden="true">K<span className="kg-mark-cut" /></span>;
}

function MoneyInstrument() {
  return <div className="kg-instrument" aria-label="Illustrative reserve and spending breakdown">
    <div className="kg-instrument-header"><span><i className="kg-live-dot" />LIVE PREVIEW / 01</span><span>ILLUSTRATIVE VALUES</span></div>
    <div className="kg-instrument-body">
      <div className="kg-instrument-topline"><span>YOUR WORKING BALANCE</span><span className="kg-small-cross">✳</span></div>
      <div className="kg-big-balance"><span>2,450</span><small>XLM</small></div>
      <div className="kg-instrument-divider" />
      <div className="kg-ledger-item"><span><i className="kg-swatch kg-swatch-dark" />Committed</span><strong>1,200 XLM</strong></div>
      <div className="kg-ledger-item"><span><i className="kg-swatch kg-swatch-grey" />Planning buffer</span><strong>2 XLM</strong></div>
      <div className="kg-ledger-track" aria-hidden="true"><span className="kg-ledger-locked" /><span className="kg-ledger-buffer" /><span className="kg-ledger-free" /></div>
      <div className="kg-instrument-result"><div><span>SAFE TO PLAN</span><strong>1,248 <small>XLM</small></strong></div><div className="kg-dial"><svg viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="27" fill="none" stroke="#D7E5CA" strokeWidth="5"/><circle className="kg-dial-fill" cx="35" cy="35" r="27" fill="none" stroke="#284736" strokeWidth="5" strokeLinecap="round" strokeDasharray="169.65" strokeDashoffset="86.4" transform="rotate(-90 35 35)"/></svg><span>51%</span></div></div>
    </div>
    <div className="kg-instrument-foot"><span>NOT A LIVE WALLET BALANCE</span><span>STELLAR / TESTNET</span></div>
  </div>;
}

function ReserveSimulator() {
  const [balance, setBalance] = useState(2500);
  const [committed, setCommitted] = useState(1400);
  const [proposed, setProposed] = useState(750);
  const networkBuffer = 2;
  const available = Math.max(0, balance - committed - networkBuffer);
  const approved = proposed <= available;
  const reservedPct = Math.min(100, (committed / balance) * 100);
  const spendablePct = Math.min(100 - reservedPct, (available / balance) * 100);
  const barStyle = { "--kg-reserved": `${reservedPct}%`, "--kg-free": `${spendablePct}%` } as CSSProperties;

  return <div className="kg-simulator">
    <div className="kg-sim-header"><span className="kg-micro">LIVE PLANNING STUDY</span><span className="kg-sim-indicator"><i /> INTERACTIVE EXAMPLE</span></div>
    <div className="kg-sim-body">
      <div className="kg-sim-top"><p>Your money, <em>in context.</em></p><span>01 / ADJUST</span></div>
      <div className="kg-sim-controls">
        <label className="kg-range-field"><span><span>Wallet balance</span><strong>{fmt(balance)} XLM</strong></span><input aria-label="Illustrative wallet balance in XLM" type="range" min="500" max="5000" step="50" value={balance} onChange={e => setBalance(Number(e.target.value))}/></label>
        <label className="kg-range-field"><span><span>Money committed</span><strong>{fmt(committed)} XLM</strong></span><input aria-label="Illustrative committed funds in XLM" type="range" min="0" max="5000" step="50" value={committed} onChange={e => setCommitted(Number(e.target.value))}/></label>
        <label className="kg-range-field"><span><span>Payment to review</span><strong>{fmt(proposed)} XLM</strong></span><input aria-label="Illustrative payment amount in XLM" type="range" min="50" max="3000" step="50" value={proposed} onChange={e => setProposed(Number(e.target.value))}/></label>
      </div>
      <div className="kg-sim-breakdown"><div className="kg-bar-track" style={barStyle} aria-hidden="true"><i className="kg-bar-reserved"/><i className="kg-bar-free"/></div><div className="kg-bar-legend"><span><i className="kg-legend-committed" /> Committed</span><span><i className="kg-legend-spendable" /> Available</span><span><i className="kg-legend-over" /> Unavailable</span></div></div>
      <div className="kg-sim-summary"><div><span>AVAILABLE BY PLAN</span><strong>{fmt(available)} <small>XLM</small></strong></div><div className={`kg-sim-verdict ${approved ? "kg-verdict-positive" : "kg-verdict-negative"}`} role="status" aria-live="polite"><span>{approved ? "WITHIN PLAN" : "OVER BUDGET"}</span><b>{approved ? "Payment fits" : "Review needed"}</b><small>{approved ? "This request leaves your planned commitments covered." : "This request would exceed the money left after commitments."}</small></div></div>
    </div>
    <p className="kg-sim-disclaimer">Illustrative client-side calculation with a 2 XLM planning buffer. This is not a real wallet check or an on-chain spending restriction. Contract enforcement is in development.</p>
  </div>;
}

const milestones = [
  ["01", "Understand", "Connect a Stellar Testnet wallet and read a real account balance.", "IN INITIAL APP"],
  ["02", "Plan", "Map upcoming obligations and calculate a spending buffer.", "IN INITIAL APP"],
  ["03", "Pay & verify", "Request a wallet signature, submit a Testnet XLM payment, and follow the receipt.", "IN INITIAL APP"],
  ["04", "Enforce", "Compile, audit, and deploy the Soroban vault to enforce actual reserve constraints.", "IN DEVELOPMENT"],
];

const questions = [
  ["Is KoraGuard already protecting on-chain funds?", "Not yet. V0.2 has browser-based planning and an initial Stellar Testnet payment interface. The Soroban vault exists as a draft in source code and still needs tests, deployment, and live integration."],
  ["Do I need real money to explore it?", "No. The first version targets Stellar Testnet and uses Testnet XLM. Testnet tokens are not redeemable for real-world value."],
  ["Does KoraGuard hold my private keys?", "No. Payments are intended to be authorized by your connected wallet. Never enter a seed phrase or private key into the site."],
  ["What is next for the product?", "Verified on-chain vault enforcement, asset-aware planning for stablecoins, richer recurring payment workflows, and stronger team approval policies, subject to testing and security review."],
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = useRef<HTMLDivElement>(null);
  const instrument = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doc = document.documentElement;
    doc.classList.add("kg-js-ready");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll<HTMLElement>(".kg-reveal");
    if (!reduceMotion && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("kg-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
      targets.forEach(target => observer.observe(target));
      const initialTimer = window.setTimeout(() => targets.forEach(target => {
        if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add("kg-visible");
      }), 100);
      return () => { observer.disconnect(); window.clearTimeout(initialTimer); doc.classList.remove("kg-js-ready"); };
    }
    targets.forEach(target => target.classList.add("kg-visible"));
    return () => doc.classList.remove("kg-js-ready");
  }, []);

  useEffect(() => {
    let frame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      frame = 0;
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (progress.current) progress.current.style.transform = `scaleX(${Math.min(1, window.scrollY / distance)})`;
      if (instrument.current && !reduceMotion.matches) {
        instrument.current.style.setProperty("--kg-parallax", `${Math.min(34, window.scrollY * 0.065)}px`);
      }
    }
    function onScroll() { if (!frame) frame = window.requestAnimationFrame(update); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return <div className="kg-site" id="top">
    <a className="kg-skip" href="#main-content">Skip to main content</a>
    <div ref={progress} className="kg-scroll-progress" aria-hidden="true" />
    <div className="kg-hero-wrap">
      <header className="kg-header">
        <Link className="kg-logo" href="/" aria-label="KoraGuard home" onClick={closeMenu}><Monogram /><span><strong>KoraGuard</strong><small>BUILT ON STELLAR</small></span></Link>
        <nav id="kg-navigation" className={`kg-header-nav ${menuOpen ? "kg-header-nav-open" : ""}`} aria-label="Main navigation">
          <a href="#problem" onClick={closeMenu}>The problem</a><a href="#lab" onClick={closeMenu}>Explore the logic</a><a href="#approach" onClick={closeMenu}>Our approach</a><a href="#roadmap" onClick={closeMenu}>Roadmap</a>
          <Link href="/app" onClick={closeMenu} className="kg-nav-mobile-cta">Enter the app <Arrow diagonal /></Link>
        </nav>
        <Link className="kg-nav-cta" href="/app">Enter the app <Arrow diagonal /></Link>
        <button type="button" className="kg-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="kg-navigation" onClick={() => setMenuOpen(open => !open)}><span/><span/></button>
      </header>

      <section className="kg-hero kg-container" aria-labelledby="kg-hero-title">
        <div className="kg-hero-copy"><div className="kg-overline kg-reveal"><span className="kg-overline-mark">✳</span> FINANCIAL CLARITY, BUILT ON STELLAR <span className="kg-overline-index">/ 001</span></div>
          <h1 id="kg-hero-title" className="kg-reveal kg-hero-headline">Every payment<br/>has a <em>before.</em></h1>
          <p className="kg-hero-lede kg-reveal">The balance in your wallet is only half the story. KoraGuard helps you see the money you’ve already promised before you decide what to spend next.</p>
          <div className="kg-hero-actions kg-reveal"><Link className="kg-pill kg-pill-light" href="/app">Enter KoraGuard <Arrow diagonal /></Link><a className="kg-text-link" href="#problem">Discover the thinking <span>↓</span></a></div>
          <div className="kg-hero-note kg-reveal"><span className="kg-note-line"/><span>TESTNET-FIRST · OPEN SOURCE · BUILT IN PUBLIC</span></div>
        </div>
        <div className="kg-hero-art kg-reveal" ref={instrument}><div className="kg-orbit-outer" aria-hidden="true"><span>KG / RESERVE SYSTEM</span><b>01</b></div><div className="kg-art-frame"><MoneyInstrument /></div><div className="kg-art-caption"><span>01 — BALANCE</span><span>02 — OBLIGATIONS</span><span>03 — DECISION</span></div></div>
      </section>
      <div className="kg-hero-bottom kg-container"><span>SCROLL TO UNDERSTAND</span><div className="kg-hero-rule" /><span>↓ 01 / WHY WE EXIST</span></div>
    </div>

    <main id="main-content">
    <section id="problem" className="kg-problem kg-section-light" aria-labelledby="kg-problem-title">
      <div className="kg-container"><div className="kg-section-intro kg-reveal"><span className="kg-section-count">01 / THE PROBLEM</span><span className="kg-section-type">THE INVISIBLE COST OF PAYING TOO SOON</span></div>
        <div className="kg-problem-layout"><h2 id="kg-problem-title" className="kg-display kg-reveal">A balance<br/>isn’t a <em>budget.</em></h2><div className="kg-problem-aside kg-reveal"><p>One number tells you what you have. It doesn’t tell you what you owe, what’s due, or what you can safely move.</p><div className="kg-problem-quote">“Can I make this payment without putting the next one at risk?”</div><span>THE QUESTION YOUR WALLET DOESN’T ANSWER</span></div></div>
        <div className="kg-balance-story kg-reveal"><div><small>ACCOUNT BALANCE</small><strong>2,450 <i>XLM</i></strong><span>Money you can see</span></div><span className="kg-story-operator">−</span><div><small>PLANNED OBLIGATIONS</small><strong>1,200 <i>XLM</i></strong><span>Money already spoken for</span></div><span className="kg-story-operator">=</span><div className="kg-story-outcome"><small>AVAILABLE BY PLAN</small><strong>1,248 <i>XLM</i></strong><span>After a 2 XLM planning buffer</span></div></div>
        <p className="kg-example-foot">Illustrative example. Actual available funds depend on Stellar account requirements and changing balances.</p>
      </div>
    </section>

    <section className="kg-manifesto" aria-label="Our product philosophy"><div className="kg-container kg-manifesto-inner"><span className="kg-manifesto-symbol" aria-hidden="true">✳</span><p className="kg-reveal">Good financial infrastructure should help you <em>keep your promises</em>, not just move your money.</p><span className="kg-manifesto-side">THE KORAGUARD PRINCIPLE / 2026</span></div></section>

    <section id="lab" className="kg-lab kg-section-light" aria-labelledby="kg-lab-title"><div className="kg-container"><div className="kg-section-intro kg-reveal"><span className="kg-section-count">02 / TRY THE THINKING</span><span className="kg-section-type">INTERACTIVE PLANNING LAB</span></div>
      <div className="kg-lab-layout"><div className="kg-lab-copy kg-reveal"><h2 className="kg-display" id="kg-lab-title">See what’s <em>really</em><br/>available.</h2><p>Move the numbers. Add a commitment. Try a payment. See how the available balance changes before you touch a wallet.</p><div className="kg-lab-aside"><b>PLANNING FIRST. EXECUTION SECOND.</b><span>This interactive example demonstrates the budgeting logic. It does not move funds or lock assets.</span></div></div><div className="kg-reveal"><ReserveSimulator /></div></div>
    </div></section>

    <section id="approach" className="kg-approach" aria-labelledby="kg-approach-title"><div className="kg-container"><div className="kg-section-intro kg-reveal"><span className="kg-section-count">03 / THE APPROACH</span><span className="kg-section-type">FROM INTENTION TO EVIDENCE</span></div>
      <div className="kg-approach-heading"><h2 id="kg-approach-title" className="kg-display kg-reveal">Not another<br/><em>finance dashboard.</em></h2><p className="kg-reveal">We’re building a more deliberate payment workflow, from understanding your obligations to independently verifying a completed transfer.</p></div>
      <div className="kg-steps-track"><div className="kg-steps-spine" aria-hidden="true" />{milestones.map((item, index) => <article key={item[0]} className="kg-step kg-reveal"><div className="kg-step-number"><span>{item[0]}</span><i /></div><div className="kg-step-text"><h3>{item[1]}</h3><p>{item[2]}</p></div><span className={`kg-step-status ${index === 3 ? "kg-step-future" : ""}`}>{item[3]}</span></article>)}</div>
      <div className="kg-approach-foot kg-reveal"><span>SECURITY IS AN IMPLEMENTATION REQUIREMENT, NOT A SLOGAN.</span><Link href="/app">Explore the initial app <Arrow diagonal /></Link></div>
    </div></section>

    <section className="kg-story-panel" aria-label="What we are building"><div className="kg-container"><div className="kg-story-grid"><div className="kg-story-text kg-reveal"><span className="kg-section-count">THE TECHNICAL UNLOCK / STELLAR</span><h2>Rules that can live <em>where the money lives.</em></h2><p>Today, KoraGuard calculates a safe-to-plan amount in your browser. The next step is a Soroban vault that can enforce reserve limits on-chain, even when a UI would prefer to say yes.</p><Link className="kg-outline-link" href="/app">View what works today <Arrow diagonal /></Link></div><div className="kg-vault-graphic kg-reveal" aria-hidden="true"><div className="kg-vault-rail"><span>FUNDS</span><span>POLICY</span><span>PROOF</span></div><div className="kg-vault-center"><span className="kg-vault-cross">✳</span><div className="kg-vault-disc"><span>K</span></div><p>GUARDED<br/>RESERVE</p></div><div className="kg-vault-bottom"><span>CONTRACT DRAFT / NOT DEPLOYED</span><span>⟶</span></div></div></div></div></section>

    <section id="roadmap" className="kg-roadmap kg-section-light" aria-labelledby="kg-roadmap-title"><div className="kg-container"><div className="kg-section-intro kg-reveal"><span className="kg-section-count">04 / BUILDING IN PUBLIC</span><span className="kg-section-type">A ROADMAP WITH REAL CHECKPOINTS</span></div>
      <div className="kg-roadmap-layout"><div className="kg-roadmap-copy kg-reveal"><h2 id="kg-roadmap-title" className="kg-display">Proof over<br/><em>promises.</em></h2><p>We’d rather show a tested payment than promise a magical agent. Our roadmap keeps the difference between an interface, a smart contract draft, and a deployed product unmistakably clear.</p><a className="kg-text-link kg-text-link-dark" target="_blank" rel="noopener noreferrer" href={repository}>Follow the open-source build <Arrow diagonal /></a></div><div className="kg-roadmap-list"><div className="kg-roadmap-item kg-reveal"><span>NOW</span><div><h3>Foundation</h3><p>Dashboard, browser-based commitments, Testnet wallet integration, payment flow and receipt viewer.</p></div><b>V0.2</b></div><div className="kg-roadmap-item kg-reveal"><span>NEXT</span><div><h3>On-chain protection</h3><p>Vault contract tests, deployment, funding, withdrawal constraints and transaction evidence.</p></div><b>BUILD</b></div><div className="kg-roadmap-item kg-reveal"><span>AFTER</span><div><h3>Stablecoin intelligence</h3><p>Asset-aware reserves, recurring payments, and more robust approval workflows.</p></div><b>EXPAND</b></div></div></div>
      <div className="kg-disclosure kg-reveal"><span>✳</span><p><strong>Transparent by default.</strong> This is an early Testnet build. It does not custody mainnet funds, guarantee payment safety, or currently enforce reserves on-chain.</p></div>
    </div></section>

    <section className="kg-faq" aria-labelledby="kg-faq-title"><div className="kg-container kg-faq-layout"><div className="kg-reveal"><span className="kg-section-count">05 / GOOD TO KNOW</span><h2 id="kg-faq-title">No fine print.<br/><em>Just clarity.</em></h2></div><div className="kg-faq-list kg-reveal">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

    <section className="kg-final" aria-labelledby="kg-final-title"><div className="kg-container kg-final-inner"><div className="kg-final-small"><span>✳ YOUR NEXT PAYMENT STARTS HERE</span><span>STELLAR / OPEN DEVELOPMENT</span></div><h2 id="kg-final-title" className="kg-reveal">Make the move.<br/><em>Keep the promise.</em></h2><div className="kg-final-actions kg-reveal"><p>Start by understanding what your balance can really do. Explore the first version on Stellar Testnet.</p><Link href="/app" className="kg-final-button">Enter the app <Arrow diagonal /></Link></div><div className="kg-final-giant" aria-hidden="true">KORAGUARD</div></div></section>

    </main>
    <footer className="kg-site-footer"><div className="kg-container"><div className="kg-footer-main"><Link href="/" className="kg-logo"><Monogram /><span><strong>KoraGuard</strong><small>BUILT ON STELLAR</small></span></Link><p>Financial clarity for the money you’re about to move.</p><div><Link href="/app">App</Link><a href={repository} target="_blank" rel="noopener noreferrer">GitHub</a><a href="#top">Back to top ↑</a></div></div><div className="kg-footer-bottom"><span>© 2026 KoraGuard</span><span>TESTNET-FIRST · NO FINANCIAL GUARANTEES</span><span>BUILT FOR CLARITY.</span></div></div></footer>
  </div>;
}
