# Fonts

All self-hosted fonts are under the SIL Open Font License 1.1 (`OFL.txt` beside each family in `assets/fonts/`): web embedding, self-hosting and commercial use are allowed.

| Role | Stack | Self-hosted file(s) |
|---|---|---|
| Sans | Source Sans 3 | `source-sans-3/` variable, upright + italic, weight 200–900 |
| Serif | Georgia → Gelasio | `gelasio/` Regular 400 (metric-compatible with Georgia) |
| Mono | Consolas → JetBrains Mono | `jetbrains-mono/` Regular 400 + SemiBold 600 |

## Gotchas

- **Source Sans 3**: the variable file's default instance is 200 (ExtraLight), so its `@font-face` always declares the range `font-weight: 200 900`. Its licence reserves the name "Source": a subset or modified copy must be renamed.
- **JetBrains Mono SemiBold**: the file's internal weight class is 472, so its `@font-face` declares `font-weight: 600` explicitly.
- **Georgia and Consolas** are proprietary system fonts: they appear only by name in the stacks, for visitors who already have them installed. Their files stay out of the repo.
