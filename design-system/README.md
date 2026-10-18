# Modern Light: Intonation's design system

Every UI decision follows this folder. The tokens are the source of truth for values; `reference/DESIGN.md` explains how to use them (surfaces, type roles, components, do's and don'ts).

## Files

- `tokens/`: CSS custom properties. Load in this order: `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `base.css`.
- `assets/fonts/`: self-hosted webfonts with their licences. `tokens/fonts.css` loads them by relative path, so the two folders move together.
- `reference/DESIGN.md`: the full design language.
- `reference/FONTS.md`: font stacks, licences and loading gotchas.

## Intonation decisions on top of the system

- **Light only**, 3D scenes included: scenes sit on the neutral ladder and are drawn in the system's charcoal, teal and gold.
- **Wordmark**: the word "Intonation" in the serif stack (Georgia → Gelasio), in `--brand-mark`, top left, with no logo symbol. This replaces the sans `heading-lg` wordmark in `DESIGN.md`.
- **Naming**: the system is called Modern Light; the repo carries no third-party brand names.
