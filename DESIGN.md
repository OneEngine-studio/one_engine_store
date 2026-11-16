# OneEngine Store — Design System & Specification

> **Enforcement rule:** Every visual and interaction decision in OneEngine must trace back to the tokens, hierarchy, and anti-AI rules defined here. This document supersedes all legacy 6px radius constraints with a strict radius and depth hierarchy.

---

## 1. Principles

**Maroon and red on black, rounded, warm, modern.**

1. **Floating surfaces & calm depth:** The window background sits as the deepest layer (`#0B0405`). The primary content lives inside an inset, floating panel (`#24100F`) with generous 24px rounded corners and a 1px specular inner border (`rgba(255,255,255,0.06)`).
2. **Radius hierarchy over monotony:** Never apply one universal radius. Outer containers dictate inner container radii (`R_inner = R_outer - padding`).
3. **Restrained color & functional ambient tint:** Brand palette: white `#FFFFFF`, red `#BB3B3B`, maroon `#361518`, black `#000000`. Red is the accent for primary actions, the active nav item, selected chips, progress and stat rings; it carries a soft red glow (`shadow-glow`). Cards are maroon on a darker panel. Status colours stay functional (green online/running, amber warning). The ambient glow behind the panel is a soft red wash.
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
| Window Base (darkest) | `bg-app` (`#0B0405`) | Shell window background visible around inset panel |
| Floating Main Panel | `bg-panel` (`#24100F`) | Inset floating surface with 24px radius and 1px inner border |
| Card & Tile Layer | `bg-card` (`#361518`) | Flat content cards, separated by tone rather than harsh borders |
| Card Elevated / Hover | `tech-elevated` (`#45201F`) | Hover state for interactive cards and list rows |
| Generic Hover Surface | `bg-hover` (`rgba(255,255,255,0.06)`) | Button hover, icon hover, subtle list hover |
| Pressed / Active Surface | `bg-pressed` (`rgba(255,255,255,0.10)`) | Active button press, selected segmented tab |
| Modal Scrim | `bg-overlay` (`rgba(0,0,0,0.72)`) | Backdrop overlay paired with `backdrop-blur-md` |

### Borders (1px Specular Edge)

| Token | Value | Usage |
|---|---|---|
| `border-subtle` | `rgba(255,255,255,0.06)` | Floating panel inner border, card borders, dividers |
| `border-default` | `rgba(255,255,255,0.10)` | Interactive inputs, segmented controls, pill borders |
| `border-strong` | `rgba(255,255,255,0.18)` | Active card hover borders, focused panels |
| `border-focus` | `rgba(255,255,255,0.9)` | Keyboard focus ring with offset |

### Typography

- **Font family:** Poppins (self-hosted via `@fontsource/poppins`, weights 400/500/600/700), falling back to Segoe UI.
- **Display face:** chunky rounded `font-display` for page headings, game titles, section heads and big numbers: Grobold if it is installed (licence needed for commercial use, not bundled), otherwise Titan One (SIL Open Font Licence, self-hosted via `@fontsource/titan-one`). One weight only, `font-synthesis: none` so it is never faux-bolded.
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

## 7. Maroon system

- **Palette:** `bg-app` #0B0405, `bg-sidebar` #1A0A0B, `bg-panel` #24100F, `bg-dock` #2A1113, `bg-card` #361518, elevated #45201F. Text ramp `slate` is rose-tinted grey (300 #DEC6C7, 400 #C7A7A8, 500 #A98586, all at least 4.5:1 on cards); `cream` is white. Accent `#BB3B3B` (hover `#A53232`) with white text.
- **Radii:** panel 32px, modal 28px, card 22px, tile 20px, buttons and chips full pills, nav items 14px squares.
- **Navigation rail:** dark maroon pill-shaped rail; the active item is a red rounded square with a white icon and a red glow that slides between items.
- **Store:** spotlight banner (cover art fading into maroon, white "Popular" chip, title, description, red "View game" button, tag chips; a 3D icon on lit maroon when there is no art) beside a "Your stats" card (red ring around total play time, empty at zero, three red icon buttons). Below, the **Categories** row (`CategoryCarousel`: the chosen category is the wide card and filters the games; arrow keys move between cards) and **New games** (`FocusCarousel`: the focused game is the wide card; the strip only moves when the player asks). Skeleton rows stand in while the catalog loads.
- **Game page:** full-width hero (key art with a dark left and top scrim, or a 3D icon on lit maroon), title in the display face at 56px, tag chips, then "About this game" and a "Details" grid. The price card floats up over the hero on wide windows.
- **3D icons** (`components/ui/Icon3D.tsx`): glossy SVG rocket, target, puzzle, gear, avatar, controller, trophy and bolt in reds, maroons and white only. Used for categories, empty states and art fallbacks; never in bright off-brand colours.
- **Empty states** (`ComingSoon`): lit maroon card, 3D icon, display-face title, one sentence and at most one action. A screen with nothing to show gets exactly one of these, not empty widgets.
- **Game card** (`components/ui/Cartridge.tsx`): 4:5 cover on a maroon card fading to maroon at the bottom, red border glow on hover, red Play / Install pill rising in on hover or focus, red progress bar.
- **Motion:** one easing, `cubic-bezier(0.23, 1, 0.32, 1)`. The first screen of a session rises in block by block; later tab switches only fade (140ms) because they happen constantly. The command palette opens with no animation (keyboard). Cards ease in 30ms apart, the nav indicator slides over 320ms, the stat ring fills over 900ms, press feedback `scale(0.97)`. Off under `prefers-reduced-motion`.
- **Type floor:** nothing smaller than 12px except keyboard-shortcut caps and the calendar grid.
- **Toasts:** bottom-right maroon cards (`#1A0A0B`, 16px radius) with a status-coloured edge and icon; announced politely to screen readers.
- **Crash screen:** lit maroon card with a 3D bolt, one sentence, "Technical details" collapsed, and a single Reload button.
- **Loading:** `Skeleton` blocks with a soft light sweep, shaped like the content that is coming.
