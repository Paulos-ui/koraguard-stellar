"use client";

import { useEffect, useMemo, useState } from "react";
import { Asset, BASE_FEE, Horizon, Networks, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { disconnect, getNetworkDetails, isConnected, requestAccess, signTransaction } from "@stellar/varial-sdk";
import { assessSafety, canPlanPayment, normalizeAmount, type Commitment } from "@/lib/policy";

type View = "overview" | "commitments" | "payments" | "activity" | "architecture";
type Receipt = { id: string; hash: string; destination: string; amount: number; timestamp: string };
const HORIZON = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON);
const nav: { key: View; text: string; icon: string }[] = [
  { key: "overview", text: "Overview", icon: "◫" },
  { key: "commitments", text: "Commitments", icon: "▤" },
  { key: "payments", text: "Make payment", icon: "↗" },
  { key: "activity", text: "Receipts", icon: "▦" },
  { key: "architecture", text: "How it works", icon: "⌘" },
];
const amountText = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 4 });
const short = (address: string) => address ? `${address.slice(0, 6)}…${address.slice(-5)}` : "";
const today = () => new Date().toISOString().slice(0, 10);

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDue, setNewDue] = useState(today());
  const [recipient, setRecipient] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payTo, setPayTo] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("koraguard-commitments-guest-v1") || "[]");
      const txs = JSON.parse(localStorage.getItem("koraguard-receipts-guest-v1") || "[]");
      if (Array.isArray(saved)) setCommitments(saved);
      if (Array.isArray(txs)) setReceipts(txs);
    } catch { /* Ignore malformed local data */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(`koraguard-commitments-${wallet || "guest"}-v1`, JSON.stringify(commitments));
  }, [commitments, hydrated, wallet]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(`koraguard-receipts-${wallet || "guest"}-v1`, JSON.stringify(receipts));
  }, [receipts, hydrated, wallet]);

  // The 2 XLM hold is a deliberately conservative planning assumption, not a
  // calculation of exact Stellar minimum balances / liabilities.
  const networkHold = 2;
  const safety = useMemo(() => assessSafety(balance ?? 0, commitments, networkHold), [balance, commitments]);
  const upcoming = useMemo(() => [...commitments].sort((a, b) => a.due.localeCompare(b.due)), [commitments]);
  const payNumber = normalizeAmount(payAmount);
  const readyToPay = Boolean(wallet && payNumber && canPlanPayment(payNumber, safety) && StrKey.isValidEd25519PublicKey(payTo.trim()));

  async function refreshBalance(address = wallet) {
    if (!address) return;
    const details = await server.loadAccount(address);
    const native = details.balances.find((b) => b.asset_type === "native");
    setBalance(Number(native?.balance ?? 0));
  }

  async function connectWallet() {
    setError(""); setNotice(""); setBusy(true);
    try {
      const extension = await isConnected();
      if (!extension.isConnected) throw new Error("Varial wallet is not available here. Install its browser extension or open KoraGuard in the Varial mobile app browser.");
      const res = await requestAccess();
      if (res.error || !res.address) throw new Error(res.error?.message || "Wallet access was not granted.");
      const net = await getNetworkDetails();
      if (net.error || net.network !== "TESTNET") throw new Error("Switch your Varial wallet to Stellar Testnet and reconnect.");
      const owned = JSON.parse(localStorage.getItem(`koraguard-commitments-${res.address}-v1`) || "[]");
      const savedReceipts = JSON.parse(localStorage.getItem(`koraguard-receipts-${res.address}-v1`) || "[]");
      setCommitments(Array.isArray(owned) ? owned : []);
      setReceipts(Array.isArray(savedReceipts) ? savedReceipts : []);
      setWallet(res.address);
      await refreshBalance(res.address);
      setNotice("Stellar Testnet wallet connected. Your balance is read from the network.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect wallet."); }
    finally { setBusy(false); }
  }

  async function leaveWallet() {
    setError(""); setNotice("");
    try { await disconnect(); } catch { /* Still clear local session. */ }
    const guest = JSON.parse(localStorage.getItem("koraguard-commitments-guest-v1") || "[]");
    const guestReceipts = JSON.parse(localStorage.getItem("koraguard-receipts-guest-v1") || "[]");
    setCommitments(Array.isArray(guest) ? guest : []);
    setReceipts(Array.isArray(guestReceipts) ? guestReceipts : []);
    setWallet(""); setBalance(null);
  }

  async function reload() {
    if (!wallet) return;
    setBusy(true); setError("");
    try { await refreshBalance(); setNotice("Balance refreshed from Stellar Testnet."); }
    catch { setError("Could not refresh this address. Ensure the account is funded on Testnet."); }
    finally { setBusy(false); }
  }

  function addCommitment(e: React.FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    const n = normalizeAmount(newAmount);
    if (!newName.trim() || !n || !newDue) { setError("Enter a commitment name, valid positive amount and due date."); return; }
    if (recipient && !StrKey.isValidEd25519PublicKey(recipient.trim())) { setError("Recipient must be a valid Stellar G-address or left blank."); return; }
    setCommitments(prev => [...prev, { id: crypto.randomUUID(), label: newName.trim().slice(0, 70), amount: n, due: newDue, recipient: recipient.trim() || undefined, createdAt: new Date().toISOString() }]);
    setNewName(""); setNewAmount(""); setNewDue(today()); setRecipient("");
    setNotice("Commitment saved in this browser. On-chain locking is not enabled yet.");
    setView("commitments");
  }

  async function sendPayment() {
    setError(""); setNotice("");
    if (!readyToPay || !payNumber || !wallet) { setError("Review the amount, recipient address and your remaining available funds."); return; }
    setBusy(true);
    try {
      const net = await getNetworkDetails();
      if (net.error || net.network !== "TESTNET") throw new Error("Wallet must be on Stellar Testnet.");
      const source = await server.loadAccount(wallet);
      const native = source.balances.find(b => b.asset_type === "native");
      const actualBalance = Number(native?.balance ?? 0);
      // Recompute immediately before signing because the user's on-chain balance may change.
      const actual = assessSafety(actualBalance, commitments, networkHold);
      if (!canPlanPayment(payNumber, actual)) throw new Error("The balance changed. This amount exceeds your available planning buffer.");
      if (payTo.trim() === wallet) throw new Error("Enter a different destination account.");
      // This initial version intentionally supports payments to existing accounts only.
      try { await server.loadAccount(payTo.trim()); }
      catch { throw new Error("Recipient account must already exist and be funded on Stellar Testnet."); }
      const fee = await server.fetchBaseFee();
      const tx = new TransactionBuilder(source, { fee: String(Math.max(fee, Number(BASE_FEE))), networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: payTo.trim(), asset: Asset.native(), amount: payNumber.toFixed(7).replace(/0+$/, "").replace(/\.$/, "") }))
        .setTimeout(120)
        .build();
      const signed = await signTransaction(tx.toXdr(), { networkPassphrase: Networks.TESTNET, address: wallet });
      if (signed.error || !signed.signedTxXdr) throw new Error(signed.error?.message || "Transaction signing was cancelled.");
      const submitted = await server.submitTransaction(TransactionBuilder.fromXdr(signed.signedTxXdr, Networks.TESTNET));
      const proof = { id: crypto.randomUUID(), hash: submitted.hash, destination: payTo.trim(), amount: payNumber, timestamp: new Date().toISOString() };
      setReceipts(prev => [proof, ...prev]);
      setNotice(`Transaction confirmed on Testnet: ${short(submitted.hash)}. Open Receipts to inspect it.`);
      setPayAmount(""); setPayTo(""); setConfirmPayment(false);
      try { await refreshBalance(wallet); } catch { setNotice("Payment submitted. Balance refresh is temporarily unavailable. Verify the transaction in Receipts."); }
      setView("activity");
    } catch (e) { setError(e instanceof Error ? e.message : "Payment could not be submitted."); }
    finally { setBusy(false); }
  }

  const goto = (target: View) => { setView(target); setMenuOpen(false); setNotice(""); setError(""); };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">K<span>✦</span></div><div><div className="brand-name">KoraGuard</div><div className="brand-sub">BUILT ON STELLAR</div></div></div>
      <div className="sidebar-section">WORKSPACE</div>
      <nav className="navigation">{nav.map(item => <button key={item.key} type="button" className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => goto(item.key)}><span className="nav-icon">{item.icon}</span>{item.text}{item.key === "architecture" && <span className="nav-mini">↗</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-signal"><span className="signal-dot"/>TESTNET ENVIRONMENT</div><p>Clarity before every payment.<br/>Confidence after every transfer.</p><a href="https://github.com/paulos-ui/koraguard-stellar" target="_blank" rel="noreferrer">View source on GitHub ↗</a></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" type="button" onClick={() => setMenuOpen(!menuOpen)}>☰</button><a className="location" href="/" aria-label="Return to KoraGuard landing page">← Website</a><span className="location-slash">/</span><span className="location">Workspace</span><span className="location-slash">/</span><span className="location-active">{nav.find(n => n.key === view)?.text}</span></div><div className="topbar-actions"><div className="testnet-chip"><span className="signal-dot"/>Stellar Testnet</div>{wallet ? <button className="wallet-button" type="button" onClick={leaveWallet} title="Disconnect Varial wallet"><span className="wallet-dot"/>{short(wallet)} <span className="disconnect-symbol">×</span></button> : <button className="button button-dark wallet-button" type="button" onClick={connectWallet} disabled={busy}>{busy ? "Connecting…" : "Connect wallet ↗"}</button>}</div></header>

      <main className="main-content">
        {error && <div className="toast toast-error"><span>!</span>{error}<button type="button" onClick={() => setError("")}>×</button></div>}
        {notice && <div className="toast toast-ok"><span>✓</span>{notice}<button type="button" onClick={() => setNotice("")}>×</button></div>}

        {view === "overview" && <>
          <div className="heading-row"><div><div className="eyebrow"><span className="asterisk">✳</span> THE BUSINESS FINANCE CONTROL ROOM</div><h1>Make money moves.<br/><em>Without the money mistakes.</em></h1><p className="headline-desc">Know what is safe to spend, protect what matters, and move funds with the confidence of a clear plan.</p></div><div className="heading-stamp"><span>01 / 04</span><div>PLAN<br/>PROTECT<br/>PAY.</div></div></div>
          <div className="hero-strip"><div className="hero-strip-copy"><span className="hero-strip-label">NOW BUILDING / V0.1</span><strong>Better decisions start<br/>before you hit send.</strong><p>Your reserve plan stays local. A smart-contract vault is the next build milestone.</p><button onClick={() => goto("commitments")} type="button">Create a commitment <span>↗</span></button></div><div className="hero-pattern" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><span>K</span></div></div>
          <div className="section-title"><div><h2>Your money, in context</h2><p>Live balance + your local commitment plan</p></div><button className="subtle-link" type="button" onClick={reload} disabled={!wallet || busy}>↻ Refresh balance</button></div>
          <div className="metric-grid">
            <div className="metric-card"><div className="metric-heading">WALLET BALANCE <span>↗</span></div><div className="metric-value">{balance === null ? "—" : amountText(balance)} <small>{balance === null ? "" : "XLM"}</small></div><div className="metric-foot">{wallet ? "Live on Stellar Testnet" : "Connect a wallet to view"}</div></div>
            <div className="metric-card"><div className="metric-heading">PLANNED COMMITMENTS <span>▤</span></div><div className="metric-value">{amountText(safety.reserved)} <small>XLM</small></div><div className="metric-foot">{commitments.length} local allocation{commitments.length === 1 ? "" : "s"}</div></div>
            <div className="metric-card metric-main"><div className="metric-heading">PLANNED SAFE TO PAY <span>✦</span></div><div className="metric-value">{balance === null ? "—" : amountText(safety.safeToPay)} <small>{balance === null ? "" : "XLM"}</small></div><div className="metric-foot">After commitments &amp; a {networkHold} XLM planning hold</div></div>
          </div>
          <div className="overview-grid"><div className="panel decision-panel"><div className="panel-top"><span className="tag">THE KORAGUARD SIGNAL</span><span className="panel-tag">ADVISORY</span></div><div className="decision-body"><div className={`signal-icon signal-${safety.status}`}>{safety.status === "covered" ? "✓" : safety.status === "unfunded" ? "○" : "!"}</div><div><h3>{!wallet ? "Your money deserves a plan." : safety.status === "covered" ? "Commitments covered." : safety.status === "tight" ? "Your buffer is getting tight." : "Your commitments need attention."}</h3><p>{wallet ? safety.reason : "Connect a funded Testnet wallet, then map the obligations you need to protect."}</p></div></div><div className="signal-note"><span>WHAT THIS MEANS</span><p>This is a planning assessment, not an on-chain block. Funds are not locked until the Soroban vault is deployed and used.</p></div></div>
            <div className="panel next-panel"><div className="panel-top"><span className="tag">UP NEXT</span><button className="subtle-link" type="button" onClick={() => goto("commitments")}>View all ↗</button></div>{upcoming.length ? <div className="commitment-rows">{upcoming.slice(0, 3).map(c => <div className="mini-commitment" key={c.id}><div className="letter-tile">{c.label[0].toUpperCase()}</div><div><strong>{c.label}</strong><small>Due {c.due}</small></div><b>{amountText(c.amount)} XLM</b></div>)}</div> : <div className="empty-block"><span className="empty-doodle">◇</span><b>No commitments planned yet</b><p>Start with a supplier invoice, salary, or recurring expense.</p><button className="button button-outline" type="button" onClick={() => goto("commitments")}>Add first commitment ↗</button></div>}</div></div>
          <div className="trust-footer"><span>◉ ON-CHAIN PAYMENTS</span><span>⌁ NON-CUSTODIAL WALLET</span><span>▣ OPEN SOURCE</span><span>✧ MADE FOR REAL BUSINESSES</span></div>
        </>}

        {view === "commitments" && <><div className="simple-heading"><div className="eyebrow">01 / PLANNING</div><h1>Put every obligation<br/><em>in its place.</em></h1><p>Plan your commitments before spending. These allocations are stored in this browser and are not yet locked on-chain.</p></div><div className="two-col"><div className="panel form-panel"><div className="section-title form-title"><div><h2>New commitment</h2><p>Mark the money you want to protect</p></div></div><form onSubmit={addCommitment} className="form-stack"><label>WHAT IS THIS FOR?<input value={newName} maxLength={70} onChange={e => setNewName(e.target.value)} placeholder="e.g. Supplier invoice" required/></label><div className="input-two"><label>AMOUNT (XLM)<input value={newAmount} inputMode="decimal" onChange={e => setNewAmount(e.target.value)} placeholder="250.00" required/></label><label>PAYMENT DUE<input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} required/></label></div><label>RECIPIENT ADDRESS <span>OPTIONAL</span><input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="G..."/></label><button className="button button-dark full" type="submit">Save commitment ↗</button></form></div><div className="panel list-panel"><div className="section-title form-title"><div><h2>Upcoming commitments</h2><p>{commitments.length} item{commitments.length === 1 ? "" : "s"} • {amountText(safety.reserved)} XLM planned</p></div></div>{upcoming.length ? <div className="commitment-list">{upcoming.map(c => <div key={c.id} className="commitment-item"><div><b>{c.label}</b><p>Due {c.due}{c.recipient ? ` • ${short(c.recipient)}` : ""}</p></div><strong>{amountText(c.amount)} XLM</strong><button type="button" aria-label={`Remove ${c.label}`} title="Remove commitment" onClick={() => setCommitments(prev => prev.filter(x => x.id !== c.id))}>×</button></div>)}</div> : <div className="empty-block roomy"><span className="empty-doodle">◈</span><b>Your commitments will appear here.</b><p>Plan future obligations to see your remaining budget.</p></div>}</div></div></>}

        {view === "payments" && <><div className="simple-heading"><div className="eyebrow">02 / EXECUTION</div><h1>Pay with purpose.<br/><em>Proof comes built in.</em></h1><p>Send real XLM on Stellar Testnet with Varial. KoraGuard checks your local spending plan before requesting your wallet signature.</p></div><div className="two-col"><div className="panel form-panel"><div className="section-title form-title"><div><h2>New Testnet payment</h2><p>Recipient must have a funded Stellar account</p></div></div><div className="payment-warning"><strong>TESTNET XLM ONLY</strong><p>This action submits an actual Testnet transaction after wallet approval. It does not use a deployed vault or stablecoin yet.</p></div><form onSubmit={e => { e.preventDefault(); if (!wallet) connectWallet(); else setConfirmPayment(true); }} className="form-stack"><label>RECIPIENT STELLAR ADDRESS<input value={payTo} onChange={e => setPayTo(e.target.value.trim())} placeholder="G..." required/></label><label>PAYMENT AMOUNT (XLM)<input inputMode="decimal" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.5" required/></label><div className="inline-preview"><span>Available by plan</span><strong>{wallet ? amountText(safety.safeToPay) : "—"} XLM</strong></div><button className="button button-dark full" type="submit" disabled={busy || (Boolean(wallet) && !readyToPay)}>{!wallet ? "Connect wallet to continue ↗" : "Review payment ↗"}</button>{wallet && payNumber && !canPlanPayment(payNumber, safety) && <p className="field-error">This amount is above the available planning buffer.</p>}</form></div><div className="panel explanation-panel"><span className="tag">HOW THE PAYMENT WORKS</span><div className="steps"><div><span>01</span><div><b>Check commitments</b><p>KoraGuard calculates your local available funds.</p></div></div><div><span>02</span><div><b>Approve in your wallet</b><p>Varial signs the actual Stellar Testnet transaction.</p></div></div><div><span>03</span><div><b>Keep the receipt</b><p>Open an independent Testnet explorer record.</p></div></div></div><div className="caution-box">Your wallet remains in your control. This version cannot prevent payments made in other apps; contract-enforced reserves are a separate development milestone.</div></div></div>
          {confirmPayment && <div className="modal-backdrop" onClick={() => setConfirmPayment(false)}><div className="modal" role="dialog" aria-modal="true" aria-label="Confirm testnet payment" onClick={e => e.stopPropagation()}><div className="eyebrow">FINAL REVIEW / STELLAR TESTNET</div><h2>Approve this payment?</h2><div className="modal-amount">{payNumber} <small>XLM</small></div><p className="modal-destination">To {short(payTo)}</p><p>Only continue if the amount and recipient are correct. You will be asked to approve in Varial.</p><div className="modal-buttons"><button className="button button-outline" onClick={() => setConfirmPayment(false)} type="button">Cancel</button><button className="button button-dark" onClick={sendPayment} disabled={busy} type="button">{busy ? "Submitting…" : "Sign and send ↗"}</button></div></div></div>}
        </>}

        {view === "activity" && <><div className="simple-heading"><div className="eyebrow">03 / VERIFICATION</div><h1>A payment made.<br/><em>A receipt that stays.</em></h1><p>Every successful payment from this browser session is linked to independent Stellar Testnet transaction evidence.</p></div><div className="panel list-panel full-panel"><div className="section-title form-title"><div><h2>Payment receipts</h2><p>Recorded locally in this browser</p></div><span className="small-count">{receipts.length} RECEIPTS</span></div>{receipts.length ? <div className="receipt-list">{receipts.map(r => <div className="receipt" key={r.id}><div className="receipt-coin">↗</div><div className="receipt-description"><b>{amountText(r.amount)} XLM sent</b><small>{new Date(r.timestamp).toLocaleString()} • To {short(r.destination)}</small><span className="tx-hash">TX: {short(r.hash)}</span></div><a href={`https://stellar.expert/explorer/testnet/tx/${encodeURIComponent(r.hash)}`} target="_blank" rel="noreferrer">Verify on-chain ↗</a></div>)}</div> : <div className="empty-block roomy"><span className="empty-doodle">▱</span><b>No verified payments yet.</b><p>Your first completed testnet transfer will appear here.</p><button className="button button-outline" type="button" onClick={() => goto("payments")}>Make a payment ↗</button></div>}</div></>}

        {view === "architecture" && <><div className="simple-heading"><div className="eyebrow">04 / OPEN DEVELOPMENT</div><h1>Trust should be<br/><em>something you can verify.</em></h1><p>A transparent view of what is working now and what we are building next.</p></div><div className="architecture-grid"><div className="panel architecture-card"><span className="phase phase-working">BUILDING NOW</span><h2>Client-side planning</h2><p>Local commitments, live Testnet XLM balance, payment approval with Varial, and transaction evidence.</p><span className="tech-label">NEXT.JS · STELLAR SDK · VARIAL</span></div><div className="panel architecture-card"><span className="phase phase-progress">CONTRACT IN SOURCE</span><h2>Guarded reserve vault</h2><p>Rust smart contract draft for deposits, owner-defined commitments, cancellations, and restricted payouts. Not deployed or integrated.</p><span className="tech-label">RUST · SOROBAN SDK</span></div><div className="panel architecture-card"><span className="phase phase-future">PLANNED</span><h2>Stablecoin workflows</h2><p>Asset-specific planning, live contract calls, team payment requests, and policy-aware agent-assisted payment preparation.</p><span className="tech-label">STELLAR ASSET CONTRACTS · RPC</span></div></div><div className="panel roadmap"><div className="panel-top"><span className="tag">ONE-WEEK BUILDER MILESTONES</span></div><div className="roadmap-list"><div><strong>01</strong><span>Wallet + payments</span><small>Testnet payment flow and receipts</small></div><div><strong>02</strong><span>Contract verification</span><small>Compile, test and deploy vault contract</small></div><div><strong>03</strong><span>Live vault integration</span><small>Lock and release token funds on-chain</small></div><div><strong>04</strong><span>Showcase evidence</span><small>Independent transaction / contract proofs</small></div></div></div></>}
        <footer className="page-footer"><span>© 2026 KoraGuard. Built with intention.</span><span>TESTNET BUILD · NO REAL-MONEY GUARANTEES</span></footer>
      </main>
    </div>
  </div>;
}
