# Kaarma App — UI/UX Design Specification

### "Own Your Day. Every Day."

---

## 1. Brand Identity

| Attribute       | Value                               |
| --------------- | ----------------------------------- |
| **App Name**    | Kaarma                              |
| **Tagline**     | Own Your Day. Every Day.            |
| **Personality** | Bold, high-energy, action-oriented  |
| **Tone**        | Empowering, confident, motivational |
| **Inspiration** | Nike Training Club meets Oura Ring  |

Kaarma is a productivity super-app for Android and iOS. It unifies habit tracking, bad habit/addiction monitoring, journaling, activity logging, goal setting, and screen time management into one bold, cohesive experience. Users should feel a sense of ownership and momentum every time they open the app.

---

## 2. Color Palette

### Primary Colors

| Name           | Hex       | Usage                                                |
| -------------- | --------- | ---------------------------------------------------- |
| **Steel Blue** | `#81A6C6` | Primary actions, CTAs, active states, progress rings |
| **Soft Sky**   | `#AACDDC` | Secondary highlights, hover states, gradient fills   |

### Neutral / Surface Colors

| Name                | Hex       | Usage                                                   |
| ------------------- | --------- | ------------------------------------------------------- |
| **Warm Sand**       | `#F3E3D0` | Accent backgrounds, journal cards, warm highlights      |
| **Dusty Taupe**     | `#D2C4B4` | Borders, dividers, inactive states                      |
| **Background**      | `#FAFAF8` | App-wide background (warm off-white, never stark white) |
| **Surface / Cards** | `#FFFFFF` | Card backgrounds, bottom sheets, modals                 |

### Semantic Colors

| Name                 | Hex       | Usage                                                  |
| -------------------- | --------- | ------------------------------------------------------ |
| **Text Primary**     | `#1A1A2E` | Headlines, body copy, primary labels                   |
| **Text Secondary**   | `#5A5A72` | Subtitles, captions, metadata                          |
| **Success / Streak** | `#4CAF82` | Completed habits, streaks, positive metrics            |
| **Warning**          | `#F5A623` | Missed habits, approaching limits, caution states      |
| **Danger / Relapse** | `#E05C5C` | Addiction relapses, overdue goals, destructive actions |

### Color Usage Principles

- Never use pure black (`#000000`) or pure white (`#FFFFFF`) as text on backgrounds.
- Maintain a **minimum 4.5:1 contrast ratio** for all body text (WCAG AA).
- Steel Blue and Soft Sky may be used as gradient pairs for hero elements and progress visuals.
- Warm Sand backgrounds are reserved for warm-tone sections (e.g., Journal, Reflection) to create emotional contrast against data-heavy screens.

---

## 3. Typography

### Font Family

**Primary:** Inter, DM Sans, or Outfit — geometric sans-serif with strong legibility at all sizes.  
**Fallback:** System UI (San Francisco on iOS, Roboto on Android).

### Type Scale

| Role                | Weight          | Size    | Letter Spacing    | Usage                          |
| ------------------- | --------------- | ------- | ----------------- | ------------------------------ |
| **Display**         | Black (900)     | 32–40sp | -0.5px            | Hero metrics, screen titles    |
| **Headline 1**      | Bold (700)      | 24–28sp | -0.3px            | Section titles, card headers   |
| **Headline 2**      | Bold (700)      | 20–22sp | 0px               | Sub-section headers            |
| **Body Large**      | Regular (400)   | 16sp    | 0px               | Primary readable content       |
| **Body Regular**    | Regular (400)   | 15sp    | 0px               | Standard body copy             |
| **Label / Caption** | Medium (500)    | 12–13sp | +0.8px, UPPERCASE | Section headers, chips, badges |
| **Stat / Number**   | ExtraBold (800) | 36–56sp | -1px              | Streak counts, scores, timers  |

### Typography Principles

- Headlines feel **condensed and authoritative** — never spindly.
- Numbers and stats use the heaviest weight available to create visual punch.
- Section labels use **uppercase tracking** to act as clear navigational anchors.
- Avoid more than 3 type sizes on any single screen to maintain hierarchy.

---

## 4. Spacing & Layout

### Base Grid

- **Base unit:** 4dp
- **Card padding:** 16–20dp
- **Screen horizontal margin:** 20dp
- **Vertical rhythm between sections:** 24dp
- **Inline item spacing:** 8–12dp

### Corner Radius

| Element               | Radius           |
| --------------------- | ---------------- |
| Cards / Sheets        | 16–20dp          |
| Buttons (Primary)     | 12dp             |
| Input Fields          | 12dp             |
| Chips / Tags          | 8dp              |
| Badges / FABs / Pills | 100% (full pill) |
| Bottom Navigation     | 20dp top corners |
| Modal / Bottom Sheet  | 24dp top corners |

---

## 5. Iconography

- **Style:** Rounded, 2dp stroke weight, filled variants for active states.
- **Size:** 24dp standard, 20dp in dense lists, 28dp in navigation.
- **Active icons:** Filled + Steel Blue tint.
- **Inactive icons:** Outlined + Dusty Taupe (`#D2C4B4`).
- **Source:** Lucide Icons or Material Symbols Rounded — never mix styles.
- Category-specific icons (e.g., flame for streaks, shield for bad habit tracking, pen for journal) should feel expressive but remain within the same stroke family.

---

## 6. Component Library

### 6.1 Buttons

**Primary Button**

- Background: `#81A6C6` (Steel Blue)
- Text: `#FFFFFF`, Bold, 15sp
- Height: 52dp
- Corner radius: 12dp
- States: Default → Pressed (darken 10%) → Disabled (40% opacity)

**Secondary Button**

- Background: transparent
- Border: 1.5dp `#81A6C6`
- Text: `#81A6C6`, Medium, 15sp

**Danger Button**

- Background: `#E05C5C`
- Used exclusively for destructive actions (log relapse, delete data)

**FAB (Floating Action Button)**

- Shape: Full pill or circle
- Background: `#1A1A2E` (dark, high contrast)
- Icon: White, 24dp
- Shadow: `0 4dp 16dp rgba(26,26,46,0.2)`

### 6.2 Cards

**Standard Card**

- Background: `#FFFFFF`
- Corner radius: 16dp
- Shadow: `0 2dp 8dp rgba(0,0,0,0.06)`
- Padding: 16dp all sides

**Hero / Feature Card**

- Background: Gradient (Steel Blue → Soft Sky) or Warm Sand
- Text: `#1A1A2E` on light variants, `#FFFFFF` on dark/blue variants
- Corner radius: 20dp
- Height: 160–200dp

**Streak / Stat Card**

- Contains: Large stat number (ExtraBold), label (uppercase), supporting trend line or mini chart
- Accent strip: 4dp left border in Success Green or Steel Blue

### 6.3 Progress Indicators

**Ring / Circular Progress**

- Track color: `#D2C4B4` (Dusty Taupe)
- Fill color: `#81A6C6` or `#4CAF82` on completion
- Stroke width: 8–10dp
- Center: Stat number + label

**Linear Bar**

- Height: 8dp
- Track: `#F3E3D0` (Warm Sand)
- Fill: Context-dependent (Steel Blue for neutral progress, Success Green for streaks, Danger Red for addiction relapse counter going up)
- Fully rounded ends

**Streak Dot Grid** (habit calendar view)

- Filled dot: `#4CAF82`
- Missed dot: `#E05C5C`
- Empty/future dot: `#D2C4B4`
- Dot size: 10dp, spacing: 4dp

### 6.4 Chips & Badges

**Category Chip**

- Background: `#F3E3D0` (default) or `#AACDDC` (selected)
- Text: `#1A1A2E`, 12sp, Medium, uppercase
- Height: 32dp, corner radius: 8dp

**Streak Badge**

- Shape: Full pill
- Background: `#4CAF82`
- Icon: 🔥 or flame icon, white
- Text: White, Bold, 13sp

**Warning Badge**

- Background: `#F5A623`
- Used for: missed days, approaching screen time limits

**Danger Badge**

- Background: `#E05C5C`
- Used for: relapse markers, overdue goals

### 6.5 Input Fields

- Height: 52dp
- Background: `#FAFAF8`
- Border: 1dp `#D2C4B4`, active border `#81A6C6` (2dp)
- Label: Floating label, 12sp, `#5A5A72`
- Corner radius: 12dp
- Error state: Border `#E05C5C` + error message below in 12sp Danger Red

### 6.6 Bottom Navigation Bar

- Height: 64dp + safe area inset
- Background: `#FFFFFF` with top shadow
- Active tab: Filled icon + Steel Blue label
- Inactive tab: Outlined icon + Dusty Taupe label
- Active indicator: Pill shape behind icon, `#AACDDC` at 30% opacity

---

## 7. Screen Designs

### 7.1 Onboarding Flow

**Screen 1 — Splash / Brand**

- Full-screen background: Deep dark navy (`#1A1A2E`)
- App name: "KAARMA" in Display Black, Steel Blue color
- Tagline: "Own Your Day. Every Day." centered below, `#AACDDC`
- Animation: Name fades + scales in (300ms ease-out)

**Screens 2–4 — Value Proposition Carousel**

- Layout: Illustration (top 55%) + Text block (bottom 45%)
- Background alternates: `#FAFAF8` → `#1A1A2E` (dark slide) → `#F3E3D0`
- Headlines: Bold, 28sp, `#1A1A2E` (or white on dark slide)
- Body: 15sp, `#5A5A72`
- Progress dots: Pill indicators at bottom
- CTA: "Get Started" Primary Button + "I already have an account" text link

**Screen 5 — Goal Setup**

- Prompt: "What do you want to own?" with multi-select category chips
- Categories: Habits, Addictions, Journal, Goals, Screen Time
- Each chip has an icon + label
- Selected state: Steel Blue fill, white text

### 7.2 Home / Dashboard

**Layout:** Scrollable vertical feed with a sticky greeting header.

**Top Bar**

- Left: Greeting ("Good morning, Alex 👋"), `#1A1A2E`, Headline 1
- Right: Avatar/profile circle + Notification bell icon

**Daily Score Hero Card**

- Background: Gradient (Steel Blue `#81A6C6` → `#1A1A2E`)
- Center: Large circular ring with daily completion percentage
- Inside ring: Score in Display Black (white), "Today's Score" label
- Below ring: Row of 3 mini-stats (Habits Done, Streak, Focus Time)
- Corner radius: 20dp, full-width

**Quick Action Row**

- 4 pill buttons: "+ Habit", "+ Log", "Journal", "Check-in"
- Background: `#FFFFFF` cards, Steel Blue icon, Dark text label

**Today's Habits Section**

- Section header: "TODAY'S HABITS", uppercase, 12sp, `#5A5A72`
- Each habit row: Icon, name, streak badge, completion toggle (right)
- Completed state: Name strikethrough, checkmark in `#4CAF82`
- Swipe left to skip / snooze

**Bad Habit Tracker Snapshot**

- Mini-card with flame/shield icon
- Shows: "X days clean" in large ExtraBold + `#4CAF82`
- Or if relapsed: Danger Red, "Restart your streak" CTA

**Journal Prompt Card**

- Background: `#F3E3D0` (Warm Sand)
- Italic prompt text: "What made you proud today?"
- "Write Entry" button, Steel Blue outline

**Goal Progress Row**

- Horizontal scroll
- Each card: Goal name, linear bar, percentage, due date chip

### 7.3 Habits Screen

**Header:** "MY HABITS" Display title + "+" FAB (dark pill, top right)

**Filter Chips Row:** All / Morning / Evening / Health / Work — horizontally scrollable

**Habit Card (Expanded)**

- Top: Icon (category color tint) + Habit name (Headline 2) + active toggle
- Middle: 7-day dot grid (current week) + best streak stat
- Bottom: Completion ring (this week %) + "View Details" link

**Empty State**

- Illustration: Simple line art figure with a calendar
- Headline: "No habits yet."
- CTA: "Build your first habit" → Primary Button

**Add Habit Bottom Sheet**

- Fields: Name, Category, Frequency (chips: Daily / Weekly / Custom), Time of day, Reminder toggle
- Icon picker row (emoji or category icon)
- "Create Habit" Primary Button

### 7.4 Bad Habit / Addiction Tracker

**Design tone:** Serious but empowering — never shaming. Success states dominate the visual language.

**Clean Streak Hero**

- Full-width card, background `#1A1A2E`
- Top: Shield icon in `#4CAF82`
- Center: "47 DAYS CLEAN" in Display Black, white
- Subtext: "Your longest streak ever." in `#AACDDC`
- Relapse button: Text-only, small, `#E05C5C` — not a prominent CTA

**Timeline / Calendar View**

- Monthly dot grid
- Green = clean day, Red = relapse, Empty = future
- Tap a day → overlay with notes/log

**Stats Row**

- 3 cards: Current Streak / Best Streak / Total Clean Days

**Trigger Journal**

- Lightweight log: "What triggered you today?" — optional mood tags
- Tags: Stressed, Bored, Social, Tired, Craving

**Motivational Milestone Card**

- Appears at key streaks (7, 30, 90, 365 days)
- Background: Gradient (Soft Sky → Steel Blue)
- Trophy/badge icon, bold milestone message

### 7.5 Journal Screen

**Visual identity:** Warmer, softer version of the app. Warm Sand and white dominate.

**Header:** "JOURNAL" title + calendar icon (month view) + "New Entry" pill button

**Entry Cards**

- Background: `#FFFFFF`, left accent strip in Warm Sand or Soft Sky
- Date chip (top left), Mood emoji (top right)
- Title: Bold, 17sp
- Preview: 2-line excerpt, `#5A5A72`
- Tags row: Category chips

**New Entry Screen**

- Top: Date + Mood selector row (emoji icons, selectable)
- Prompt suggestion (dismissible): Italic, `#5A5A72`
- Large text area: 16sp, relaxed line height (1.6)
- Floating toolbar: Bold / Italic / Tag / Photo / Voice

**Mood Over Time Widget**

- Mini line chart on Journal home
- X-axis: past 7 days
- Y-axis: mood 1–5 (mapped to emoji)
- Line color: Steel Blue → Soft Sky gradient

### 7.6 Goals Screen

**Goal Card**

- Header: Goal name (Headline 2) + category chip
- Progress bar: Full width, fills with Steel Blue
- Stats row: "X of Y done" / Days remaining chip (Warning Yellow if <7 days)
- Sub-tasks: Checklist with checkboxes, collapsible

**View Toggle:** Card view (default) ↔ Timeline/Gantt view (horizontal scroll)

**Add Goal Sheet**

- Fields: Goal title, description, category, target date (date picker), measurable metric (optional), linked habits toggle

**Completed Goals Archive**

- Greyed cards with Success Green stamp badge overlay: "ACHIEVED ✓"

### 7.7 Activity Log

**Log Types:** Workout, Walk, Meditation, Read, Sleep, Custom

**Log Entry Row**

- Left: Category icon in colored circle
- Center: Activity name + duration + timestamp
- Right: Edit icon

**Quick Log FAB** → Bottom sheet with:

- Activity type grid (icon grid, 3-column)
- Duration picker (scroll wheel)
- Notes field (optional)
- "Log It" Primary Button

**Weekly Summary Card**

- Bar chart: 7-day activity breakdown
- Total time + most active day callout

### 7.8 Screen Time Management

**Daily Limit Card**

- App category chips (Social, Entertainment, Games)
- Each shows: Used / Limit circular ring
- Color transitions: Green (under 50%) → Warning (75%) → Danger (at limit)

**Focus Mode Banner**

- When active: Sticky top banner in `#1A1A2E`
- White text: "Focus Mode — 42 min remaining"
- Tap to end (requires confirmation)

**Blocked Apps List**

- Toggle list with app icons
- Grayscale icon when blocked

---

## 8. Navigation Architecture

```
Bottom Navigation (5 tabs):
├── 🏠 Home         — Dashboard / Today view
├── ✅ Habits       — Habit + Bad Habit Tracker
├── ＋ [FAB]        — Quick Log (center, elevated)
├── 📓 Journal      — Journal + Mood
└── 👤 Profile      — Goals, Screen Time, Settings, Stats
```

**Navigation Behavior:**

- Center FAB is always elevated above the nav bar
- Active tab uses filled icon + Steel Blue label
- Swipe gestures supported between adjacent tabs
- Back navigation uses system back (Android) / swipe-from-left (iOS)

---

## 9. Motion & Animation

| Interaction             | Animation                      | Duration | Easing               |
| ----------------------- | ------------------------------ | -------- | -------------------- |
| Screen transition       | Slide up / fade                | 280ms    | ease-out-cubic       |
| Card tap                | Scale down 98% + shadow reduce | 100ms    | ease-in              |
| Habit toggle (complete) | Checkmark draw + green fill    | 300ms    | spring               |
| Streak badge appear     | Scale 0→1 + bounce             | 400ms    | spring (0.6 damping) |
| Progress ring fill      | Arc draw                       | 600ms    | ease-out             |
| FAB expand              | Morph to sheet                 | 350ms    | ease-in-out          |
| Bottom sheet open       | Slide up                       | 320ms    | ease-out-cubic       |
| Relapse confirm         | Shake + red flash              | 250ms    | ease-in-out          |

**Principles:**

- Celebrate completions with micro-delight animations (confetti, bounce, glow).
- Never animate more than 2 elements simultaneously on lower-end devices.
- Respect `prefers-reduced-motion` accessibility setting.

---

## 10. Empty States & Error States

### Empty States

Every empty state must include:

1. A contextual illustration (simple, line-art style, on-brand colors)
2. A short, action-oriented headline ("Nothing tracked yet.")
3. A single Primary CTA button

### Error States

- Network error: Inline card with retry icon + "Couldn't load data. Tap to retry."
- Form errors: Field-level red border + error message below the field
- Destructive confirmations: Bottom sheet with Danger Red button — never auto-confirm

---

## 11. Accessibility Guidelines

- **Touch targets:** Minimum 48×48dp for all interactive elements.
- **Contrast:** Text Primary on Background = 13.5:1. Text Secondary = 4.8:1.
- **Dynamic Type:** All text scales with OS font size settings.
- **Screen Reader:** All icons have content descriptions. Progress values announced as percentage.
- **Focus Order:** Logical top-left to bottom-right reading order.
- **Color Independence:** Never rely on color alone to convey state — always pair with icon or text.

---

## 12. Dark Mode

| Light Token              | Dark Equivalent       |
| ------------------------ | --------------------- |
| Background `#FAFAF8`     | `#0F0F1A`             |
| Surface `#FFFFFF`        | `#1C1C2E`             |
| Text Primary `#1A1A2E`   | `#F0F0F8`             |
| Text Secondary `#5A5A72` | `#9090A8`             |
| Steel Blue `#81A6C6`     | `#81A6C6` (unchanged) |
| Dusty Taupe `#D2C4B4`    | `#3A3A4E`             |
| Warm Sand `#F3E3D0`      | `#2A2218`             |

Dark mode surfaces use a subtle elevation system — deeper surfaces are slightly lighter to indicate layering (Material Design 3 elevation tint principle).

---

_Kaarma Design System v1.0 — For internal use and AI-assisted UI generation._
