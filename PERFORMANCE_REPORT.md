# Performance Report — OrderPilot

Date: 2026-11-06 · Env: Termux, Node v26.3.1 (repo/CI: 24.x).

## Observed
- Live `https://orderpilot-za.vercel.app/`: HTTP 200 in 2.57s (single curl, warm Vercel edge).
- `npm test` runtime: 3.45s (34 pass, 1 fail — tsx blocker).
- No Lighthouse run in this pass — no scores claimed.

## Targets (not yet measured)
- Lighthouse Performance 90+ / Accessibility 95+ / Best Practices 95+ / SEO 90+; INP ≤200ms; LCP ≤2.5s; CLS ≤0.1.
- Vinite dev server cold start: PARTIAL (2.57s observed, single request).
- Nitro serverless function cold start on Vercel: UNVERIFIED.

## Notes
- No build was executed in this env (vite build requires env vars / DATABASE_URL potentially). Bundle size claims UNVERIFIED.
- Omit `npm audit` result (audit gate not configured; see O-004). Dependency surface is large (120+ prod deps); no high-severity findings confirmed without audit.