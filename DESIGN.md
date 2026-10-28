# OneEngine Desktop — System Design Specification (`DESIGN.md`)

## 1. Surface Architecture & Palette

OneEngine Store uses a flat, layered obsidian-slate elevation system engineered specifically for native desktop density (Linear / Raycast / Steam Desktop caliber). No floating multi-colored ambient glows or arbitrary translucency.

| Layer | Hex Code | Token / Role | Tailwind Utility |
| :--- | :--- | :--- | :--- |
| **Canvas** | `#090B0E` | App background, window gutter, deep wells | `bg-void-black` |
| **Rail / Bar** | `#0E1217` | Persistent desktop sidebar, titlebar chrome | `bg-gunmetal-slate` |
| **Card Surface** | `#141921` | Base container for cards, panels, list rows | `bg-tech-surface` |
| **Elevated / Hover** | `#1C232E` | Hover state, dropdown popovers, active wells | `bg-tech-elevated` |
| **Border Stroke** | `#262F3D` | 1px boundary lines between surfaces | `border-border-stroke` |
| **Specular Edge** | `rgba(255,255,255,0.08)` | 1px top-edge light reflection | `border-t border-white/10` |
| **Inner Vignette** | `rgba(255,255,255,0.05)` | 1px inner border over thumbnails | `ring-1 ring-white/5` |
| **Brand Accent** | `#FF7A00` | Tactical primary accent (minimal, reserved) | `text-primary-accent`, `bg-primary-accent` |
| **Signal Teal** | `#00E5FF` | Secondary telemetry, metrics, downloads | `text-secondary-tech` |
| **Positive State** | `#10B981` | Installed, active execution, verified | `text-tactical-green` |

---

## 2. Anti-AI Rulebook (Impeccable & Hallmark Standards)

To eliminate "AI-generated / vibe-coded" visual traits, the client strictly enforces 5 core visual disciplines:

1. **No Glowing Neon Borders or Rainbow Gradients**
   - Eliminate heavy drop-shadows with saturated colors (`shadow-ember-glow`, `shadow-cyan-glow`).
   - Cards use physical top-edge specular highlights (`border-t border-white/10`) and flat surfaces.
2. **Maximum One Status Badge per Media Card**
   - No stacking 3 to 4 pill badges over thumbnails.
   - Restrict to at most one clean status badge (e.g., `-20%` or `In Library`) with high-contrast, compact styling.
3. **Sentence-Case Typography (Inter Primary)**
   - No wall-of-text all-caps monospace blocks.
   - Body descriptions, metadata, subtitles, and button labels use sentence-case `Inter` (12px–14px).
   - Uppercase is reserved strictly for primary section labels and category headers (`text-[11px] font-semibold tracking-wider text-slate-400 uppercase`).
4. **Crisp Media Thumbnails & Specular Highlights**
   - Media frames include a dark gradient vignette (`from-black/60 via-transparent to-transparent`) and a crisp `ring-1 ring-white/5` inner border.
   - Avoid washed-out placeholder image aesthetics.
5. **Strict Spatial Grid & Consistent 6px Corner Radius**
   - Standard 4px / 8px spacing rhythm (`gap-3`, `gap-4`, `p-4`, `p-6`).
   - Unified corner radius: `rounded-md` (`6px`) across all cards, buttons, badges, and modals. Disallow random polygon clips or inconsistent pill geometry.

---

## 3. Component System Specifications

### 3.1 Sidebar & Window Titlebar Rail
- **Sidebar**: 60px / 240px native desktop rail. Clean 14px sentence-case navigation items with muted default icons (`#64748B` / `#94A3B8`). Active item indicates selection via a clean `2px` left accent bar (`border-l-2 border-[#FF7A00]`) on `#141921` background—no heavy full-button orange gradients.
- **Titlebar**: 40px draggable OS frame (`#0E1217`) with crisp native window controls, subtle search trigger (`Cmd/Ctrl + K`), and compact user status pill.

### 3.2 Cards (Storefront & Library)
- **Geometry**: `rounded-md` (`6px`), `bg-[#141921]`, `border border-[#262F3D]`, `border-t border-white/10`.
- **Hover Micro-interaction**: `hover:-translate-y-0.5 hover:bg-[#1C232E] transition-all duration-150 ease-out`.
- **Thumbnail**: 16:9 aspect ratio, `relative overflow-hidden rounded-t-[5px]`, `ring-1 ring-inset ring-white/5`.
- **Metadata Hierarchy**:
  - Title: `15px font-medium text-[#F8FAFC]`
  - Subtitle / Genre: `12px text-[#64748B]`
  - Telemetry / Price: `tabular-nums font-medium text-[13px] text-slate-200`

### 3.3 Modals, Sheets & Popovers
- **Backdrop**: `bg-black/70 backdrop-blur-md`.
- **Container**: `bg-[#0E1217] border border-[#262F3D] border-t-white/15 rounded-md p-6 shadow-2xl`.
- **Buttons**:
  - Primary: `bg-[#FF7A00] hover:bg-[#E66E00] text-black font-semibold rounded-md px-4 py-2 text-xs active:scale-[0.98] transition-all`.
  - Secondary: `bg-[#141921] hover:bg-[#1C232E] text-slate-200 border border-[#262F3D] rounded-md px-4 py-2 text-xs active:scale-[0.98] transition-all`.

