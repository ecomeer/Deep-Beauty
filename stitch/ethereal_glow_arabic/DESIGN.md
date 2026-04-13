# Design System Document: Editorial Skincare Excellence

## 1. Overview & Creative North Star

**Creative North Star: "The Modern Alchemist"**

This design system is built to transform a standard ecommerce transaction into a high-end editorial experience. It rejects the "templated" look of traditional retail in favor of a curated, bilingual journey that honors the heritage of Arabic script while maintaining a global luxury appeal.

The core philosophy is **Organic Asymmetry**. Rather than rigid, repeating grids, the system utilizes generous whitespace and intentional overlapping elements to create a sense of movement and breathing room. It is designed to feel like a premium physical magazine—where negative space is as important as the content itself.

---

## 2. Colors

The palette is rooted in the earth, using warm tones to evoke the natural ingredients of skincare and the tactile luxury of fine stone.

### Palette Highlights (Material Design Convention)
- **Primary (`#6f4627`):** Use for high-emphasis call-to-actions and signature branding elements.
- **Surface & Background (`#fff8f4`):** A warm cream base that prevents the "clinical" look of pure white.
- **Tonal Neutrals (`surface_container` series):** Used to define hierarchy without visual noise.

### The "No-Line" Rule
To maintain an editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries between content blocks must be established through:
1. **Background Color Shifts:** Transitioning from `surface` to `surface_container_low` to mark a new section.
2. **Generous Whitespace:** Using the spacing scale to create mental "fences" rather than physical ones.

### The "Glass & Gradient" Rule
Floating elements (language switchers, sticky headers) should utilize **Glassmorphism**. 
- Apply `surface` at 80% opacity with a `24px` backdrop-blur.
- Use subtle linear gradients for primary buttons (transitioning from `primary` to `primary_container`) to provide a "lit-from-within" glow that flat colors cannot replicate.

---

## 3. Typography

The typographic system is a bilingual dialogue. It pairs the high-contrast elegance of Serif headings with the clinical precision of Geometric Sans-Serif body text.

### Headings (Arabic & English)
- **English:** `Noto Serif`. High-contrast, classic, and authoritative.
- **Arabic:** `Noto Serif Arabic` or `Cairo`. These scripts provide the necessary "weight" to balance the English Serif, ensuring neither language feels like an afterthought.
- **Intent:** `display-lg` and `headline-lg` should be used with tight letter-spacing for English and generous leading for Arabic to allow calligraphic flourishes to breathe.

### Body & Labels
- **English:** `Manrope`. A modern, versatile sans-serif that ensures readability at small scales.
- **Arabic:** `Almarai` or `IBM Plex Sans Arabic`. These fonts provide a "native" feel that is professional and highly legible for product descriptions and ingredients.

---

## 4. Elevation & Depth

We move away from the "shadow-heavy" web of the past toward **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by stacking surface tiers. A product card (`surface_container_lowest`) sits atop a category section (`surface_container_low`), creating a soft, natural lift.
- **Ambient Shadows:** Shadows are reserved for high-interaction floating components (e.g., a "Quick Add" drawer). Shadows must be tinted with the `on_surface` color, using a blur of `32px` or higher at `6%` opacity to mimic natural, diffuse light.
- **The "Ghost Border" Fallback:** For accessibility in form fields, use the `outline_variant` at **15% opacity**. A 100% opaque border is considered a design failure in this system.

---

## 5. Components

### Premium Product Cards
- **Structure:** No borders. Use `surface_container_lowest` for the card background.
- **Imagery:** Product photography should have soft, natural shadows.
- **Interaction:** On hover, the card should transition to a slightly deeper `surface_container_high` rather than popping up with a shadow.

### Bilingual Language Switcher
- **Styling:** A glassmorphic pill located in the top-right (LTR) or top-left (RTL).
- **Typography:** Uses `label-md` in `Manrope` for EN and `Almarai` for AR.
- **Logic:** Switching the language must mirror the entire layout—all icons, text alignments, and flow directions must flip instantly.

### Buttons
- **Primary:** `ROUND_EIGHT` (0.5rem) corners. Uses the signature gradient from `primary` to `primary_container`. Text is `on_primary`.
- **Secondary:** Transparent background with a `Ghost Border`. Use for "Learn More" or secondary actions.
- **Tertiary:** No background or border. Underlined on hover using a `2px` stroke of the `primary_fixed` color.

### Refined Navigation
- **Top Bar:** Fixed, using backdrop-blur and `surface` at 90% opacity. 
- **Active State:** Indicated by a subtle `primary` colored dot below the menu item rather than a bold highlight.

---

## 6. Do's and Don'ts

### Do
- **DO** use RTL (Right-to-Left) as the default layout logic. Ensure that "Back" arrows point right (→) in Arabic and left (←) in English.
- **DO** lean into "Warm Stone" and "Cream" tones for 90% of the UI to ensure the skincare products are the hero.
- **DO** use `ROUND_EIGHT` (0.5rem) as the standard radius for a soft, feminine, yet structured feel.

### Don't
- **DON'T** use black (`#000000`). Use `on_background` (`#201b15`) for a softer, premium dark tone.
- **DON'T** use traditional dividers (`<hr>`). Use spacing or subtle color shifts to separate sections.
- **DON'T** overcrowd the product grid. Allow at least `48px` of margin between product cards to maintain the "Editorial" look.
- **DON'T** use high-contrast shadows. If you can see the edge of the shadow, it is too dark.

---

## 7. Spacing Scale
The spacing follows a strict 8px base but encourages "The Luxury Gap"—increasing whitespace by 1.5x in hero areas to convey exclusivity.

- **Section Gap:** `96px` (Desktop) / `64px` (Mobile)
- **Component Gap:** `24px`
- **Text-to-Image Gap:** `40px`