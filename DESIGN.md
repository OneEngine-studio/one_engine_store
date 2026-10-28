# OneEngine Desktop — System Design Specification (`DESIGN.md`)
> **Standard:** Google / Awesome DESIGN.md Token Architecture & Anti-AI Guardrails  
> **Caliber:** Linear / Stripe / Raycast / Steam Desktop Caliber  
> **Target:** Native Desktop Density (60Hz–240Hz, Electron / Tauri / Web)

---

## 1. Surface Architecture & 4-Tier Depth System

OneEngine Store enforces a flat, layered obsidian-slate elevation system. Pure `#000000` is strictly disallowed as a primary surface, preventing washed-out contrast and floating multi-colored ambient halos.

| Tier / Layer | Hex Token | Tailwind Utility | Semantic Role |
| :--- | :--- | :--- | :--- |
| **Tier 0: Deep Canvas** | `#090B0E` | `bg-void-black` | Root viewport canvas, window gutter, deep wells, recessed inputs |
| **Tier 1: Structural Rail** | `#0E1217` | `bg-gunmetal-slate` | Persistent sidebar, titlebar chrome, modals backdrop |
| **Tier 2: Interactive Card** | `#141921` | `bg-tech-surface` | Default game cards, dashboard panels, bento modules |
| **Tier 3: Elevated Surface**| `#1C232E` | `bg-tech-elevated` | Active tab wells, hover state highlight, popovers, dropdowns |
| **Boundary Stroke** | `#262F3D` | `border-border-stroke` | 1px clean physical boundaries separating surface tiers |
| **Specular Top-Highlight** | `rgba(255,255,255,0.08)` | `border-t border-white/10` | 1px physical top-edge directional light reflection |
| **Inner Thumbnail Ring** | `rgba(255,255,255,0.05)` | `ring-1 ring-inset ring-white/5` | Sharp inner bevel over all media covers |

---

## 2. Tactical Accent & Telemetry Palette

Accents are applied with high restraint (less than 5% total surface area). Saturated neon glows and rainbow gradients are strictly banned.

| Role | Hex Token | Tailwind Utility | Semantic Context |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#FF7A00` | `text-primary-accent`, `bg-primary-accent` | Primary CTA, download progress, active rail indicator |
| **Signal Teal** | `#00E5FF` | `text-secondary-tech` | Transfer telemetry, speed graphs, network metrics |
| **Positive State** | `#10B981` | `text-tactical-green` | Verified WHQL, process running, installed status |
| **Warning State** | `#F59E0B` | `text-amber-400`, `bg-amber-500` | Paused transfer, launching handshake in-flight |
| **Danger State** | `#E53935` | `text-tactical-danger` | Terminate process, delete action, disk alert |
| **Muted Metadata** | `#8E9AA8` | `text-slate-400`, `text-tactical-muted` | Body subtitles, timestamps, developer credits |

---

## 3. Typography Scale & Hierarchy

- **UI & Body:** `Inter` / `-apple-system` / `Segoe UI` (12px–15px, line-height 1.5, sentence-case).
- **Display & Section Titles:** `Inter` (16px–24px, font-weight 600, tracking-tight).
- **Telemetry & Numbers:** `JetBrains Mono` / `Menlo` with `tabular-nums` for all prices, MB/s counters, timers, and storage sizes.
- **Section Headers:** Uppercase reserved strictly for micro overlines (`text-[11px] font-semibold tracking-wider text-slate-400 uppercase`). Never use all-caps for paragraphs or card descriptions.

---

## 4. Spatial Grid & Corner Geometry

- **Spatial Rhythm:** Strict 4px base grid (`gap-1` = 4px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `p-5` = 20px, `p-6` = 24px).
- **Uniform Radius:** `rounded-md` (`6px`) standard across cards, inputs, buttons, and modals. Pill radii (`rounded-full`) reserved strictly for numeric count tags and switch toggles.

---

## 5. The "Impeccable & Hallmark" Anti-AI Purge (Strict Rules)

1. **NO Neon Halo Gradients:** Zero arbitrary pink-to-purple gradients or glowing colored drop-shadows. Shadows are dark and physical (`shadow-subtle-card: 0 2px 8px rgba(0,0,0,0.35)`).
2. **Maximum 1 Status Badge:** Never stack multiple pill tags over media thumbnails. Restrict to a single clean indicator (`In Library` or `-20%`).
3. **NO Browser Dialogs:** Never invoke native `alert()` or `prompt()`. All user confirmations use integrated modal sheets or the system `ToastContainer`.
4. **NO Equal-Weight Card Soup:** Break flat repetitive lists using asymmetrical Bento grids, subtle dividers (`1px border-stroke`), and generous negative space.
5. **Interactive Feedback:** Every interactive element has tactile scaling (`active:scale-[0.98]`), focus rings (`focus-visible:ring-2 focus-visible:ring-primary-accent/80`), and keyboard accessibility.
6. **Graceful Media & Vignettes:** Media cards feature a dark bottom vignette (`bg-gradient-to-t from-[#141921] via-[#141921]/40 to-transparent`) and a crisp `ring-1 ring-inset ring-white/5` inner border.
7. **Snappy Motion Timings:** All transitions operate between 150ms–250ms with `cubic-bezier(0.22, 1, 0.36, 1)`. All CSS animations strictly honor `prefers-reduced-motion`.
