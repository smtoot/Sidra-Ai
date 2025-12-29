# Deferring Curriculum Track Implementation (British Series)

**Project:** Sidra  
**Date:** 2025-12-28  
**Owner:** Omar  
**Status:** FINAL

---

## 1. Background

Sidra currently supports curriculum structuring as:

```
Curriculum → Stage → Grade → Subject
```

A proposal was discussed to introduce an additional structured layer called **Curriculum Tracks / Series** (e.g. Cambridge, Oxford, Macmillan) to better represent the British curriculum and similar international systems.

After architectural review and business evaluation, a decision is required on whether to implement this feature now or defer it.

---

## 2. Problem Statement

While technically sound, introducing structured curriculum tracks at the current stage raises concerns around:

- Marketplace liquidity (limited number of British curriculum teachers)
- Over-segmentation of supply
- Increased complexity in teacher onboarding and student search
- Reduced matching success between students and teachers

At this stage, **precision may reduce availability** rather than improve outcomes.

---

## 3. Business Reality Assessment

Key observations:

- Most British curriculum teachers can teach multiple series (Oxford, Cambridge, Macmillan) even without prior formal experience with each
- In early-stage marketplaces, **flexibility beats precision**
- Over-filtering with limited supply leads to poor search results and perceived lack of options
- Student demand for specific series is currently **unvalidated**

---

## 4. Decision

> **The implementation of structured Curriculum Tracks is officially DEFERRED to a later phase.**

Instead, the following approach is adopted:

- Teachers will indicate any experience with specific series (e.g. Oxford, Cambridge, Macmillan) **freely in their bio**
- No structured fields, filters, or matching logic related to curriculum series will be introduced at this stage
- No restrictions will be placed on teachers based on series experience

This keeps the system **simple, flexible, and liquidity-friendly**.

---

## 5. Rationale

This decision is based on:

| Principle | Application |
|-----------|-------------|
| Marketplace first principles | Maximize matches, minimize friction |
| Cost vs value | High development cost with uncertain immediate value |
| Risk mitigation | Avoid premature abstraction and over-engineering |
| Learning before building | Observe real user behavior before formalizing it into the product |

---

## 6. Scope of Current Phase (Confirmed)

- ✅ Teacher bio remains the only place to mention series experience
- ✅ No changes to database schema related to tracks
- ✅ No changes to onboarding, search, or booking logic
- ✅ No additional filters for students
- ✅ Focus remains on supply growth and core booking experience

---

## 7. Future Revisit Criteria (Explicit Triggers)

This topic will be reopened **ONLY** if one or more of the following occur:

1. A sufficient number of British curriculum teachers are active on the platform
2. Students explicitly request or search for specific series repeatedly
3. Disputes arise related to mismatched series expectations
4. Targeted marketing requires series-specific positioning (e.g. "Cambridge IGCSE Prep")

At that point, a structured Curriculum Track feature may be reconsidered with real data.

---

## 8. Related Documents

- [Curriculum Audit](./curriculum_audit.md) - Technical analysis of current implementation

---

*Decision: FINAL for current phase*  
*Action: No further work on Curriculum Tracks at this time*
