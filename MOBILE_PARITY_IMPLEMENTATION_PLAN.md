# Mobile Parity Implementation Plan - GROUP 2: RESERVATIONS

## Issue Assessment

### Bookings List Table (360px) - FAIL ✗
**Current Implementation:**
```jsx
<div style={{ gridTemplateColumns: "1.8fr 1.2fr 90px 70px 110px 90px", minWidth: "580px" }}>
```
- Fixed grid with 6 columns
- `minWidth: 580px` > 360px viewport → **HORIZONTAL SCROLL REQUIRED** ✗
- Desktop has: Guest | Date | Time | Covers | Status | Cancel button

**Required Fix:**
Convert to responsive card layout on mobile where each booking shows all columns vertically:
```
┌─────────────────────────────────────┐
│ Guest Name                          │
├─────────────────────────────────────┤
│ Date       | Time                   │
│ Covers: N  | Status: [Badge]        │
│ [Cancel]                            │
└─────────────────────────────────────┘
```

**Implementation approach:**
1. Create a `<BookingCard>` component for mobile (< 640px)
2. Create a `<BookingTableRow>` component for desktop (≥ 640px)
3. Use conditional rendering based on breakpoint via hidden responsive classes
4. Maintain all 6 data points per booking (no removal on mobile)

### Complexity Analysis
- Moderate: Need to refactor list rendering logic
- Risk: Must preserve exact same data; no columns hidden
- Benefit: Resolves critical horizontal-scroll issue for Reservations list

### Option A: Quick Fix (show/hide approach)
Use `hidden sm:table-cell` on columns to hide non-critical columns on mobile
- Risk: Hides data from user (violates parity requirement)
- Not acceptable per specification

### Option B: Full Card Layout (Recommended)
Implement proper card components for mobile with vertical stacking
- Ensures all data visible
- Better UX on small screens
- Matches specification requirement

---

## Booking Detail Drawer - Status Check
**Current Implementation (Line 136):**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```
- Responsive grid ✓
- All fields visible on mobile ✓
- Download buttons (line 176): `grid-cols-1 sm:grid-cols-2` ✓
- Status: PASS

---

## Decision Point

**Question:** Should I implement Option B (full card layout refactor for Bookings list)?

**Scope of work:**
- Refactor BookingDetailDrawer rendering logic (moderate)
- Add responsive table/card switching logic
- Preserve all data points
- Run tests: lint + build

**Estimated commits:**
1. Create BookingCard component
2. Implement responsive list rendering
3. Test and verify mobile parity

**Timeline:** 15-20 minutes if proceeding

---

## Next Groups (if completed)
3. CallLogs - Similar issue (table with `minWidth: "650px"`)
4. Dashboard - Similar issue (tables)
5. SetupRestaurant/SetupSuccess - Check responsive grids
6. Auth pages - Verify responsive layouts

---
