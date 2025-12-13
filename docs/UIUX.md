# 🎨 Sidra UI/UX Design Guide
## Version 1.0 - For AntiGravity Team

---

## 1. Introduction & Design Philosophy

### 1.1. Project Vision
Sidra is a trusted educational platform connecting Sudanese students with qualified Sudanese teachers. Our design must reflect this core mission.

### 1.2. Design Philosophy: "Nile Heritage"
Our design language is named **"أصالة النيل" (Nile Heritage)**. It is built on three core pillars:
1.  **Trust & Professionalism:** The design must feel secure, reliable, and expertly crafted. Users are entrusting us with their children's education and their money.
2.  **Simplicity & Clarity:** The user journey must be effortless. We avoid cognitive load by making interfaces intuitive, clean, and straightforward.
3.  **Warmth & Authenticity:** While professional, the design should feel welcoming, encouraging, and authentically Sudanese. It's a platform by the community, for the community.

### 1.3. Target Audience
-   **Primary User (The Parent):** Often 30-55 years old, may not be highly tech-savvy. Values trust, clarity, and results above all.
-   **Secondary User (The Teacher):** Professional, values efficiency, and clear financial tracking.

---

## 2. Brand Identity & Visuals

### 2.1. Logo
-   **Primary Logo:** [Insert Final Sidra Logo Here]
-   **Usage:** To be used in the header, footer, and official communications. Must have clear space around it.

### 2.2. Color Palette: "Nile Heritage"
This is the **only** color palette to be used across the entire platform.

| Role | Color | HEX Code | Usage |
|---|---|---|---|
| **Primary** | **Nile Blue** | `#003366` | Main buttons, headers, active links, icons, footer background. The color of trust and stability. |
| **Accent** | **Sand Gold** | `#D4A056` | Highlighting key info (e.g., star ratings), secondary buttons, illustrative icons, background accents. The color of heritage and value. |
| **Background** | **Warm White** | `#F9F9F9` | Main background for content areas. Softer on the eyes than pure white. |
| **Surface** | **Pure White** | `#FFFFFF` | Background for cards, modals, and input fields to make them "pop". |
| **Text** | **Charcoal** | `#333333` | Main body text for maximum readability. |
| **Text (Subtle)** | **Grey** | `#666666` | Secondary text, placeholders, disabled text. |
| **Success** | **Green** | `#27AE60` | Success messages, confirmation icons. |
| **Error** | **Red** | `#E74C3C` | Error messages, deletion confirmation. |
| **Warning** | **Orange** | `#F39C12` | Warnings, pending statuses. |

### 2.3. Typography
-   **Arabic Font:** **Tajawal** (Available on Google Fonts). It's modern, clean, and highly readable.
-   **English Font:** **Poppins** (Available on Google Fonts). It pairs beautifully with Tajawal.

#### Font Hierarchy:
| Element | Font | Weight | Size (Desktop) | Size (Mobile) | Color |
|---|---|---|---|---|---|
| **Heading 1 (H1)** | Tajawal/Poppins | Bold (700) | 48px | 32px | Charcoal (`#333333`) |
| **Heading 2 (H2)** | Tajawal/Poppins | Bold (700) | 36px | 28px | Charcoal (`#333333`) |
| **Heading 3 (H3)** | Tajawal/Poppins | Semi-Bold (600) | 24px | 20px | Charcoal (`#333333`) |
| **Body Text** | Tajawal/Poppins | Regular (400) | 16px | 14px | Charcoal (`#333333`) |
| **Subtle/Label Text** | Tajawal/Poppins | Regular (400) | 14px | 12px | Grey (`#666666`) |
| **Button Text** | Tajawal/Poppins | Medium (500) | 16px | 14px | Pure White (`#FFFFFF`) |

### 2.4. Iconography
-   **Style:** Use a consistent, clean, solid-style icon set (e.g., a subset of FontAwesome Solid or a custom-designed set).
-   **Color:** Icons should primarily be **Nile Blue (`#003366`)** or **Grey (`#666666`)**.
-   **Usage:** Icons should always be accompanied by a text label, except in universally understood cases (e.g., search magnifying glass).

### 2.5. Imagery & Illustrations
-   **Photography:** Use high-quality, professional photos of teachers. Photos should be warm and welcoming. Avoid generic stock photos.
-   **Illustrations:** If used (e.g., for empty states), they should be simple, elegant, and use the official color palette. The "space theme" is **not** to be used.

---

## 3. Layout & Grid System

### 3.1. Grid
-   Use a 12-column grid system for consistency.
-   **Gutter Width:** 24px.
-   **Max Content Width:** 1200px.

### 3.2. Spacing
-   Use a spacing scale based on a factor of 8px (8, 16, 24, 32, 48, 64px). This ensures consistent and rhythmic vertical and horizontal spacing.
-   **Example:** Padding inside a card should be 24px. Margin between cards should be 24px.

### 3.3. Breakpoints
-   **Mobile:** < 768px
-   **Tablet:** 768px - 1024px
-   **Desktop:** > 1024px

---

## 4. UI Components (The Building Blocks)

### 4.1. Buttons
-   **Primary Button:**
    -   **Background:** Nile Blue (`#003366`)
    -   **Text:** Pure White (`#FFFFFF`)
    -   **Hover:** Slightly lighter blue.
    -   **Usage:** For the main call-to-action on any page (e.g., "احجز الآن", "حفظ التغييرات").
-   **Secondary Button:**
    -   **Background:** Transparent, with a 1px **Nile Blue** border.
    -   **Text:** Nile Blue (`#003366`)
    -   **Hover:** Light blue background fill.
    -   **Usage:** For secondary actions (e.g., "عرض الملف", "إلغاء").
-   **Tertiary/Text Button:**
    -   **Background:** None.
    -   **Text:** Nile Blue (`#003366`), with an underline on hover.
    -   **Usage:** For low-priority actions (e.g., "عرض كل التقييمات").
-   **Destructive Button:**
    -   **Background:** Error Red (`#E74C3C`)
    -   **Text:** Pure White (`#FFFFFF`)
    -   **Usage:** For actions that delete data (e.g., "حذف الحساب"). Always use with a confirmation modal.

### 4.2. Forms & Input Fields
-   **Style:** Clean and simple.
-   **Background:** Pure White (`#FFFFFF`).
-   **Border:** 1px solid light grey.
-   **On Focus:** Border color changes to **Nile Blue (`#003366`)**.
-   **Labels:** Must always be present above the input field.
-   **Validation:** Display error messages in **Error Red (`#E74C3C`)** below the field.

### 4.3. Cards
-   **Background:** Pure White (`#FFFFFF`).
-   **Border Radius:** 8px or 12px for a modern, soft look.
-   **Box Shadow:** A subtle, soft shadow to lift the card off the background. (e.g., `0 4px 12px rgba(0,0,0,0.05)`).

### 4.4. Modals (Pop-ups)
-   **Overlay:** A semi-transparent black overlay on the background content.
-   **Modal Card:** Follows the standard card styling (white background, shadow, border-radius).
-   **Header:** Clear title.
-   **Footer:** Contains action buttons (e.g., Primary and Secondary buttons).

### 4.5. Badges/Tags
-   **Style:** Pill-shaped with rounded corners.
-   **Usage:** For displaying skills, subjects, or statuses.
-   **Color:** Use a light, de-saturated version of the primary colors (e.g., very light blue background with **Nile Blue** text).

---

## 5. Key Screen Wireframes & User Flows

This section provides the core structure for key pages. The final visual design should adhere to this structure.

### 5.1. Homepage
-   **Hero Section:** Compelling headline, sub-headline, and a primary search bar.
-   **Trust Section:** 3-4 cards explaining "Why Sidra?" (e.g., Vetted Teachers, Secure Payment).
-   **Featured Teachers Section:** A horizontally scrollable list of 4-5 teacher profile cards.
-   **How It Works Section:** A simple 3-step visual guide.
-   **Footer:** Comprehensive footer with all necessary links.

### 5.2. Search Results Page
-   **Layout:** Two-column layout.
-   **Left Column (Filters):** A sticky sidebar with all filtering options.
-   **Right Column (Results):** A vertical list of **Teacher Cards**.
    -   **Teacher Card:** Displays essential info: Photo, Name, Subject, Price, Rating, and a "View Profile" button. Use a list view, one card per row, for clarity.

### 5.3. Teacher Profile Page (Reference Design)
-   **This is a critical page. It should be based on the provided inspirational image.**
-   **Layout:** Two-column layout.
-   **Left Column (Main Content):**
    -   About the Teacher
    -   "Why Choose Me?" section (3 key selling points)
    -   Subjects & Skills (as tags)
    -   Student Reviews (list of 2-3 with an option to "view all")
-   **Right Column (Sticky Booking Card):**
    -   This card **must remain visible** as the user scrolls.
    -   Contains:
        1.  **Booking Packages:** (e.g., Trial Session, Single Session, 5-Session Package). The best value package should be highlighted.
        2.  **Calendar:** To select a date.
        3.  **Time Slots:** Available times for the selected date.
        4.  **Primary CTA Button:** "Book Now".

### 5.4. User Dashboards (Parent/Teacher)
-   **Layout:** Two-column layout.
-   **Left Column (Navigation):** A fixed sidebar with clear icons and labels for navigation (e.g., Dashboard, My Sessions, Wallet, Settings).
-   **Right Column (Content):** The main content area, which changes based on the selected navigation item. The dashboard homepage should feature KPI cards and a list of "Urgent Actions".

---

## 6. Final Checklist for Designers

-   [ ] Does the design use the official **Color Palette** and **Typography**?
-   [ ] Is the spacing consistent and based on the **8px scale**?
-   [ ] Is the layout built on the **12-column grid**?
-   [ ] Are all components (buttons, forms) consistent with the styles defined here?
-   [ ] Is the design **fully responsive** and tested on Mobile, Tablet, and Desktop breakpoints?
-   [ ] Is the design **accessible** (WCAG 2.1 AA)? Check color contrast and keyboard navigation.
-   [ ] Does the design feel **trustworthy, simple, and warm**?

---

This document is the **Single Source of Truth** for all UI/UX decisions. Any deviation must be discussed and approved by the Product Manager. Let's build an experience our users will love and trust.
