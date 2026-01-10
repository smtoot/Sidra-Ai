# Sidra Design System (v1.0)
*Extracted from Homepage Implementation*

## 1. Foundations

### Colors
**Brand Colors (Nile Heritage)**
| Token Name | Hex Value | Usage |
|:---|:---|:---|
| `color-primary-500` | `#003366` | Primary Actions, Brand Headings, Active States (Legacy `color-primary`) |
| `color-primary-600` | `#002952` | Hover States for Primary |
| `color-primary-900` | `#000a14` | Darkest Brand Shade |
| `color-accent-500` | `#D4A056` | Call to Actions (Gold), Highlights (Legacy `color-accent`) |
| `color-accent-600` | `#aa8045` | Hover States for Accent |

**Neutral / Structural**
| Token Name | Hex Value | Usage |
|:---|:---|:---|
| `color-background` | `#FAFAFA` | Main Page Background |
| `color-surface` | `#FFFFFF` | Cards, Modals, Dropdowns |
| `color-text-main` | `#1f2937` | Headings, Primary Body Text (Gray-800) |
| `color-text-subtle` | `#6b7280` | Secondary Text, Descriptions (Gray-500) |
| `color-white` | `#FFFFFF` | Text on Dark Backgrounds |

**Semantic**
| Token Name | Hex Value | Usage |
|:---|:---|:---|
| `color-success-500` | `#22c55e` | Success states |
| `color-warning-500` | `#f59e0b` | Ratings (Stars), Warnings |
| `color-error-500` | `#ef4444` | Destructive actions, Errors |

---

### Typography
**Font Family**
*   **Primary**: `Tajawal`, `Cairo`, sans-serif (Arabic-centric)

**Scale**
| Style Name | Size | Weight | Line Height | Usage |
|:---|:---|:---|:---|:---|
| **Display XL** | `3rem` (5xl-7xl) | ExtraBold (800) | Tight | Hero Headline |
| **Display L** | `2.25rem` (4xl) | ExtraBold (800) | Tight | Section Headings ("Why Sidra", "CTA") |
| **Heading M** | `1.5rem` (xl-2xl) | Bold (700) | Normal | Card Titles, Sub-sections |
| **Body Large** | `1.125rem` (lg) | Medium (500) | Relaxed | Intro text, CTA descriptions |
| **Body Base** | `1rem` (base) | Normal (400) | Normal | Default paragraph, Feature descriptions |
| **Meta / Small** | `0.875rem` (sm/xs) | Medium (500) | Normal | Experience tags, Footer links |

---

### Spacing & Layout
**Grid System**
*   **Container**: `container mx-auto px-4` (Standard centering with gutters)
*   **Section Padding**: `py-20` or `py-24` (80px - 96px)
*   **Grid Gap**: `gap-8` (32px) standard, `gap-4` (16px) for tighter lists

**Spacing Scale**
*   `p-6` / `p-8`: Card padding
*   `mb-4` / `mb-12`: Vertical rhythm between headings and content

---

### Radius & Shadows
**Border Radius**
*   `rounded-xl`: Default for Buttons and Feature Cards
*   `rounded-2xl`: Large containers (Search Box, Teacher Cards)
*   `rounded-full`: Pills, Badges, Avatars

**Shadows**
*   `shadow-sm`: Default Card state
*   `shadow-md`: Primary Buttons
*   `shadow-xl`: Hover states, Floating elements (Search Box)
*   `shadow-2xl`: Deep depth for Hero elements

---

## 2. Components

### Buttons
**Primary Button (Gold)**
*   **Style**: `bg-[#D4A056] text-white rounded-xl shadow-md`
*   **Hover**: `hover:bg-[#C29046] hover:shadow-lg hover:-translate-y-1`
*   **Usage**: Main CTA ("ابدأ البحث الآن", "عرض كل المعلمين")
*   **Size**: Large (`h-12` or `py-6 px-10`)

**Ghost / Text Button**
*   **Style**: Transparent background, often with icon
*   **Usage**: Navigation links, Secondary actions

### Cards
**Teacher Card**
*   **Container**: White background, `rounded-2xl`, `border border-gray-100`, `shadow-sm`
*   **Interaction**: `hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
*   **Content**: Center aligned, Avatar (circle + border), Name (Bold), Subject Badge, Rating (Star icon).

**Feature Card**
*   **Container**: White background, `rounded-xl`, `shadow-sm`, `p-6`
*   **Interaction**: `hover:shadow-md`
*   **Layout**: Row layout (Icon box + Text column)
*   **Icon**: Wrapped in `bg-[#F0F7FF]` (Light Blue) box.

### Badges & Tags
**Subject Badge**
*   **Style**: `bg-[#F0F7FF] text-[#003366] rounded-full`
*   **Typography**: Bold, Small size

**Curriculum Tag**
*   **Style**: White background, `border border-gray-200`, `rounded-lg`
*   **Content**: Flag emoji + Text label

**Trust Badge (Hero)**
*   **Style**: Glassmorphism (`bg-white/5 backdrop-blur-sm border-white/10`)
*   **Usage**: Displaying stats on dark backgrounds.

### Inputs
**Search Select**
*   **Trigger**: `h-12 bg-gray-50 border-gray-200 rounded-lg`
*   **Focus**: `ring-2 ring-[#D4A056]/50` (Gold glow)
*   **Text**: Right aligned (`text-right`)

---

## 3. Layout Patterns

### Page Structure
1.  **Hero**: Full width, split layout (Text Left / Image Right on Desktop), Dark Blue Background (`#003366`).
2.  **Standard Section**: Centered container, optionally light gray background (`bg-gray-50` or `#F9F5F0`).
3.  **Grids**:
    *   **Desktop**: 3 columns (`grid-cols-3`) for Teacher cards, 2 columns (`grid-cols-2`) for Feature lists.
    *   **Mobile**: Single column (`grid-cols-1`).

---

## 4. Content & Copy

### Tone of Voice
*   **Trustworthy & Professional**: "نخبة من المعلمين", "خصوصية وأمان".
*   **Empowering**: "أفضل المعلمين لأبنائك", "اختر معلمك بنفسك".
*   **Direct & Clear**: Specific labels ("المنهج", "المرحلة").

### Microcopy
*   **CTAs**: Action-oriented ("ابدأ", "عرض", "تصفح").
*   **Empty States / Placeholders**: "اختر..." (e.g., "اختر المرحلة").
