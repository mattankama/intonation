# Modern Light: Intonation's design system

Every UI decision follows this folder. The tokens are the source of truth for values; `reference/DESIGN.md` explains how to use them (surfaces, type roles, components, do's and don'ts).

## Files

- `tokens/`: CSS custom properties. Load in this order: `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `base.css`.
- `assets/fonts/`: self-hosted webfonts with their licences. `tokens/fonts.css` loads them by relative path, so the two folders move together.
- `reference/DESIGN.md`: the full design language.
- `reference/FONTS.md`: font stacks, licences and loading gotchas.

## Intonation decisions on top of the system

- **Light only**, 3D scenes included: scenes sit on the neutral ladder and are drawn in the system's charcoal, teal and gold.
- **3D scenes** (decision #13, "Ink drawing"): unlit thin lines, small flat dots and label chips (Source Sans on translucent white) on `--canvas-warm`; no lighting, shading or shadows. A pure target is an uncoloured `--ink` ring. Lattice chord shapes are filled with `--accent-gold-soft`; comma-pump paths are `--link`.
- **Data colours, a scoped exception**: the rule that chromatic colour appears only as full-width bands does not apply to **data marks in 3D scenes and their legends** (including a legend's swatches beside a table). Up to four overlaid tuning systems take, in this order, `--data-system-1` charcoal (`--primary`), `--data-system-2` link teal (`--link`), `--data-system-3` forest (`--band-forest`) and `--data-system-4` deep gold (`--data-gold` #b8892a, a darkened `--accent-gold`, which is too pale on the light canvas). Use them nowhere else: not on controls, cards, borders or text.
- **Wordmark**: the word "Intonation" in the serif stack (Georgia → Gelasio), in `--brand-mark`, top left, with no logo symbol. This replaces the sans `heading-lg` wordmark in `DESIGN.md`.
- **Naming**: the system is called Modern Light; the repo carries no third-party brand names.
