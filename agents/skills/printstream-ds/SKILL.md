---
name: printstream-ds
description: Use this skill to generate well-branded interfaces and assets for PrintStream, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy the needed assets from this skill directory into the user's current working directory, then create static HTML files that reference them. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick-reference

- **Tokens:** `colors_and_type.css` — import at the top of any file for CSS variables and utility classes (`.ps-h1`, `.ps-code-label`, `.ps-reticle`, etc).
- **Assets:** `assets/logomark.svg`, `assets/logotype.svg`, and the `assets/glyphs/` folder (XXXY, pixel heart, diamond, target-X, reticle, barcode, glitch-block, register-cross, no-symbol).
- **UI Kits:** `ui_kits/printstream-os/` (tactical dashboard) and `ui_kits/printstream-web/` (marketing site). Each has `index.html` you can open + JSX components you can lift from.
- **Voice:** lowercase `_snake_case;` labels, `///directive;` prefix, `B##;` ticker codes, no emoji.
