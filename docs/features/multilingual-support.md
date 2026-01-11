# Feature Specification: Multilingual Support (Arabic/English)

**Status:** Draft
**Author:** Antigravity (AI Assistant)
**Created:** 2026-01-10
**Last Updated:** 2026-01-10

---

## Executive Summary

Enable full bilingual support (Arabic and English) for the Sidra-Ai web application. This involves configuring Next.js for internationalized routing, managing translation files, implementing RTL (Right-to-Left) support for Arabic, and updating the database schema to support bilingual content where missing.

---

## Table of Contents

1. [Feature Specification](#1-feature-specification)
2. [Technical Architecture](#2-technical-architecture)
3. [UX & Product Decisions](#3-ux--product-decisions)
4. [Implementation Checklist](#4-implementation-checklist)

---

## 1. Feature Specification

### Feature Goal

Transform the platform into a fully bilingual experience, allowing users to switch seamlessly between English and Arabic. The interface should adapt its layout (LTR/RTL) and formatting to match the selected locale.

### User Stories

#### All Users
- As a user, I want to toggle between English and Arabic so I can use the platform in my preferred language.
- As a user, I expect the layout to flip (RTL for Arabic) so that the interface feels natural.
- As a user, I want my language preference to be remembered across sessions.

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Support English (`en`) and Arabic (`ar`) locales. | P0 |
| FR-2 | Default locale shall be Arabic (`ar`). | P0 |
| FR-3 | Implement URL-based routing (e.g., `/ar/dashboard`, `/en/dashboard`). | P0 |
| FR-4 | Persist user language preference (Cookie/DB). | P1 |
| FR-5 | Full RTL layout support for Arabic, including flipping of sidebars, icons (where directional), and margins/padding. | P0 |
| FR-6 | Support bilingual database content for reference data (e.g., Subject names, Teaching Tags). | P0 |

---

## 2. Technical Architecture

### Component Design

#### Library Selection
- **Library:** `next-intl`
- **Reasoning:** Standard solution for App Router, robust middleware, and type-safe translations.

#### Directory Structure
Move from `apps/web/src/app/*` to `apps/web/src/app/[locale]/*`.

```text
apps/web/src/
├── app/
│   └── [locale]/
│       ├── layout.tsx  <-- IntlProvider, dir="rtl" logic
│       └── page.tsx
├── messages/
│   ├── ar.json
│   └── en.json
├── middleware.ts       <-- Locale detection & routing
└── i18n/               <-- Config
```

#### Database Changes
New fields required in `schema.prisma`:
- **`teaching_approach_tags`**: Add `labelEn` (existing `labelAr`).
- **`users`**: Add `preferredLanguage` (default `ar`).

---

## 3. UX & Product Decisions

### Language Switcher
- **Placement:** Top navigation bar (globe icon or text code "EN/AR").
- **Behavior:** Changing language redirects to the equivalent route in the target locale (e.g., `/en/about` -> `/ar/about`).

### Content Strategy
- **Static UI:** Fully translated via JSON files.
- **Database Content:**
  - *Reference Data:* Bilingual columns (e.g., `nameAr`, `nameEn`).
  - *User Content:* Initially displayed as-is (mixed) unless explicit bilingual fields are added later.

---

## 4. Implementation Checklist

### Development
- [ ] Install and configure `next-intl`.
- [ ] Add `createNextIntlPlugin` to `next.config.ts`.
- [ ] Implement `src/middleware.ts` for locale routing.
- [ ] Reorganize `app/` directory to `app/[locale]/`.
- [ ] Create initial `messages/ar.json` and `messages/en.json`.
- [ ] Update Root Layout to support dynamic `dir="rtl"` vs `dir="ltr"`.
- [ ] Update `schema.prisma` with `labelEn` for tags and `preferredLanguage` for users.
- [ ] Create database migration.

### Verification
- [ ] Verify root redirection works (`/` -> `/ar`).
- [ ] Verify language switcher persists preference.
- [ ] Verify RTL layout applies correctly in Arabic mode (margins, padding, flex direction).
- [ ] Verify database saves english labels for tags.
