# UI Design Specification: Modern Chinese Minimalism (新中式极简)

## 1. Design Philosophy
Combine traditional Tianjin cultural aesthetics with modern SaaS minimalist design.
- **Keywords**: Clean, Breathing, Cultural Accent, Fluid.
- **Core Value**: Reduce cognitive load while maintaining cultural identity.

## 2. Color System (Design Tokens)

### Neutral Colors (Backgrounds & Text)
- `bg-white` / `bg-gray-950` (Dark Mode Base)
- `bg-gray-50` / `bg-gray-900` (Secondary Surface)
- `text-gray-900` / `text-gray-50` (Primary Text)
- `text-gray-500` / `text-gray-400` (Secondary Text)
- `border-gray-200` / `border-gray-800` (Dividers)

### Accent Colors (Cultural Identity)
- **Tianjin Red (Primary Action)**: `red-600` (Standard) / `red-500` (Dark Mode)
  - *Usage*: Primary buttons, active states, key highlights.
- **Glaze Blue (Information/Link)**: `blue-600` / `blue-500`
  - *Usage*: Links, selection states, informational badges.
- **Warm Gold (Premium/Heritage)**: `amber-500`
  - *Usage*: VIP features, "Time-honored Brand" markers.

## 3. Typography & Spacing

### Spacing System (8px Grid)
- `p-2` (8px): Tight spacing (tags, small buttons)
- `p-4` (16px): Standard spacing (card padding, list items)
- `p-6` (24px): Section spacing
- `p-8` (32px): Layout containers

### Typography
- **Headings**: Font-weight 600/700, tight tracking.
- **Body**: Font-weight 400/500, relaxed line-height (1.5).
- **Labels**: Font-weight 500, uppercase or smaller size (text-xs/sm).

## 4. Component Standards

### Cards & Surfaces
- **Shadow**: `shadow-sm` (Rest), `shadow-md` (Hover).
- **Radius**: `rounded-xl` (Standard), `rounded-2xl` (Large Containers).
- **Border**: Minimal usage. Prefer `shadow-sm` or distinct background colors over borders.
- **Interaction**:
  - Hover: `scale-[1.02]` or `translate-y-[-2px]`.
  - Transition: `duration-200 ease-in-out`.

### Buttons & Inputs (Fitts' Law)
- **Min Height**: 44px (Mobile/Touch friendly).
- **Radius**: `rounded-lg` or `rounded-full` (Pill buttons).
- **Focus State**: `ring-2 ring-red-500 ring-offset-2`.

### Animations
- **Duration**: 200ms - 300ms.
- **Easing**: `ease-out` (Entry), `ease-in` (Exit).
- **Types**: Fade, Slide Up, Scale.

## 5. Implementation Guide
When refactoring components, adhere to these utility class patterns:

- **Primary Button**: `bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-all active:scale-95`
- **Card**: `bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700`
- **Input**: `w-full rounded-lg border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-red-500 transition-all`
