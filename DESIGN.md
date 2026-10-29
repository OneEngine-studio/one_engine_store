# OneEngine Store — Design System

> **Enforcement rule:** Every visual decision in this app must trace back to a token or rule defined here. A PR that adds a raw hex, an arbitrary px value, a non-grid spacing step, or violates any Anti-AI rule without a documented amendment is rejected at review.

---

## 1. Principles

**Calm, dense, fast, quiet.**

- Hierarchy comes from surface depth, spacing, and type weight — never from color noise or decorative effects.
- One accent color. Used sparingly: primary action buttons, active-state indicators, and progress fills only.
- Depth is expressed as a surface step + 1px border. Not shadows, not gradients, not glows.
- Every element serves a function. No illustrations, no blobs, no sparkles, no "magic UI" effects.

---

## 2. Tokens

Single source of truth. All values are mirrored in `tailwind.config.js` and `src/index.css` as CSS custom properties.

### Surfaces (flat obsidian layering — no gradients)

| Token | Value | Usage |
|---|---|---|
| `bg-app` | `#090B0E` | Root background |
| `bg-sidebar` | `#0E1217` | Sidebar, modals, command palette |
| `bg-card` | `#141921` | Cards, section panels |
| `bg-hover` | `#1C232E` | Hover state background |
| `bg-pressed` | `#232B38` | Active/pressed state |
| `bg-overlay` | `rgba(0,0,0,0.70)` | Modal scrim + `backdrop-blur-md` |

### Borders (1px only)

| Token | Value | Usage |
|---|---|---|
| `border-subtle` | `rgba(255,255,255,0.05)` | Dividers, card outlines |
| `border-default` | `rgba(255,255,255,0.10)` | Default interactive borders |
| `border-strong` | `rgba(255,255,255,0.20)` | Focus-adjacent, elevated |
| `border-focus` | accent color | Focus rings |

### Text

| Token | Value | Contrast on `bg-card` |
|---|---|---|
| `text-primary` | `#F8FAFC` | 16.9:1 ✅ |
| `text-secondary` | `#94A3B8` | 7.4:1 ✅ |
| `text-tertiary` | `#64748B` | 4.0:1 ⚠️ (acceptable at 13px+, fails at 12px — use `#6B7C93` for 12px body) |
| `text-disabled` | `#94A3B8` at 40% opacity | — |

> **Note on tertiary contrast:** `#64748B` on `#141921` yields ~3.9:1, which fails WCAG AA for 12px regular text. It passes for 13px+ or 12px/600 (large text threshold equivalent). All 12px/400 tertiary text uses `#6B7C93` instead. Amended token: `text-tertiary-safe: #6B7C93` (4.6:1 on bg-card).

### Accent

| Token | Value | Usage |
|---|---|---|
| `accent` | `#FF7A00` | Primary buttons, active bars, progress |
| `accent-muted` | `rgba(255,122,0,0.12)` | Selected item backgrounds |
| `accent-hover` | `#E66E00` | Button hover state |

**No other brand colors.** `#00E5FF` (cyan), `#581c87` (purple) are removed entirely.

### Semantic colors (status only — never decorative)

| Token | Value | Usage |
|---|---|---|
| `success` | `#10B981` | Running, installed, verified states |
| `warning` | `#F59E0B` | Launching, pending states |
| `danger` | `#E53935` | Destructive actions, error states |

### Radius

| Context | Value | Tailwind class |
|---|---|---|
| Cards, buttons, inputs, popovers | 6px | `rounded-md` |
| Modals | 10px | `rounded-[10px]` |
| Avatars, toggles, status dots | 9999px | `rounded-full` |

**Nothing else.** `rounded-xl`, `rounded-2xl`, `rounded-3xl` are banned.

### Spacing

**4px base, 8px rhythm.** Allowed Tailwind scale values: `1 (4px)`, `2 (8px)`, `3 (12px)`, `4 (16px)`, `6 (24px)`, `8 (32px)`.

`p-5`, `gap-5`, `mt-7`, `space-y-5`, arbitrary `[13px]`, `[11px]` are banned. Exception: `p-3.5` (14px) and `px-3.5/py-1.5` for compact button padding — approved as the only half-step.

### Elevation

No colored glows. No `blur-[140px]` ambient blobs.

| Token | Value | Usage |
|---|---|---|
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.35)` | Cards, elevated surfaces |
| `shadow-overlay` | `0 16px 40px rgba(0,0,0,0.65)` | Modals, command palette |

Depth is expressed as: surface background step up + 1px `border-white/10` top specular edge.

### Motion

| Context | Timing | Properties |
|---|---|---|
| Hover, press | `duration-150 ease-out` | `transform`, `background-color`, `opacity` |
| Modals, popovers | `duration-200 ease-out` | `transform`, `opacity` |

- **Never `transition-all`** — always `transition-[transform,background-color]` or `transition-[opacity,transform]`.
- **Never animate `width`, `height`, `border`, or layout properties.**
- `prefers-reduced-motion`: disable `translate` and `scale`, keep `opacity` transitions only.

---

## 3. Typography

**Font:** Inter throughout.

```css
font-feature-settings: "cv11", "ss01";
```

`tabular-nums` on all prices, playtimes, counts, versions, and timestamps.

| Role | Size / Weight | Color | Class pattern |
|---|---|---|---|
| Card title | 15px / 500 | text-primary | `text-[15px] font-medium` |
| Body copy | 14px / 400 | text-primary or secondary | `text-sm` |
| Metadata, subtitles | 12–13px / 400 | text-tertiary | `text-xs` or `text-[13px]` |
| Nav label | 14px / 500, sentence-case | secondary → primary when active | `text-sm font-medium` |
| Section label | 11px / 600, tracking `0.06em`, UPPERCASE | text-tertiary | `text-[11px] font-semibold tracking-[0.06em] uppercase` |

**Monospace is for code and file paths only.** Never for nav labels, badges, metadata, descriptions, or branding.

---

## 4. Anti-AI Rulebook

Each rule has a grep-able signature.

### Rule 1 — No glow effects
**Don't:** `shadow-orange-500/20`, `blur-[140px]`, radial gradient spotlight effects, `BorderBeam`, conic gradients on borders.  
**Do:** `shadow-card` (black only, low spread). Depth via surface + border only.  
**Grep:** `shadow-orange|shadow-cyan|shadow-purple|blur-\[\d+px\]|border-beam|conic-gradient`

### Rule 2 — Max 1 badge per card
**Don't:** Status badge on thumbnail + price badge overlay + "Owned" text all at once.  
**Do:** One badge, top-left of thumbnail. Price/status in the metadata row below the thumbnail.  
**Grep:** `top-3.*right-3.*z-20` combined with `top-3.*left-3.*z-20` on same card

### Rule 3 — Sentence-case Inter everywhere
**Don't:** `font-mono uppercase tracking-widest` on labels, nav, descriptions, user rank.  
**Do:** `font-sans` for all UI text. Uppercase only for section labels (11px/600).  
**Grep:** `font-mono.*uppercase|uppercase.*font-mono|tracking-widest.*font-mono`

### Rule 4 — Thumbnail vignette standard
**Do:** `bg-gradient-to-t from-black/40 to-transparent` + `ring-1 ring-inset ring-white/5`. Reserve aspect ratio with `aspect-[16/10]` or `aspect-video`.  
**Don't:** Multiple stacked gradient overlays with specific hex colors (`from-[#131722]`).

### Rule 5 — Strict 4/8 grid and one radius
**Don't:** `p-5`, `gap-5`, `mt-7`, arbitrary `[13px]`, `rounded-xl`, `rounded-2xl`.  
**Do:** Spacing from the allowed scale. `rounded-md` (6px) for everything except modals and avatars.  
**Grep:** `\bp-5\b|\bgap-5\b|\bmt-7\b|rounded-xl|rounded-2xl|rounded-3xl`

### Rule 6 — One icon family, one stroke width
**Do:** Lucide icons only, `strokeWidth={1.5}`, sizes 16px (`w-4 h-4`) or 20px (`w-5 h-5`).  
**Don't:** Emoji as UI icons, mixed stroke widths, size-12 or size-24 icons.

### Rule 7 — No decorative effects
**Don't:** Floating blur blobs, `SpotlightCard` mouse-tracking radial glow, `BorderBeam`, centered hero layouts with sparkles.  
**Do:** Plain surfaces. Let the content speak.  
**Grep:** `rounded-full blur-\[|radial-gradient.*var\(--mouse|border-beam|Sparkles`

### Rule 8 — Copy discipline
**Don't:** Exclamation marks, "Welcome back, gamer!", filler labels, tactical/operator jargon in UI copy.  
**Do:** Short, literal labels. "Store", "Library", "Downloads", "Play", "Install", "Sign in".

### Rule 9 — One primary button per view
**Do:** One solid accent button (primary CTA). Secondary actions: ghost (`border border-white/10 bg-transparent`) or subtle (`bg-hover border-subtle`). Destructive: `danger` token explicitly.  
**Don't:** Multiple filled accent buttons in one view.

### Rule 10 — Empty states
**Do:** One line of context + one action button. Nothing else.  
**Don't:** Illustrations, centered hero layouts, multiple CTAs, decorative icons.

---

## 5. Component Specs

### Button

**Anatomy:** `[icon?] label`  
**Base:** `inline-flex items-center gap-2 rounded-md text-sm font-medium transition-[background-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app disabled:opacity-40 disabled:pointer-events-none cursor-default select-none`

| Variant | Default | Hover | Pressed | Disabled |
|---|---|---|---|---|
| Primary | `bg-accent text-bg-app px-4 py-2` | `bg-accent-hover` | `active:scale-[0.98]` | `opacity-40` |
| Secondary | `bg-bg-hover border border-subtle text-secondary px-4 py-2` | `bg-pressed border-default text-primary` | `active:scale-[0.98]` | `opacity-40` |
| Ghost | `bg-transparent border border-subtle text-secondary px-4 py-2` | `bg-bg-hover text-primary` | `active:scale-[0.98]` | `opacity-40` |
| Danger | `bg-danger/15 border border-danger/40 text-danger px-4 py-2` | `bg-danger/25` | `active:scale-[0.98]` | `opacity-40` |
| Icon-only | `w-8 h-8 flex items-center justify-center rounded-md` | same variant pattern | same | same |

### Card

**Anatomy:** `[thumbnail] [content area]`  
**Base:** `bg-bg-card rounded-md border border-subtle border-t-[rgba(255,255,255,0.10)] overflow-hidden shadow-card`  
**Hover:** `hover:-translate-y-px hover:bg-bg-hover transition-[transform,background-color] duration-150 ease-out`  
**Pressed:** `active:translate-y-0 active:scale-[0.99]`  
**Selected:** `border-accent/60 bg-accent-muted ring-1 ring-accent/30`

### Badge

**Anatomy:** inline `span`  
**Base:** `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium`  
**Variants:** status-success, status-warning, status-danger, neutral (bg-hover + border-subtle)  
**Rule:** Max 1 per card. Never on thumbnail overlay if already in metadata row.

### NavItem

**Anatomy:** `[2px accent bar] [icon] [label] [badge?]`  
**Base:** `relative w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-secondary transition-[background-color,color] duration-150 ease-out cursor-default`  
**Active:** `text-primary bg-accent-muted` + `::before { position:absolute; left:0; top:2px; bottom:2px; width:2px; background:accent; border-radius:1px }`  
**Hover:** `text-primary bg-bg-hover`  
**Badge:** small `rounded-full` number pill (accent bg, bg-app text), right-aligned

### Modal

**Structure:** Scrim → Panel (header / body / footer)  
**Scrim:** `fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center`  
**Panel:** `bg-bg-sidebar border border-default border-t-[rgba(255,255,255,0.15)] rounded-[10px] shadow-overlay p-6 w-full max-w-lg`  
**Entry animation:** `opacity-0 translate-y-1 → opacity-100 translate-y-0` over `200ms ease-out`  
**Footer:** right-aligned actions. Primary button last (rightmost).  
**Keyboard:** Trap focus, close on Esc, restore focus on close.

### Input / Select

**Base:** `bg-bg-app border border-subtle rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors duration-150`  
**Readonly:** `opacity-60 cursor-not-allowed`

### Tooltip / Popover

**Base:** `bg-bg-hover border border-default rounded-md shadow-overlay text-xs text-secondary p-2`  
**Animation:** `opacity-0 scale-95 → opacity-100 scale-100` over `150ms ease-out`

### Skeleton

Match final layout exactly. Use `bg-bg-hover animate-pulse rounded-md`. No width/height mismatches.

---

## 6. Electron Desktop Rules

- **Titlebar:** 40px high. `data-tauri-drag-region` / `style={{ WebkitAppRegion: 'drag' }}` on the header. Every interactive child: `style={{ WebkitAppRegion: 'no-drag' }}`.
- **Text selection:** `select-none` on the root. Re-enable on descriptions, paths, and inputs only: `select-text`.
- **Cursor:** `cursor-default` on buttons, cards, nav items. `cursor-text` on inputs. No `cursor-pointer` except on genuine hyperlinks.
- **Scrollbars:** 6px wide, transparent track, `rgba(255,255,255,0.12)` thumb, `rgba(255,255,255,0.24)` on hover. Already set globally.
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app`. Every interactive element. Full keyboard nav.
- **Minimum window size:** Sidebar fixed-width (`w-56`), content reflows, nothing clips below `minWidth: 900px`.

---

## 7. Definition of Done

Use this as a PR checklist before merging any visual change.

- [ ] `npm run build` exits with 0 TypeScript errors, 0 CSS errors, 0 new warnings
- [ ] Grep audit: all R1–R10 violation counts are 0 (or each remainder documented)
- [ ] No raw hex outside `tailwind.config.js`. No arbitrary `[px]` values in components.
- [ ] Contrast check: text-tertiary on each surface reports ≥ 4.5:1 for 13px+ text
- [ ] App launches; every screen reviewed at default (1200×800) and minimum (900×600) window size
- [ ] `git diff --stat` shows changes only in `src/`, `tailwind.config.js`, `index.css`, `DESIGN.md`
- [ ] No logic, IPC handlers, public props, or routing changed

---

*Last amended: 2026-10-29 — initial encoding*
