# KoraGuard | Design & motion system

## Design rationale

KoraGuard is a serious financial utility for small-business payments, not an animated technology showcase. The landing page uses an **editorial financial statement** as its central metaphor: balances, commitments, reservations, and receipts are laid out like a ledger. Every animation is tied to information hierarchy or the feeling of a real control surface.

The palette is a KoraGuard identity, not Stellar's official brand color palette:

- Forest / deep: `#10271f`, `#142b22`, `#163126`
- Acid-lime annotation: `#c5f078`
- Ivory / paper: `#f4f3e9`, `#fafaf5`
- Primary ink: `#182c22`
- Neutral borders and reserved dark olive tones for trust and differentiation

## Navigation and information architecture

- `/`: public site. Visitors learn about the problem, adjust an **illustrative** planning simulator, inspect current status/roadmap, and can enter the app.
- `/app`: original wallet workspace, including commitment planning, Testnet XLM transfer flow and receipt viewer. The workspace remains reachable through an explicit CTA and now includes a return-to-website link.
- Primary navigation: Problem, Explore the logic, Approach, Roadmap, Enter the app.
- No invented customer logos, endorsements, metrics or claims of deployed contracts.

## Original motion choreography

1. **Hero**: typography reveals through a spatial crop and stagger; reserve instrument shifts a few pixels with scroll. Graphics carry a measured ledger sweep, not a general-purpose bouncing animation.
2. **Section rhythm**: content enters on intersection with clip-path and 27px vertical motion. The behavior is intentionally reversible only on first entry to reduce distraction on backscroll.
3. **Financial calculation**: a real client-side simulator updates while the user drags balance, commitments and intended payment. The reserved/available bar and status label explain **why** a payment is within or above the plan.
4. **Scroll progress**: a thin reading indicator uses requestAnimationFrame throttling rather than React re-renders on each scroll tick.
5. **Vault concept**: single crafted flat graphic with concentric etched rings. Hover movement is subtle; draft status stays visible.
6. **Mobile**: navigation is fully reachable with touch. Content reflows to one column. No horizontal swipe-locked storytelling or forced smooth scrolling.
7. **Accessibility**: semantic landmarks, accessible buttons and range labels, visible keyboard focus, `aria-live` for planning status, decorative SVGs hidden from assistive tech, and full reduced-motion bypass.

No additional animation dependency has been introduced. The initial release prioritizes reliable Next.js/Android performance over large runtime animation libraries or WebGL. This follows the principle of using motion to reveal financial causality rather than copying a ready-made landing component.

## UI-Max source-guided review

Sources studied for principles (not copied code):

- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/Nyx-abu/awwwards-ui-skill

Qualitative self-audit aligned with the UI-Max scorecard:

| Dimension | Source evidence | Outstanding QA |
| --- | --- | --- |
| Easing / stagger | Mask + 27px movement; stagger on primary hero content; cubic-bezier timing | Review on midrange Android |
| Narrative | Hero → problem ledger → live planning → technical status → roadmap | Observe scroll continuity |
| Composition | Full-width dark hero, asymmetrical typography + instrument | Check 375px / 768px / 1440px in browser |
| Depth | Scroll-set instrument offset; rotation and etched vault illustration | Check on reduced-performance devices |
| Interaction | Real-time sliders, menu, CTAs, native FAQ disclosure | Keyboard testing on live deploy |
| Accessibility | Focus styles, labels, reduced-motion support | Axe audit + manual screen-reader testing |
| Performance | Passive scroll, requestAnimationFrame, IntersectionObserver, zero WebGL | Lighthouse / Core Web Vitals audit |
| Responsive | Breakpoints at 1250, 980, 760 and 500px | Visual screenshots not yet completed |
| Brand | Custom ledger motif and functional progress graphics | Validate with real users |

**This document is a source-code design review, not a claim that a live UI-Max score or accessibility audit has been completed.** Do not publish numerical scores until browser and device evidence is collected.
