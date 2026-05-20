# Mobile Responsiveness Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile responsiveness issues identified in the audit — pagination touch targets, partner logo scroller sizing, and filter sidebar checkbox sizes.

**Architecture:** Targeted CSS class changes to three existing components. No new files, no structural changes.

**Tech Stack:** Tailwind CSS responsive utilities

---

## Audit results

| Component | Status | Issue |
|-----------|--------|-------|
| SiteHeader | GOOD | — |
| SiteFooter | GOOD | — |
| ResourceLibrary | GOOD | — |
| FilterBar | GOOD | — |
| FilterDrawer | GOOD | — |
| ContentCard | GOOD | — |
| HeroSection | GOOD | — |
| PopularFeaturedSection | GOOD | — |
| ScormEmbed | GOOD | — |
| CourseRightColumn | GOOD | — |
| GateForm | GOOD | — |
| **Pagination** | **NEEDS FIX** | Buttons are 32px tall — below 44px WCAG minimum |
| **PartnerLogoScroller** | **NEEDS FIX** | Fixed 140px logo width + 48px gap too large on mobile |
| **FilterSidebar** | **MINOR** | Checkboxes 14px — small but labels are tappable |
| CertificationsSection | GOOD | 2-col grid works at 375px |

---

### Task 1: Fix pagination touch targets

**Files:**
- Modify: `components/hub/Pagination.tsx`

Page number buttons are currently `px-3 py-2` (32px height). WCAG 2.1 AA requires 44x44px minimum touch targets. Increase vertical padding so buttons meet 44px on all screen sizes.

- [ ] **Step 1: Increase button padding and min-width**

In `Pagination.tsx`, make three changes:

1. Nav gap: change `gap-1` to `gap-1.5` (6px between buttons — easier to tap accurately)

2. Previous/Next buttons: change `px-3 py-2` to `px-3 py-3` (44px height)

3. Page number buttons: change `min-w-[2.5rem] rounded-sm px-3 py-2` to `min-w-[2.75rem] rounded-sm px-3 py-3` (44px height, 44px min-width)

4. Ellipsis spans: change `px-2 py-2` to `px-2 py-3` (consistent height)

- [ ] **Step 2: Verify visually**

Load the resource library with enough content for pagination. Buttons should be visibly taller and easy to tap on a phone simulator at 375px.

- [ ] **Step 3: Commit**

```bash
git add components/hub/Pagination.tsx
git commit -m "fix: increase pagination button size to meet 44px touch target minimum"
```

---

### Task 2: Fix partner logo scroller on mobile

**Files:**
- Modify: `components/hub/PartnerLogoScroller.tsx`

The logo container is fixed at `h-16 w-[140px]` with `gap-12` (48px). On a 375px screen this is too large. Add responsive sizing so logos and gaps are smaller on mobile, scaling up on larger screens.

- [ ] **Step 1: Add responsive classes to logo container and gap**

1. In the `PartnerLogo` component, change the container div from:
   `h-16 w-[140px]`
   to:
   `h-10 w-[100px] sm:h-14 sm:w-[120px] lg:h-16 lg:w-[140px]`

2. In the scrolling row div, change `gap-12` to `gap-6 sm:gap-8 lg:gap-12`

- [ ] **Step 2: Verify at mobile breakpoints**

Test the partner scroller at 375px, 390px, and 768px. Logos should be smaller on mobile with tighter spacing, and the marquee animation should still loop seamlessly.

- [ ] **Step 3: Commit**

```bash
git add components/hub/PartnerLogoScroller.tsx
git commit -m "fix: responsive partner logo sizing for mobile screens"
```

---

### Task 3: Increase filter sidebar checkbox size

**Files:**
- Modify: `components/hub/FilterSidebar.tsx`

Checkboxes are `h-3.5 w-3.5` (14px). While the full label row is tappable, the visually small checkbox can feel imprecise on touch. Increase to `h-4 w-4` (16px) — standard for mobile-friendly forms.

- [ ] **Step 1: Update checkbox dimensions**

In the `CheckboxOption` component, change the input from:
`h-3.5 w-3.5 accent-diligent-red`
to:
`h-4 w-4 accent-diligent-red`

- [ ] **Step 2: Commit**

```bash
git add components/hub/FilterSidebar.tsx
git commit -m "fix: increase filter checkbox size for better mobile usability"
```
