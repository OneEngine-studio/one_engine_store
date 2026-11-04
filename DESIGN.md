# OneEngine Store — Design System & Specification

> **Enforcement rule:** Every visual and interaction decision in OneEngine must trace back to the tokens, hierarchy, and anti-AI rules defined here. This document supersedes all legacy 6px radius constraints with a strict radius and depth hierarchy.

---

## 1. Principles

**Soft, premium, hand-crafted, calm depth.**

1. **Floating surfaces & calm depth:** The window background sits as the deepest layer (`#0C0A08`). The primary content lives inside an inset, floating panel (`#15120F`) with generous 24px rounded corners and a 1px specular inner border (`rgba(255,255,255,0.06)`).
2. **Radius hierarchy over monotony:** Never apply one universal radius. Outer containers dictate inner container radii (`R_inner = R_outer - padding`).
3. **Restrained color & functional ambient tint:** Warm charcoal base. Orange brand accent (`#FF7A00`) reserved exclusively for primary actions, active state indicators, and focus rings. Dynamic ambient tinting (8–14% opacity radial gradient) extracts key colors from active game artwork to provide subtle atmosphere.
4. **Sentence case & human copy:** All headings, labels, tags, and settings use natural sentence case. Game titles are shown as published—never forced into uppercase blocks.

---

## 2. Design Tokens

Configured in `tailwind.config.js` and `src/index.css`.

### Radius Scale

| Context | Radius | Class / Token |
|---|---|---|
| Main content panel, modals, dialog sheets | 24px | `rounded-panel` (`rounded-[24px]`) |
| Cards, quick tiles, sticky purchase panel, settings groups | 16px | `rounded-card` (`rounded-[16px]`) |
| Artwork thumbnails, list rows, inputs, status badges | 10–12px | `rounded-thumb` (`rounded-[10px]` / `rounded-xl`) |
| Buttons, chips, tags, search bar, segmented tab bars, sidebar active pill, avatar | Full Pill (9999px) | `rounded-full` |

### Surfaces & Depth Hierarchy

| Layer | Token / Hex | Usage |
|---|---|---|
| Window Base (darkest) | `bg-app` (`#0C0A08`) | Shell window background visible around inset panel |
| Floating Main Panel | `bg-panel` (`#15120F`) | Inset floating surface with 24px radius and 1px inner border |
| Card & Tile Layer | `bg-card` (`#1D1914`) | Flat content cards, separated by tone rather than harsh borders |
| Card Elevated / Hover | `bg-card-hover` (`#262019`) | Hover state for interactive cards and list rows |
| Generic Hover Surface | `bg-hover` (`rgba(255,255,255,0.06)`) | Button hover, icon hover, subtle list hover |
| Pressed / Active Surface | `bg-pressed` (`rgba(255,255,255,0.10)`) | Active button press, selected segmented tab |
| Modal Scrim | `bg-overlay` (`rgba(0,0,0,0.72)`) | Backdrop overlay paired with `backdrop-blur-md` |

### Borders (1px Specular Edge)

| Token | Value | Usage |
|---|---|---|
| `border-subtle` | `rgba(255,255,255,0.06)` | Floating panel inner border, card borders, dividers |
| `border-default` | `rgba(255,255,255,0.10)` | Interactive inputs, segmented controls, pill borders |
| `border-strong` | `rgba(255,255,255,0.18)` | Active card hover borders, focused panels |
| `border-focus` | `#FF7A00` | Keyboard focus ring with offset |

### Typography

- **Font family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Display face:** Bricolage Grotesque Variable (self-hosted via `@fontsource-variable/bricolage-grotesque`), extrabold, used for page headings, shelf titles and cartridge labels via `font-display`.
- **Features:** `font-feature-settings: "cv11", "ss01"`
- **Numbers:** `tabular-nums` on all prices, file sizes, download speeds, percentages, and timestamps.
- **Casing:** Sentence case everywhere. Never uppercase for game titles or section headers.

| Role | Size / Line Height | Weight | Usage |
|---|---|---|---|
| Page Heading | 32–40px / 1.15 | 700 (Bold, tight tracking) | "Good evening, Alex", Game title |
| Section Heading | 20–22px / 1.25 | 600 (Semibold) | "Jump back in", "Recommended", "System requirements" |
| Subheading / Group | 15–16px / 1.4 | 600 (Semibold) | Settings group titles, modal headers, card titles |
| Body Copy | 14px / 1.5 | 400 (Regular) | General descriptions, setting explanations |
| Metadata & Subtitles | 12–13px / 1.4 | 400 or 500 | Review counts, tags, speeds, timestamps |
| Article Reader Body | 16px / 1.6 | 400 (Max 68ch width) | News and patch notes modal |

### Shadows & Elevation

Shadows are applied strictly to floating layers, never to flat in-panel cards:
- **Floating Panel:** `shadow-[0_20px_50px_rgba(0,0,0,0.6)]`
- **Bottom Dock:** `shadow-[0_16px_40px_rgba(0,0,0,0.75)]`
- **Modals & Overlays:** `shadow-[0_24px_60px_rgba(0,0,0,0.85)]`
- **Cards:** Flat, tonally separated with specular top edge `border-t-white/10`.

---

## 3. Shell Architecture

1. **Left Navigation Rail (~76px):**
   - Brand logo at top (OneEngine icon, single occurrence).
   - Core nav items: Store, Library, Downloads, Community.
   - Active state: filled pill (`bg-white/10 text-primary` or `bg-accent text-bg-app` on active pill).
   - Owned library games: 40px rounded art thumbnails with hover tooltips and status dots (green = installed, amber = updating). Fixes truncated names and broken fallbacks.
   - Bottom rail: Settings icon and user profile avatar with presence indicator.
2. **Title Bar (Window Frame):**
   - History navigation: clean Back / Forward chevron buttons (Esc shortcut registered globally).
   - Pill search bar: `Ctrl K` shortcut chip, opens quick navigation Command Palette.
   - Wallet pill: live balance (`$124.50`).
   - Notification bell with unread badge.
   - User profile avatar dropdown menu.
   - Window controls: minimize, maximize, close.
3. **Main Floating Panel:**
   - Inset 12px from window perimeter, 24px radius (`rounded-panel`), internal overlay scrollbar.
   - Dynamic ambient color tint extracted from game artwork via canvas color quantization and cached in memory.
   - Scroll position preserved across route transitions.
4. **Persistent Floating Bottom Dock:**
   - Automatically surfaces only when a game is running or a download is transferring; cleanly hides when idle.
   - Displays artwork thumbnail, title, progress bar, download speed or session duration, and play/pause/stop actions.

---

## 4. Screen Specifications

### Store Home
- Friendly greeting based on local time ("Good morning / evening, <name>").
- Rounded quick-access tiles (Library, Downloads, Wishlist) with counts and iconography.
- "Jump back in" recent games grid with last-played recency.
- Featured & recommended rows with large-art rounded cards (`aspect-[16/10]`).
- "New updates" patch dispatch cards with release dates.

### Game Detail
- Two-column responsive layout:
  - **Left column:** Fixed 16:9 media player with thumbnails directly beneath, video play overlay, keyboard navigation (left/right arrows), and robust image error fallback.
  - **Right column (sticky 360–380px):** Game title in title case (max 2 lines), bold rating ("96% positive") with review count on its own secondary line, clean key/value facts list, tag pills, and single primary CTA ("Buy $X", "Install", "Play", "Updating 42%").
- Segmented pill tabs (Overview, System requirements, Add-ons, Patch notes).
- Add-ons displayed as 16px rounded rows with price and owned status.

### Library
- Responsive artwork grid with size toggles (compact, standard, hero).
- Pill filter tabs (All, Installed, Favorites) and sort dropdown.
- Card state badges for installed, updating, and update-needed games.

### Downloads
- Calm idle state: no empty charts or overlaid "0.0 MB/s" clutter.
- Live SVG download speed curve displayed only during active transfers.
- Rounded segmented storage bar showing Games, Other, and Free storage with legend.
- Clean language eliminating tactical jargon.

### Settings
- Grouped into 16px rounded cards with sentence-case headers.
- High-contrast toggle switches.
- Accurate runtime detection (`Electron / Chromium`).
- Version number located in Settings > About.
- "Reset to defaults" action with confirmation protection.

### Modals
- 24px radius, `bg-overlay` with `backdrop-blur-md`, 160ms scale/fade entry animation.
- Escape key and backdrop click to dismiss; trap focus inside modal.
- Article Reader: 16px typography, 1.6 line-height, max 68ch reading line width, sticky footer actions.
- Switch Account: clean user-facing dialogue with no dev/test artifacts.

---

## 5. Anti-AI Rulebook (Enforced)

- ❌ **No ALL-CAPS tracked labels:** No `TRACKING-WIDEST UPPERCASE` labels on cards, headings, or metadata.
- ❌ **No monospace for ordinary copy:** Monospace is reserved exclusively for raw technical telemetry or code.
- ❌ **No decorative gradient washes:** Ambient tint is functional and artwork-derived only.
- ❌ **No decorative micro-tags:** No tiny tags hovering above every section heading; no icons preceding every header.
- ❌ **No single highlighted words:** No gradient text or single colored words inside headings.
- ❌ **No middle-dot meta clutter:** Do not chain strings with `·` when clean hierarchy or whitespace suffices.
- ❌ **No "->" arrows in button copy:** Buttons read "Install", "Play", "View all", not "Install ->".
- ❌ **No uniform 6px radius:** Use the strict radius scale (24px / 16px / 10px / pill).
- ❌ **No animation on every card:** Motion is reserved for user interactions (clicks, expansions, confirmations).
- ❌ **No tactical/operator jargon:** UI copy is clear, direct, and conversational.

---

## 6. Verification & Build Criteria

- Build: `npm run build` exits with code 0 and 0 TypeScript / CSS errors.
- Visual review across viewports: `1000x640` (minimum window), `1280x720` (standard), `1920x1080` (expanded).
- No clipped text or broken layout at minimum dimensions.
- Contrast ratio ≥ 4.5:1 for all text elements against their container surface.

---

## 3. Workshop theme

The store is a workshop: games are physical cartridges standing on shelves.

- **Cartridge** (`components/ui/Cartridge.tsx`): per-game plastic colour derived from the game id (Railbound is forced to engine orange), cream sticker label with cover art, brass connector pins, status light (orange installed, green running, grey not installed). Tilts toward the cursor; the Insert & play / Eject / Install lever appears on hover or keyboard focus.
- **Shelf** (`components/ui/Shelf.tsx`): lays items in rows measured from the container width, each row on a wooden plank.
- **Gauge** (`components/ui/Gauge.tsx`): dial for library, downloads and wishlist state.
- **Palette additions:** `cream` (#F2E8D5) for headings and labels, `brass` (#C9A24B) for hardware details; Tailwind `slate` is remapped to warm `stone`.
- **Rules:** no eyebrow labels above headings; no zero-offset glow halos; every cartridge has a real focusable button named "Open <title>".
