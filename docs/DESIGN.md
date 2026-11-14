# PlayTheory — Design System Tokens & Guidelines

## Visual Identity: "Lab Notebook meets Arcade"

PlayTheory balances scientific rigor (computational modeling, differential equations, verifier proofs) with playful discovery (instant interactive simulations, tactile sliders, arcade aesthetics).

### 1. Color Palette

#### Base (Lab Paper & Deep Ink)
- `paper-50`: `#FAF7EE` — Primary background in light mode (warm, unbleached lab notebook parchment)
- `paper-100`: `#F5EFE0` — Secondary container / hover states
- `paper-200`: `#EADECA` — Card borders and subtle grid lines
- `paper-300`: `#D6C6A5` — Prominent borders and dividers
- `paper-800`: `#2B2824` — Secondary text in light mode, border in dark mode
- `paper-900`: `#181715` — Primary ink text in light mode, secondary container in dark mode
- `paper-950`: `#0F0E0D` — Deep ink background in dark mode

#### Arcade Accents (High Contrast, Functional)
- `arcade-cyan`: `#00E5FF` — Interactive selection, live metric plotting series A
- `arcade-amber`: `#FFB300` — Attention highlights, warning states, series B
- `arcade-crimson`: `#FF3366` — Primary call-to-action, key accents, error states
- `arcade-emerald`: `#00E676` — Verifier pass badges, active liveness status
- `arcade-purple`: `#7C4DFF` — Tour step indicator, series C

### 2. Typography
- **Headings & Badges**: Monospace display font (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`) with bold, technical tracking.
- **Body & Explanations**: Clean, legible system sans-serif (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) with generous line-height (`1.6`).
- **Equations & Math**: KaTeX inline and block rendering for mathematical foundations in tour and quiz steps.

### 3. Surface & Elevation
- **Borders over Shadows**: High-contrast 1px and 2px borders with subtle retro offset box shadows (`4px 4px 0px 0px var(--border)`).
- **Background Grid**: Subtle 24px x 24px lab notebook grid pattern.

### 4. Accessibility (WCAG 2.1 AA)
- Text contrast ratio >= 4.5:1 against respective backgrounds in both light and dark modes.
- Colorblind-safe palette for all multi-series canvas plots (`SimKit.palette`).
- Respects `prefers-reduced-motion` by starting simulations in a paused state.
- Keyboard navigation: Full focus rings (`focus-visible:ring-2 focus-visible:ring-arcade-cyan`).
