# Alineados — Brand Manual

## 1. Brand Overview

**Name:** Alineados
**Meaning:** "Aligned" in Spanish — refers to staying politically aligned, informed, and coordinated within the provincial government.
**Tagline:** Inteligencia Política
**Product:** AI-powered political intelligence dashboard for provincial government officials.
**Primary audience:** Cabinet ministers and senior government staff of Corrientes Province, Argentina.

### Brand Personality

Alineados is a **serious, institutional tool** — not a consumer app. It should feel like opening a trusted, well-curated briefing document, not scrolling social media. Think of it as the digital equivalent of a leather-bound daily intelligence dossier.

**Brand attributes:**
- **Authoritative** — This is a tool for decision-makers. Every pixel communicates competence and reliability.
- **Efficient** — Respects the user's time above all. No decoration without purpose.
- **Discreet** — Political intelligence requires a sober, professional tone. Never flashy, never loud.
- **Trustworthy** — Information hierarchy is clear. Sources are always visible. Urgency is never exaggerated.

**Alineados is NOT:**
- Playful, casual, or startup-like
- Visually noisy or cluttered
- Generic SaaS dashboard aesthetic
- Social media-like or gamified

---

## 2. Logo

### Concept

The logomark represents **alignment** through a series of vertical bars of varying heights, unified by a single horizontal crossbar. The tallest center bar represents the Governor (the central figure everyone aligns to), while the surrounding bars represent cabinet ministers. The horizontal bar connects them — they are *alineados*.

The visual also subtly evokes a stylized letter **A**, data visualization bars (representing the analytical nature of the product), and the columns of a government building.

### Logo Components

- **Logomark:** The alignment bars icon, used in a rounded square container (dark navy background) for app contexts, or standalone for larger uses.
- **Wordmark:** "Alineados" set in Georgia Bold (serif), conveying institutional weight and editorial authority.
- **Tagline:** "INTELIGENCIA POLÍTICA" set in a clean sans-serif (DM Sans or Helvetica Neue), all caps, letterspaced, in a muted gray.

### Logo Versions

1. **Primary (Horizontal):** Logomark + Wordmark + Tagline — for headers, documents, and presentations.
2. **Icon Only:** Logomark in rounded square container — for favicon, app icon, sidebar collapsed state, and WhatsApp profile.
3. **Dark Background:** White wordmark with blue logomark on navy/dark backgrounds — for the sidebar and dark contexts.
4. **Light Background:** Navy wordmark with blue logomark on white/light backgrounds — for documents and light interfaces.

### Logo Clear Space

Maintain clear space equal to the width of the logomark icon on all sides. Never crowd the logo with other elements.

### Logo Don'ts

- Never change the color of individual bars
- Never rotate or skew the logo
- Never use the logo smaller than 24px height (icon) or 120px width (horizontal)
- Never place on busy photographic backgrounds
- Never add drop shadows or effects

---

## 3. Color System

### Primary Palette

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Navy** (Primary Dark) | `#0f172a` | `slate-900` | Sidebar, primary backgrounds, headings |
| **Deep Navy** | `#1e293b` | `slate-800` | Secondary dark surfaces, cards on dark |
| **Institutional Blue** | `#2563eb` | `blue-600` | Primary accent, CTAs, active states, logomark |
| **Steel Blue** | `#1e3a5f` | custom | Logo secondary, dark accent |
| **Light Blue** | `#3b82f6` | `blue-500` | Interactive elements, links, highlights |
| **Pale Blue** | `#dbeafe` | `blue-100` | Light accent backgrounds, selected states |

### Neutral Palette

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **White** | `#ffffff` | `white` | Cards, main content background |
| **Paper** | `#f8f9fb` | custom (near `slate-50`) | Page background |
| **Light Gray** | `#f1f5f9` | `slate-100` | Input backgrounds, dividers, chips |
| **Mid Gray** | `#94a3b8` | `slate-400` | Secondary text, timestamps, metadata |
| **Dark Gray** | `#475569` | `slate-600` | Body text, descriptions |
| **Near Black** | `#0f172a` | `slate-900` | Headlines, primary text |

### Semantic / Urgency Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Urgente (Red)** | `#ef4444` | `red-500` | Breaking news badge, urgent dot |
| **Urgente BG** | `#fef2f2` | `red-50` | Urgent item background tint |
| **Importante (Amber)** | `#f59e0b` | `amber-500` | Important dot |
| **Importante Badge BG** | `#fef3c7` | `amber-100` | Important badge background |
| **Importante Badge Text** | `#92400e` | `amber-800` | Important badge text |
| **Rutina (Green)** | `#34d399` | `emerald-400` | Routine dot, positive status |
| **Rutina BG** | `#ecfdf5` | `emerald-50` | Positive status background |

### Source Colors

Each news source has a unique identifying color used for small tags/badges:

| Source | Color | Usage |
|--------|-------|-------|
| El Litoral | `#1a6b3c` | Source badge text + tinted bg |
| Época | `#8b5e3c` | Source badge text + tinted bg |
| Diario El Libertador | `#2d5a9e` | Source badge text + tinted bg |
| Radio Sudamericana | `#c23b22` | Source badge text + tinted bg |
| Radio Dos | `#6b21a8` | Source badge text + tinted bg |
| Gobierno | `#1e3a5f` | Source badge text + tinted bg |

Source badges use the source color at ~8% opacity as background and the full color as text, with a border at ~18% opacity. This keeps them identifiable without being visually dominant.

### CSS Variables

```css
:root {
  --color-navy: #0f172a;
  --color-deep-navy: #1e293b;
  --color-institutional-blue: #2563eb;
  --color-steel-blue: #1e3a5f;
  --color-light-blue: #3b82f6;
  --color-pale-blue: #dbeafe;
  --color-paper: #f8f9fb;
  --color-urgente: #ef4444;
  --color-importante: #f59e0b;
  --color-rutina: #34d399;
}
```

### Color Rules

- **Dark sidebar, light content.** The sidebar is always navy/dark. The main content area is always light (paper/white). This creates a clear spatial hierarchy.
- **Blue is for action and emphasis only.** Don't overuse institutional blue. It should appear in the logo, active navigation states, primary buttons, and key interactive elements. Never use it as a large background fill in the content area.
- **Urgency colors are sacred.** Red means breaking/urgent. Amber means important. Green means routine/healthy. Never use these colors for decorative purposes.
- **Cards are always white.** Content cards sit on the paper background in white, with `slate-100` borders. Hover state adds subtle shadow and `slate-200` border.

---

## 4. Typography

### Font Stack

| Role | Font | Weight(s) | Usage |
|------|------|-----------|-------|
| **Display / Headlines** | Playfair Display | 600, 700, 800 | Page titles, section headers, hero text, the "Alineados" wordmark in-app |
| **Body / UI** | DM Sans | 400, 500, 600, 700 | Interface text, navigation, buttons, labels, metadata |
| **Editorial / Long-form** | Source Serif 4 | 400, 600 | Article summaries, briefing text, interview transcripts — any AI-generated or editorial content |
| **Data / Timestamps** | DM Sans (monospaced feel) or system monospace | 400 | Timestamps, data values, counts |

### Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Font | Size | Weight | Color | Letter Spacing |
|---------|------|------|--------|-------|---------------|
| Page Title | Playfair Display | 24px (text-2xl) | 700 | slate-900 | -0.025em |
| Section Header | Playfair Display | 18px (text-lg) | 700 | slate-800 | normal |
| Card Headline | DM Sans | 16px (text-base) | 600 | slate-800 | normal |
| Card Headline (feed) | DM Sans | 14px (text-sm) | 600 | slate-800 | normal |
| Body / Summary | Source Serif 4 | 14-16px | 400 | slate-500/600 | normal |
| Executive Summary | Source Serif 4 | 16px (text-base) | 400 | slate-300 (on dark) | normal |
| Navigation | DM Sans | 14px (text-sm) | 500 | slate-400 → white (active) | normal |
| Badge / Tag | DM Sans | 12px (text-xs) | 600-700 | varies | 0.025em (urgency: wider) |
| Timestamp | DM Sans | 12px (text-xs) | 400 | slate-400 | normal |
| Tagline / Overline | DM Sans | 13px | 500 | slate-400/500 | 0.15em, uppercase |

### Typography Rules

- **Playfair Display is reserved for hierarchy.** Only page titles and section headers. It creates the institutional, editorial weight. Never use it for body text, buttons, or metadata.
- **Source Serif 4 is for AI-generated and editorial content.** Summaries, briefing paragraphs, transcripts. The serif adds readability and a newspaper-like quality to longer text. It signals "this is content to read" vs. "this is interface to interact with."
- **DM Sans is for everything else.** Navigation, buttons, labels, badges, metadata. It's clean, readable, and has good weight variety.
- **Never mix serif fonts** in the same text block. A card either has a DM Sans headline + Source Serif body, or it's all DM Sans for short items.

---

## 5. Tone of Voice

### Content Tone

All text in Alineados — from AI-generated summaries to UI labels — follows these principles:

**Concise.** Every word earns its place. A 30-minute interview becomes 3-5 sentences. An article becomes 2-3 sentences. No filler, no repetition.

**Neutral and factual.** Summaries report what was said and by whom, without editorializing. "El gobernador anunció..." not "El gobernador sorprendió al anunciar..." The user forms their own political judgment.

**Action-oriented.** Summaries highlight what happened, what was decided, and what requires attention or response. Not background context the user already knows.

**Formally respectful.** Political figures are referred to by title and surname on first mention (e.g., "el gobernador Valdés"), then by surname. Never by first name alone in summaries.

### UI Copy Tone

- **Navigation:** Short, clear labels in Spanish. "Resumen del Día", not "Tu briefing diario."
- **Empty states:** Professional but helpful. "No hay noticias urgentes hoy" not "¡Todo tranquilo! 🎉"
- **Errors:** Direct and informative. "No se pudo actualizar. Última actualización: hace 2 horas." Not "¡Ups! Algo salió mal."
- **No emojis in body content.** Emojis are used sparingly and only in the WhatsApp digest (where they aid readability in that format) and as section icons in the sidebar/headers. Never in summaries, headlines, or formal content.

### WhatsApp Digest Tone

The WhatsApp daily digest is the one exception where the tone is slightly more compact and uses emojis as section markers for scannability:

```
📋 *ALINEADOS — 4 de Marzo 2026*

🔴 *URGENTE*
Nación define recorte a transferencias provinciales. Corrientes podría perder partidas de infraestructura educativa.

🏛 *GOBERNADOR*
• Valdés anunció $2.800M en rutas provinciales (acto en Goya)
• Reunión con 8 intendentes del sur por dengue y obras hídricas

⚖ *JUSTICIA Y DDHH*
• Digitalización: 12 juzgados del interior ya operan con sistema digital
• Nuevo protocolo de violencia de género presentado en Legislatura

👥 *GABINETE*
• Seguridad: 200 nuevos agentes (Goya, Curuzú, Mercedes)
• Salud: campaña vacunación dengue en 15 localidades

📢 *OPOSICIÓN*
• PJ pide informes sobre ejecución de obra pública

🎙 3 entrevistas procesadas — Ver más en app
```

---

## 6. Component Patterns

### Cards

- Background: white (`#ffffff`)
- Border: 1px `slate-100` (`#f1f5f9`)
- Border radius: 12px (`rounded-xl`)
- Padding: 20px (`p-5`)
- Hover: subtle shadow (`shadow-md`) + border `slate-200`
- Transition: `transition-all` for smooth hover effects

### Urgency System

Three levels, visually distinct:

1. **URGENTE (Breaking):** Red dot + red badge with white text ("URGENTE"). These items should be immediately visible. On the daily briefing, they appear at the top of the relevant section.

2. **IMPORTANTE:** Amber dot + amber badge on amber-100 background ("IMPORTANTE"). These are items the user should read today.

3. **RUTINA:** Green dot, no badge. Standard items for awareness. Summary text may be collapsed by default.

### Source Tags

Small inline badges identifying the news source:
- Text: source-specific color (see Source Colors)
- Background: source color at 8% opacity
- Border: source color at 18% opacity, 1px
- Font: DM Sans, 12px, font-weight 600
- Border radius: 4px (`rounded`)
- Padding: 2px 8px

### Sidebar Navigation

- Active state: `bg-white/10` background, white text
- Inactive: `slate-400` text, on hover `slate-200` text + `bg-white/5`
- Icons (emoji) at 16px equivalent, fixed 24px width for alignment
- Collapsible: icon-only mode at 72px width, expanded at 260px

### Buttons

- **Primary:** `bg-blue-600 text-white hover:bg-blue-700`, rounded-xl, px-4 py-2
- **Secondary:** `bg-slate-50 text-slate-600 hover:bg-slate-100`, rounded-lg, px-3 py-1.5
- **Ghost:** `text-blue-600 hover:text-blue-800 bg-blue-50`, rounded-lg — for inline actions like "Ver transcripción"

### Inputs

- Background: `slate-50`
- Border: 1px `slate-200`
- Border radius: 12px (`rounded-xl`)
- Focus: `ring-2 ring-blue-500/20 border-blue-400`
- Placeholder: `slate-400`

---

## 7. Layout Principles

### Spatial Hierarchy

1. **Sidebar** (fixed, left): Navigation and user identity. Dark navy. Always visible.
2. **Top bar** (sticky): Search and status indicators. White with blur backdrop.
3. **Content area** (scrollable): Max-width 4xl (~896px) with generous padding. Paper background.

### Information Density

This is a tool for busy people. Information density should be **high but organized:**

- Headlines are scannable without reading summaries
- Urgency and source are visible at a glance
- Summaries expand on demand (click/tap)
- Timestamps provide temporal context for every item
- Sections group related content so the user can skip irrelevant areas

### Responsive Behavior

- **Desktop (1024px+):** Full sidebar + content. This is the primary experience.
- **Tablet / iPad (768-1023px):** Collapsed sidebar (icon-only) + full content. iPad is a key device (the user's father uses one).
- **Mobile (< 768px):** Bottom navigation bar replacing sidebar. Simplified cards. This is secondary but should work.

### Spacing System

Use Tailwind's default spacing scale. Key values:
- Section gaps: `space-y-8` (32px)
- Card gaps: `space-y-3` (12px)
- Card internal padding: `p-5` (20px)
- Page padding: `px-8 py-8` (32px)

---

## 8. Iconography

### Approach

**Emoji-based for section and category identifiers.** This is a deliberate choice for a Spanish-language political tool — emoji are universally understood, don't need a design system to maintain, and render natively on all devices including iPad and WhatsApp.

| Section | Emoji |
|---------|-------|
| Resumen del Día | 📋 |
| Todas las Noticias | 📰 |
| El Gobernador | 🏛 |
| Justicia y DDHH | ⚖ |
| Gabinete | 👥 |
| Oposición | 📢 |
| Entrevistas | 🎙 |
| Nacional | 🇦🇷 |
| AI Resumen | 🤖 |
| Buscar | 🔍 |
| Notificaciones | 🔔 |

### UI Icons

For functional UI elements (arrows, chevrons, close, menu), use **Iconify** icons consistent with Andrea's other projects. Prefer the `heroicons` or `lucide` icon sets for clean, minimal strokes.

---

## 9. Dark Mode

**Not planned for MVP.** The sidebar is already dark, and the content area should remain light for readability of long-form text. A full dark mode can be considered post-MVP if requested, but the institutional tone is better served by the light content area with dark sidebar contrast.

---

## 10. File & Asset Reference

| Asset | Filename | Usage |
|-------|----------|-------|
| Logo (horizontal, light bg) | `logo-horizontal-light.svg` | Documents, light headers |
| Logo (horizontal, dark bg) | `logo-horizontal-dark.svg` | Sidebar, dark contexts |
| Logo (icon only, dark) | `logo-icon-dark.svg` | Favicon, app icon, collapsed sidebar |
| Logo (icon only, light) | `logo-icon-light.svg` | Light background contexts |
| Prototype reference | `alineados-dashboard-prototype.jsx` | React prototype of dashboard |
| Project plan | `alineados-project-plan.md` | Full technical plan |
| Brand manual | `alineados-brand-manual.md` | This document |
