# Kaarma Color Palette

> **Design System:** Warm Monochrome + Cool Blue Accent  
> **Philosophy:** Never use pure black `#000000` or pure white `#FFFFFF` as primary text/backgrounds

---

## Light Mode

| Token             | Hex       | Preview | Usage                                    |
|-------------------|-----------|---------|------------------------------------------|
| **Primary**       | `#81A6C6` | 🔵      | Primary CTA, active states, progress     |
| **Primary Light** | `#AACDDC` | 🔵      | Secondary highlights, gradients          |
| **Primary Dark**  | `#5A7FA0` | 🔵      | *(derived — darken Primary by 15%)*     |
| **Accent**        | `#F3E3D0` | 🟡      | Warm backgrounds, journal cards          |
| **Accent Light**  | `#F8F3EB` | 🟡      | Subtle warm surface variants             |
| **Background**    | `#FAFAF8` | ⬜      | App background (warm off-white)          |
| **Surface**       | `#FFFFFF` | ⬜      | Cards, bottom sheets, modals             |
| **Surface Alt**   | `#E8E4DF` | ⬜      | Card borders, subtle dividers            |
| **Text Primary**  | `#1A1A2E` | ⬛      | Headlines, body text (never pure black)  |
| **Text Secondary**| `#5A5A72` | ⬛      | Descriptions, captions, muted text       |
| **Text Muted**    | `#757681` | ⬛      | Tertiary text, placeholders              |
| **Divider**       | `#E8E4DF` | ⬜      | Card borders, section separators         |
| **Error/Alert**   | `#E05C5C` | 🔴      | Relapse, destructive actions, blocked    |
| **Success**       | `#4CAF82` | 🟢      | Streaks, completed states, clean streaks |
| **Warning**       | `#F5A623` | 🟡      | At-risk states, approaching limits       |
| **Premium Gold**  | `#81A6C6` | 🔵      | *(uses Primary — no separate gold token)*|

---

## Dark Mode

| Token             | Hex       | Preview | Usage                                    |
|-------------------|-----------|---------|------------------------------------------|
| **Background**    | `#0F0F1A` | ⬛      | App background (deep navy-black)         |
| **Surface**       | `#1C1C2E` | ⬛      | Cards, modals, bottom sheets             |
| **Text Primary**  | `#F0F0F8` | ⬜      | Headlines, body text (warm white)        |
| **Text Secondary**| `#9090A8` | ⬛      | Descriptions, captions                   |
| **Text Muted**    | `#6A6A82` | ⬛      | Tertiary text, placeholders              |
| **Divider**       | `#2A2A3E` | ⬛      | Card borders, subtle separators          |
| **Primary**       | `#81A6C6` | 🔵      | *(same as light mode)*                   |
| **Primary Light** | `#AACDDC` | 🔵      | *(same as light mode)*                   |
| **Success**       | `#4CAF82` | 🟢      | *(same as light mode)*                   |
| **Warning**       | `#F5A623` | 🟡      | *(same as light mode)*                   |
| **Error/Alert**   | `#E05C5C` | 🔴      | *(same as light mode)*                   |

---

## Surface Container Scale (Light Mode)

| Token                      | Hex       | Usage                          |
|----------------------------|-----------|--------------------------------|
| `SurfaceContainerLowest`   | `#FFFFFF` | Lowest elevation surfaces      |
| `SurfaceContainerLow`      | `#F8F3EB` | Slightly elevated surfaces     |
| `SurfaceContainer`         | `#F2EDE5` | Default surface elevation      |
| `SurfaceContainerHigh`     | `#ECE8DF` | Higher elevation surfaces      |
| `SurfaceContainerHighest`  | `#E6E2DA` | Highest elevation before card  |

## Surface Container Scale (Dark Mode)

| Token                      | Hex       | Usage                          |
|----------------------------|-----------|--------------------------------|
| `SurfaceContainerLowest`   | `#0A0A14` | Lowest elevation surfaces      |
| `SurfaceContainerLow`      | `#14142A` | Slightly elevated surfaces     |
| `SurfaceContainer`         | `#1C1C2E` | Default surface elevation      |
| `SurfaceContainerHigh`     | `#262640` | Higher elevation surfaces      |
| `SurfaceContainerHighest`  | `#303050` | Highest elevation before card  |

---

## Overlays

| Token             | Value                  | Usage                        |
|-------------------|------------------------|------------------------------|
| `OverlayLight`    | `rgba(0,0,0,0.35)`     | Light dimming overlays       |
| `OverlayMedium`   | `rgba(26,26,46,0.6)`   | Medium dimming (modals, FAB) |

---

## Neutral Palette (Warm Grays)

| Token        | Hex       | Preview | Usage                        |
|--------------|-----------|---------|------------------------------|
| `WarmSand`   | `#F3E3D0` | 🟡      | Accent backgrounds, warmth   |
| `DustyTaupe` | `#D2C4B4` | 🟡      | Borders, inactive states     |

---

## Usage Rules

1. **Never hardcode hex values** — always import from `constants/theme.ts`
2. **Never use `#000000`** — use `TextPrimary` (`#1A1A2E`) instead
3. **Never use `#FFFFFF` as text** — use `Surface` only for surfaces
4. **Primary color** (`SteelBlue`) is the only brand accent — no secondary accents
5. **Semantic colors** (Success, Warning, Danger) are consistent across light/dark mode
6. **Premium Gold** doesn't exist as a separate token — premium uses `SteelBlue`

---

**Source:** `constants/theme.ts` — Single source of truth for all visual tokens
