# KoraGuard

**Every payment has a before.**

A financial operations workspace for freelancers and small businesses building on **Stellar**. KoraGuard brings payment planning, committed reserves, and user-authorized blockchain payments into one straightforward workflow.

> **Status:** Early open-source prototype for the Stellar Buildathon, 2026. Stellar **Testnet only**. The Soroban reserve vault is a draft and is not yet deployed or integrated. This repository is not affiliated with or endorsed by the Stellar Development Foundation.

[Landing & motion](#the-landing-experience) · [Product vision](#the-problem) · [Current capabilities](#current-build-status) · [How it works](#how-koraguard-works) · [Architecture](#technical-architecture) · [One-week roadmap](#one-week-buildathon-roadmap) · [Beyond the buildathon](#long-term-roadmap) · [Run locally](#getting-started)

## The landing experience

**V0.2 adds a complete product website at `/` and moves the existing wallet dashboard to `/app` without resetting the browser storage keys or changing the payment workflow.** The landing is a public explanation of what KoraGuard is building. It is not a fake fully working product demo.

| Section | Purpose | Experience |
| --- | --- | --- |
| Editorial hero | Explain why a wallet balance is not the same as an available budget | Asymmetric headline, mechanical reserve card, deliberate depth movement |
| The problem | Show the hidden obligations behind a single balance | Oversized typography and a worked illustrative ledger |
| Product philosophy | Establish the central principle | Full-bleed statement with masked scroll reveal |
| Planning lab | Invite visitors to examine the core financial logic | Three interactive amount sliders and immediate pass/review feedback |
| How it works | Distinguish existing features from unfinished vault enforcement | Four-stage process with clear implementation badges |
| Technical unlock | Explain why Soroban is important | Constrained reserve-vault visual, explicitly labeled as a contract draft |
| Roadmap | Explain milestones without overclaiming | Current, next and longer-term scope |
| FAQ | Clarify custody, funds, and security | Accessible native disclosure elements |
| Closing | Guide the user into the application | Enter-app call to action |

All numerical illustrations are labeled. The page does not initiate transactions, require authentication, or claim the vault is deployed.

**Visual system:** original KoraGuard forest green, acid-lime highlight, warm ivory, editorial sans-serif paired with a restrained serif accent. No stock photos, floating purple shapes, generic gradient hero, infinite fake numbers or gratuitous particle effects. The animated financial graphics and icons are code-driven.

**Motion system:** content masks with spatial offset, a tracked scroll-reading indicator, a mechanical balance reveal, a restrained instrument parallax, a precisely animated calculation bar, and functional hover/slider states. Motion honors `prefers-reduced-motion` and never gates navigation. We reviewed UI/UX Pro Max and UI-Max design guidance for motion, responsive layout, accessible focus states and performance; KoraGuard uses its own implementation. See [docs/DESIGN_AND_MOTION.md](docs/DESIGN_AND_MOTION.md) for the implementation notes and self-audit.

**Status:** source prepared, but complete Next.js/Vercel and multi-device checks must still be completed before calling the release production-ready.

## The problem

For a business, the number displayed in a wallet is not always the amount available to spend. Incoming funds may already be needed for suppliers, wages, subscriptions, and upcoming invoices. Today's payment can create tomorrow's shortfall.

Existing wallets make transferring funds easy. They seldom explain how a transfer affects the commitments a business has already made. Tracking these obligations in a separate spreadsheet creates friction and does not, by itself, protect funds.

KoraGuard addresses a specific question:

> **If I make this payment now, will I still be able to cover what I have committed to pay?**

The first users we have in mind are independent contractors, small service businesses, and teams managing frequent payments in Nigeria and Ghana. The idea is not limited to either market.

## The proposed solution

KoraGuard combines three layers:

1. **Clarity:** a live wallet balance, planned obligations, and a readable Safe-to-Pay assessment.
2. **Control:** a Soroban vault designed to hold a chosen asset and enforce owner-approved reserve allocations against withdrawals.
3. **Proof:** user-signed transfers and independently verifiable on-chain transaction receipts.

The long-term product can support stablecoin workflows, recurring obligations, and agent-assisted preparation of payments. Those are roadmap items, **not completed features**.

## How KoraGuard works

**Target user journey:**

1. Connect a Stellar wallet on Testnet.
2. Review the on-chain asset balance and add obligations such as a supplier invoice or staff payment.
3. Check the available balance after planned commitments and a conservative network hold.
4. Once the vault is integrated, deposit selected assets and reserve a portion for a named recipient.
5. Attempt to withdraw more than the available unreserved amount. The **contract must reject** that withdrawal.
6. Authorize an allowed payment using the wallet, then open the transaction on a public Stellar explorer.

**Key product distinction:** a warning in the interface is useful, but not sufficient. The buildathon's primary technical proof will be a **contract-enforced denied withdrawal**, followed by an approved payout. This final flow is **not yet working in V0.2**.

## Current build status

We distinguish existing source code from independently verified on-chain behavior.

| Component | State as of 22 Nov 2026 | Important limitation |
| --- | --- | --- |
| Responsive Next.js workspace | Implemented in source | Full production build and device QA pending |
| Stellar Testnet wallet connection | Integration coded | Requires live wallet confirmation |
| Live native XLM balance | Horizon reading coded | Requires funded Testnet account and network test |
| Commitment planner | Implemented | Stored in this browser; **does not lock assets** |
| Safe-to-Pay calculation | Implemented and unit-tested | Advisory calculation, not an exact protocol reserve |
| Native XLM Testnet transfer | Wallet-signing flow coded | Live end-to-end transaction not yet verified |
| Transaction receipts | Local hash history and explorer links coded | Not a durable account-indexing service |
| Soroban reserve vault | Rust draft in source | **Not compiled, audited, deployed, or connected to UI** |
| Guarded stablecoin settlement | Planned | Not yet implemented |
| Agent-assisted payments | Planned | No autonomous transfer authority in this release |
| Animated long-form landing page | Implemented in source | Live browser and device visual QA pending |
| Dashboard theme switcher | Planned | Accessible light/dark theme switcher not yet implemented |

Do not use real assets. Do not claim that KoraGuard can prevent transfers initiated outside its own future vault. A planned commitment in V0.2 is **not an escrow**.

## Why Stellar

- **Payments and assets:** a foundation for sending native XLM now and exploring supported stablecoin assets later.
- **Soroban:** transparent contract rules for reserving funds and authorizing constrained payouts.
- **Wallet authorization:** signing stays with the user; the application does not collect private keys.
- **Verifiability:** explorers can independently show successful network transactions.
- **Ecosystem potential:** a focused financial tool can evolve through public review, iteration, and open-source collaboration.

## Technical architecture

```text
Stellar wallet (user approval)
           |
           v
Next.js client  -----  Horizon / Stellar RPC
    |                       |
    |                       +-- Read balances / inspect transactions
    +-- Local commitments (V0.2 only)
    +-- Safe-to-Pay advisory policy
    +-- Wallet-signed XLM Testnet transfers
    |
    +-- Planned: typed Soroban client
                      |
                      v
             Soroban reserve vault
             - deposit token
             - create commitment
             - reject over-withdrawal
             - pay recorded recipient
             - cancel / release commitment
```

### Stack

- **Interface:** Next.js 16, React 19, TypeScript, responsive custom CSS.
- **Wallet and chain:** `@stellar/varial-sdk`, `@stellar/stellar-sdk`, Stellar Horizon, Testnet.
- **Vault draft:** Rust and `soroban-sdk` for a SEP-41 compatible token contract.
- **Current persistence:** browser `localStorage`, not a production database.
- **Quality checks:** Node policy unit tests, TypeScript check and Next.js build scripts.

Read the technical detail and security boundaries in [docs/architecture.md](docs/architecture.md). The vault is designed to protect assets **deposited into it**. It cannot freeze assets in an unrelated user wallet. The current owner can cancel a commitment, so this is not irrevocable escrow.

## Product and design principles

KoraGuard should look and behave like a credible financial product, not a generic blockchain dashboard.

- **Visual identity:** deep forest green, restrained lime accents, warm whites, high contrast, and typography-led hierarchy. These are **KoraGuard's colors**, not a claim that green is Stellar's official brand palette.
- **Story before dashboard:** a full editorial landing page explains the problem, product, trust model, and actual progress before entering the workspace.
- **Function before decoration:** useful empty states, real network signals, clear transaction confirmations, readable errors, no invented financial metrics, no fake demo balances.
- **Mobile first:** accessible navigation, a properly aligned wallet action, clean payment review and receipt views.
- **Motion with purpose:** subtle transitions and scroll-linked storytelling with reduced-motion support; avoid default AI-looking gradients.
- **Themes:** accessible light and dark modes are planned, not present in the first release.

## One-week buildathon roadmap

Priorities are sequenced for a **working technical demonstration**, not the number of screenshots. Dates below are relative to build start.

| Day | Milestone | Evidence / acceptance test |
| --- | --- | --- |
| **1** | Project setup, README, planning logic and UI foundations | Public repo, repeatable install, policy tests pass |
| **2** | Live Testnet wallet, funding and basic transfer | Wallet authorizes a successful XLM transfer; explorer shows hash |
| **3** | Compile and test Soroban reserve contract | Contract builds; tests cover deposit, commitment and denial |
| **4** | Deploy a supported test token and the reserve vault on Testnet | Deployment IDs, funded test account and verifiable deposit |
| **5** | Wire client to deposit, reserve, withdraw and pay | Wallet-authorized on-chain calls update actual vault state |
| **6** | Edge cases, mobile UX, docs, demonstration reliability | Unauthorized / over-limit actions fail; receipts open; basic device QA |
| **7** | Public demo and submission | Repeatable sequence: reserve → denied withdrawal → allowed payout → receipt |

If time runs short, **contract-enforced reserve logic and a reproducible demo take priority** over AI agents, extra currencies, analytics and animations. Each milestone is a target, not a claim of completion.

## Long-term roadmap

### Phase A: after buildathon
- Persistent receipts and reconciliation using an indexer or backend database.
- Testnet stablecoin deposits and payments with correct asset precision and issuer handling.
- Usability sessions with freelancers and small businesses; revise language and defaults.
- Better fee explanations, account minimum-balance logic and failure recovery.

### Phase B: product beta
- Recurring commitments, due-date reminders and projected cash flow.
- Shared approval policies for teams and delegated roles with narrowly scoped permissions.
- More wallet options, accessible theme support and internationalization.
- Monitoring, telemetry without sensitive wallet data and independent security review.

### Phase C: expansion
- Agent-assisted drafting of payment proposals with explicit human authorization.
- Business integrations, exportable records and stronger audit history.
- Mainnet readiness only after security review, threat modeling, external audit where appropriate, and real-user testing.

## Getting started

**Requirements:** Node.js 22.12+ and npm. A compatible Stellar wallet configured for **Testnet** is needed for wallet features.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` for the animated landing page. Select **Enter the app** or open `http://localhost:3000/app` for the existing wallet workspace. The app currently uses a public Stellar Testnet Horizon endpoint by default. Never put credentials or wallet secrets in `NEXT_PUBLIC_` variables.

```bash
# Run planning policy unit tests
npm run test:policy

# Local validation (needs dependencies installed)
npm run typecheck
npm run build
```

The vault draft is under `contracts/koraguard-vault`. It still requires a working Rust toolchain, Stellar CLI, unit tests, deployment, and client wiring before it can secure any user assets. See [docs/architecture.md](docs/architecture.md) and [DEPLOY.md](DEPLOY.md).

### Repository layout

```text
app/page.tsx                 Public scroll landing page
app/landing.css               Scoped editorial design + motion system
app/app/page.tsx              Existing wallet workspace at /app
app/globals.css               Shared base styles and workspace UI
lib/policy.ts                Safe-to-Pay policy and validation
contracts/koraguard-vault/   Soroban Rust contract draft
contracts/.../src/lib.rs     Vault source code
docs/architecture.md         Data flow, trust boundaries, integration plan
docs/MOBILE_GITHUB.md        Android upload and Git workflow
tests/                       Planning calculation tests
.github/workflows/           Automatic policy tests
README.md                    Product, scope and roadmap
DEPLOY.md                    Setup and deployment notes
```

## Success criteria for the showcase

We will only label a flow **complete** after it can be repeated with real Testnet transactions and verified independently.

1. A real connected wallet shows its actual Testnet balance.
2. A user deposits into the vault and defines a recipient commitment.
3. A withdrawal beyond unreserved funds is **rejected by Soroban**, not just JavaScript.
4. The wallet authorizes a valid payment and the intended recipient is paid.
5. A receipt shows the actual transaction hash and explorer evidence.

## Security and current limitations

This is experimental software. No audit has been performed. Source code, UI tests, and a green build do not guarantee contract safety. The initial payment flow uses native XLM for payments while the draft vault targets a compatible token interface. Those are **separate flows** until the app integrates and tests the vault. Commitment amounts are advisory until then. No automatic or unattended spending is enabled.

## Contributing

Open an issue describing a bug, edge case or improvement. Small, reviewable pull requests with tests are preferred. Security-sensitive findings should not include private keys, tokens, or personal account data. Contributions to wallet compatibility, Soroban tests, accessibility, and documentation are especially welcome.

## Links and license

- Repository: https://github.com/paulos-ui/koraguard-stellar
- Mobile upload guide: [docs/MOBILE_GITHUB.md](docs/MOBILE_GITHUB.md)
- License: MIT, [LICENSE](LICENSE)
