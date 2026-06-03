# PrintStream Design System

> A monochromatic, pearlescent, code-language aesthetic — streetwear minimalism meets tactical HUD.

PrintStream is a high-contrast black-and-white visual identity that treats every surface like a precision-printed instrument. The design language borrows the vocabulary of programming terminals, tactical reticles, holographic foil, and glitched data — but condenses all of it into a disciplined, near-monochromatic system. From a distance, it reads clean and minimalist. Up close, it reveals a dense mesh of micro-typography, codes, brackets, and iridescent accents.

## Sources

- **User-provided brief** (Spanish) describing PrintStream's four visual pillars: monochromatic pearlescent palette, digital/code UI language, geometric glitch iconography, and "complex minimalism."
- **Three reference images** (weapon skins) illustrating the style in-motion — kept in `assets/reference-*.webp`.
- No codebase, Figma, or slide deck was attached. The system is synthesized from the brief + reference visuals.

---

## Index

| File / Folder              | What it is                                                                |
|----------------------------|---------------------------------------------------------------------------|
| `README.md`                | This document — brand + system overview                                   |
| `SKILL.md`                 | Skill frontmatter (cross-compatible with Claude Code skills)              |
| `colors_and_type.css`      | All CSS variables (color, type, spacing, radii, shadows) + utility classes|
| `assets/`                  | Reference imagery, logomarks, SVG glyphs & icons                          |
| `preview/`                 | Small HTML cards rendered in the Design System review tab                 |
| `ui_kits/printstream-os/`  | Core UI kit — a PrintStream-branded tactical OS dashboard                 |
| `ui_kits/printstream-web/` | Marketing/product-site UI kit                                             |

No slides were requested; none were produced.

---

## Content Fundamentals

PrintStream copy mimics the tone of a **firmware changelog**, **firearms maintenance card**, or **streetwear tech-pack**. Language is terse, instructional, slightly cryptic. It should feel like a command a technician types into a terminal — not like marketing.

- **Voice:** Third-person technical. No "we," rarely "you." Products are referred to by their code (e.g. `B11;`, `B15;`, `B45;`).
- **Casing:** `lower_snake_case;` with trailing semicolons for system labels (`_noise_disabled;`, `_steady_aim;`, `///handle_with_care;`). `UPPERCASE` for short ticker codes and module names (`XXXY`, `B11`, `RX-04`).
- **Punctuation as ornament:** leading `_`, `///`, trailing `;` and `:` are structural, not grammatical. They signal "this is a parameter, not prose."
- **Numbers:** Always treated as data — fixed-width monospace, with units attached (`0.35ms`, `04/∞`, `REV.B`).
- **Emoji:** **Never.** PrintStream uses pixel hearts, diamonds, and glitch glyphs as iconography (see `assets/glyphs/`), but never emoji.
- **Tone vibe:** 20% street, 80% engineering. The product is *cool by being competent.*

### Example copy

| Context         | Write as                                                      |
|-----------------|---------------------------------------------------------------|
| Button          | `DEPLOY;` · `CALIBRATE;` · `HOLD_TO_ARM;`                     |
| Empty state     | `// no_packets_received;`                                     |
| Error           | `ERR_01: handshake_rejected;`                                 |
| Success         | `_ok;  calibration_complete;  tolerance 0.02mm`               |
| Marketing H1    | `Print it. Stream it. Hold with care.`                        |
| Footer ticker   | `///B11;  ///B15;  ///B45;  rev.B — handle_with_care;`        |

---

## Visual Foundations

### Palette
- **Core:** Extreme contrast — pure `#FFFFFF` against near-black `#050507`. Mids are cool pearlescent grays (`#EDEDEF` → `#8A8A90`).
- **Pearlescent accents:** A four-stop gradient (rose → lilac → cyan → mint) used only in *narrow* slivers: barcodes, reticle highlights, a single hairline at a card edge, the bottom-edge of a CTA, shimmer on hover. Never as a full background.
- **Semantic signal colors** (caution, danger, ok) are muted — mustard, terracotta, sage — so they read as printed ink stamps rather than UI chrome.

### Type
- **Display:** Space Grotesk Bold — used for XXXY-style large glyphs and numeric headlines.
- **Body:** Inter Tight — dense, neutral, modern.
- **Mono:** JetBrains Mono — the hero voice. Every code-label, timestamp, serial number, or command uses it. Lowercase + `_` + `;` is the signature treatment.

### Backgrounds
- **Default surface:** `--ps-paper` (`#F4F4F2`) or plain white. Dark mode uses `--ps-ink-900` with a faint grain/noise texture.
- **No gradient washes.** The only gradient in the system is the pearlescent shimmer, and it is used as a ~4px line, edge, or stroke — never as a panel fill.
- **Grain / texture:** A subtle SVG noise overlay may be applied to dark panels at ~6% opacity to emulate printed-metal.

### Borders & Hairlines
- 1px black lines are the default divider — think laser-etched, not soft.
- Soft borders use `rgba(0,0,0,.08–.12)` for quiet UI scaffolding.
- **Reticle brackets** ( `⌐ ¬ L J` style corners) replace many traditional card borders.

### Corners / Radii
- Default is **square** (`0px`). Cards use `8px` at most. Pills `999px` for barcode capsules and status chips. Nothing in the system uses "soft" radii (16px+).

### Shadows (elevation)
- Shadows are **hard and thin**, like an etched underline. No blurry clouds.
- Elevation is communicated by a 1px outline + a 1–2px offset shadow.
- The deepest shadow (`--ps-shadow-deep`) is reserved for modals on dark surfaces.

### Transparency & Blur
- **Sparingly.** A 12% black scrim over imagery for legibility; a single `backdrop-blur(12px)` on fixed top-bars. Glassmorphism (frosted panels) is **not** used.

### Motion
- Easing is crisp: `cubic-bezier(.2,.7,.2,1)` — "print-head" easing: fast in, settled out.
- A secondary `steps(6, end)` easing emulates a terminal cursor / type-on effect for code labels and counters.
- **Durations:** 120ms (hover), 220ms (state change), 420ms (panel transition). No bouncy springs.

### Hover / Press states
- **Hover (light button):** background shifts `white → pearl-100`, a 1px pearlescent gradient underline fades in at the bottom edge.
- **Hover (dark button):** background `ink-900 → graphite-700`, same shimmer underline.
- **Press:** translateY(1px), shadow collapses to `--ps-shadow-hair` — "the key bottoms out."
- **Focus:** a 2px offset outline in current `color`, with corner reticle tick-marks on the 4 corners (via the `.ps-reticle` utility).

### Imagery vibe
- **Cool-to-neutral.** Never warm. Heavy contrast. High-key product shots on white, or full-dark context shots with a single pearlescent light source. Grain is acceptable; over-saturation is not.
- Macro / micro detail photography (knurling, texture maps, PCB) is on-brand.

### Cards
- Flat white surface, 1px `rgba(0,0,0,.08)` border, optional 2px hard bottom-shadow. No rounded-left-border accent colors, no colored backgrounds.
- Card headers carry a `_code_label;` in the top-left corner and a `B##;` tag in the top-right — like a spec-sheet.

### Layout rules
- Dense by default — PrintStream is *complex minimalism*. White space is earned by removing ornament, not padding everything.
- Grids are visible. Faint 1px dotted grids can underlay hero sections.
- Fixed elements: top-bar (40–48px, backdrop-blurred), a right-rail "readout" sidebar (280px) in OS surfaces. Barcode strips may pin to the bottom edge.
- Baseline grid is **4px**.

---

## Iconography

PrintStream uses three layered icon systems, each with a specific role:

1. **Brand glyphs (SVG, in `assets/glyphs/`)** — pixel heart, diamond, target-X, XXXY monogram, barcode fragment, corner reticle. These are the *signature* marks and appear on nearly every screen.
2. **Functional icons — Lucide (via CDN)** — thin 1.5px strokes, square caps, no fill. Matches the "drafted / printed" aesthetic. Used for navigation, toolbars, inline UI. Loaded from `https://unpkg.com/lucide-static@0.469.0/` when needed.
3. **Emoji / unicode:** Not used. Pixel heart SVG (`♥`-equivalent) replaces ❤️; pixel diamond replaces ◆; target-X replaces ✕.

### Substitutions flagged
- **Fonts:** Space Grotesk, JetBrains Mono, and Inter Tight are all loaded from **Google Fonts** as best-match substitutes for what would be a custom industrial mono in a real PrintStream product. If you have brand-owned TTFs, drop them into `fonts/` and update the `@import` at the top of `colors_and_type.css`.
- **Icons:** Lucide is used as the utility-icon set because no proprietary set was provided. Swap for brand icons if/when available.

See `preview/brand-glyphs.html` for the current glyph set.

---

## Quick reference

```css
/* Pull tokens into any file */
@import url('colors_and_type.css');

.example {
  color: var(--ps-fg-1);
  font-family: var(--ps-font-mono);
  letter-spacing: var(--ps-track-caps);
  border: 1px solid var(--ps-border-hair);
  background: var(--ps-bg-card);
  box-shadow: var(--ps-shadow-card);
}
```

---

## Caveats

- No codebase / Figma was provided — **every component is synthesized** from the brief and reference imagery. Production pixel-fidelity will require a real component source.
- Fonts are Google Fonts substitutes (see above).
- Iconography glyphs are **drawn from scratch as SVG** to match the reference-image style, since no official PrintStream icon asset was supplied.
