# KoraGuard technical design

Status: **early implementation, Stellar Testnet only**. Documentation date: 2026-11-21.

## Core user story

A Ghanaian or Nigerian business gets funds and owes suppliers, staff, and service providers. Before spending, the business wants to answer: **How much can I safely pay without compromising existing obligations?**

## Current web application

- Next.js client, Stellar JavaScript SDK, Varial (formerly Freighter) wallet.
- Network: Stellar Testnet, Horizon endpoint.
- On connect, the app reads **real native XLM** balance.
- User saves planned commitments in browser localStorage.
- The policy calculator computes `safeToPay = max(0, balance - planningNetworkHold - sum(commitments))`.
- Default planning network hold: **2 XLM**. This is NOT the exact protocol account reserve and is not a guarantee of future fees or minimum balances.
- A wallet-signed Testnet XLM payment can be sent to an **existing, funded G-address**. A successful Horizon submission is logged locally with a transaction hash.
- The user can verify the hash on stellar.expert Testnet explorer.

### Key limitation

The web planner **does not enforce** spending restrictions. The user controls the wallet and can transfer outside KoraGuard. Commitments are a planning feature, not on-chain locked assets. Do not describe them as "protected on chain" until the vault is deployed and the app actually uses it.

## Planned Soroban vault

The Rust draft under `contracts/koraguard-vault` implements an escrow design for a *single SEP-41 compatible token contract* selected on deployment.

```
User wallet --deposit(token)--> Vault token balance
  owner.total -> amount held for that wallet
  owner.reserved -> sum of commitments
  owner.available = total - reserved

owner.commit(id,recipient,amount)
  requires owner signature
  fails if amount > available
  locks part of deposited funds against withdrawal

owner.withdraw(amount)
  requires owner signature
  fails if amount > available

owner.pay(id)
  requires owner signature
  transfers exactly the commitment amount
  transfers ONLY to the recorded recipient
  reduces total, reserved and deletes commitment

owner.cancel(id)
  requires owner signature
  unlocks the amount without moving any tokens
```

### Security boundaries

- `owner.require_auth()` for every balance-changing user action.
- Deposits transferred to the vault token contract, not a backend database.
- Token transfers and storage updates take place in a transaction, so failed calls revert.
- No browser-stored or server-stored private keys.
- Integer token base units, not floating-point, in the contract.
- Current draft has no timelocks, shared team signatures, delegate spenders, or public agent permissions.
- A person who owns a commitment may cancel it. Thus "locked" means withdrawn funds cannot violate a **currently active** commitment; it does not represent irrevocable escrow against the owner's wishes.
- Contract storage TTL is extended on writes; long-lived archival recovery and full storage-rent policy need further engineering.
- **Not audited**, compiled, or deployed in this release. Never use real funds or mainnet.

## One-week implementation sequence

1. Run web app, connect Varial Testnet account, send XLM to an existing account, verify receipt.
2. Install Rust + Stellar CLI; build and test contract. Resolve compiler/runtime issues.
3. Deploy draft vault to testnet using a known test token contract address.
4. Generate typed TS bindings and wire deposit, create commitment, guarded withdrawal, pay and cancel through wallet auth.
5. Build the presentation around an on-chain **rejected excessive withdrawal**, a permitted payment, and independent explorer proof.
6. Run failure-mode and security checks, including duplicate IDs, unauthorized owners, insufficient deposits, negative amounts, and failed token transfers.

## Upgrade path

A production version needs code review, external audit, accurate protocol reserve calculations, secure account/auth support across wallets, reliable transaction reconciliation, indexer / receipt persistence, legal and financial compliance research, and testing under network load. "AI" will be restricted to non-custodial planning assistance. It must never sign or authorize user payments silently.
