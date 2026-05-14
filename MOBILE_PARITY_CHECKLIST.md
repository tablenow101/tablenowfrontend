# Mobile Parity Checklist

**Objective**: Every element visible on desktop must be visible and functional on 360px mobile viewport.

---

## GROUP 1: SETTINGS (Priority)

### Settings.General Tab
**Desktop Elements:**
- Title: "Paramètres"
- Tabs navigation: General | Hours & Services | Integrations | Referral
- Card 1 "Restaurant Info":
  - Input: Restaurant name
  - Input: Owner name
  - Input: Public phone (with hint)
  - Input: Cuisine type
  - Input: Address
  - Input: Confirmation email
  - Input: Website
- Card 2 "Cancellation Policy":
  - Textarea: Policy text (with hint)
- Card 3 "Notes & Specialities":
  - Textarea: AI notes (with hint)
- Card 4 "System Identifiers" (read-only):
  - Display: BCC address (copy-able)
  - Display: Assistant ID (copy-able)
- Button: Save (appears when form is dirty)
- Button: Cancel (appears when form is dirty)

**Responsive Issues on 360px:**
- [ ] Cards maintain padding and readability (p-6 = 24px, leaves ~312px content width)
- [ ] Grid cols 1-2 (lines 100, 111, 119): Verify they use `sm:grid-cols-2` NOT `grid-cols-2`
- [ ] Inputs are full-width and readable
- [ ] Save/Cancel buttons stack vertically or are side-by-side with proper spacing
- [ ] Labels above inputs (not inline)

### Settings.Hours & Services Tab (CRITICAL)
**Desktop Elements:**
- 7 day rows (Mon-Sun), each with:
  - Checkbox (enabled/disabled state)
  - Day name label
  - For ENABLED days:
    - Service list (each service):
      - Label: Service name (Lunch, Dinner, etc.)
      - Input: Start time (time picker)
      - Input: End time (time picker)
      - Input: Covers (number)
      - Button: Delete (×) - on all services
      - Button: Add service (+) - only on last service
  - For DISABLED days:
    - Text: "Closed"
    - Checkbox to enable
- Save/Cancel buttons at bottom

**Responsive Issues on 360px (CRITICAL - Already partially fixed):**
- [x] Service inputs use `flex-col sm:flex-row` (line 119) - ALREADY FIXED
- [ ] Time inputs (76px wide each) + covers (56px) + delete button + add button = 332px minimum
- [ ] On 360px with padding = 328px available - MARGINAL FIT
- [ ] Verify day header (checkbox + label) doesn't overflow
- [ ] All service rows are fully visible without horizontal scroll

### Settings.Integrations Tab
**Desktop Elements:**
- Card 1 "Google Calendar":
  - Icon + Title
  - Status badge (CONNECTED or NOT CONNECTED)
  - Description text
  - Button: Connect (when disconnected) OR Disconnect (when connected)
- Card 2 "How It Works":
  - 4-step numbered list
  - Each step: number circle + text description
- Card 3 "Notification Preferences":
  - 3 toggle rows (each with label + description + toggle switch)
  - Buttons: Cancel, Save (when dirty)

**Responsive Issues on 360px:**
- [ ] Icon + title + status badge (line 32-40): Verify flex layout doesn't overflow
  - "Google Calendar" + "CONNECTED" badge on single line on 360px?
  - If not, status badge should wrap below or condense
- [ ] 4-step list items: Each has number circle (24px) + text
  - Text should wrap naturally
- [ ] Toggle rows (line 45): Flex justify-between should not compress toggle button
  - Label + description on left, toggle on right
  - On 360px: ensure toggle doesn't disappear
- [ ] Buttons (Cancel/Save) stack vertically or fit side-by-side

### Settings.Referral Tab
**Desktop Elements:**
- Title section with program info
- "Your Referral Code" display (copy-able)
- Share link button
- "Active Referrals" table (or card layout):
  - Columns: Restaurant name | Status (Pending/Active) | Minutes earned
- "Referral History" section (if applicable)

**Responsive Issues on 360px:**
- [ ] Code display is readable (no text cut-off)
- [ ] Share button full-width or properly sized
- [ ] Referrals table converts to card layout for mobile
  - Each referral is a card showing all info
  - No horizontal scroll required

---

## GROUP 2: RESERVATIONS

### Reservations List Page
**Desktop Elements:**
- Title: "Reservations"
- Subtitle text
- Date filter tabs: All | Today | ...
- Stat cards (4 columns): Total | Confirmed | Tables secured | Slots freed
- Results table (6+ columns):
  - Checkbox (select)
  - Guest name
  - Date + Time
  - Party size
  - Table status
  - Action button (view details)
- Empty state text

**Responsive Issues on 360px:**
- [ ] Tabs: "All", "Today", etc. - don't overflow
- [ ] Stat cards (4 cols): Convert to 2-2 or 1-column stack
  - Line 202: Verify `grid-cols-2 sm:grid-cols-4`
- [ ] Table → Card layout:
  - Each reservation is a card with all columns
  - No horizontal scroll

### Reservation Detail Drawer
**Desktop Elements:**
- Header: Guest name + close button
- Meta card (3 cols):
  - Status + color badge
  - Time
  - Party size
- Associated call info (if exists)
  - Call status + duration
  - Transcript preview
- Notes section
- Buttons: Download transcript, Cancel reservation
- Modal download buttons (2 cols on desktop)

**Responsive Issues on 360px:**
- [ ] Meta card: 3 columns → 1-column stack on 360px
  - Line not yet checked: verify responsive grid
- [ ] Associated call: readable without horizontal scroll
- [ ] Download buttons (line 176): Already fixed with `grid-cols-1 sm:grid-cols-2` ✓
- [ ] Cancel button: full-width or properly sized

---

## GROUP 3: CALLS

### Call Logs List Page
**Desktop Elements:**
- Title: "Call Logs"
- Subtitle text
- Stat cards (4 columns):
  - Total calls received
  - Completed calls
  - Avg duration
  - Total duration
- Call history table (6+ columns):
  - Status dot
  - Caller number (monospace)
  - Status badge
  - Timestamp
  - Duration
  - Reservation tag (if booked)
  - Listen button
- Empty state

**Responsive Issues on 360px:**
- [ ] Stat cards: 4 → 2-2 or 1-column stack
  - Line 202: Verify `grid-cols-2 sm:grid-cols-4`
- [ ] Table → Card layout:
  - Each call is a card with all columns (status, number, timestamp, duration, actions)
  - No horizontal scroll

### Call Detail Drawer
**Desktop Elements:**
- Header: Caller info + close button
- Meta card (3 cols):
  - Status + color dot
  - Duration
  - Date/Time
- Reservation tag (if applicable)
- Audio recording section:
  - Audio player
  - Download button
- Transcript section:
  - Transcript text preview
  - Download button

**Responsive Issues on 360px:**
- [ ] Meta card: 3 columns → 1-column stack
  - Line 73: Verify `grid-cols-1 sm:grid-cols-3`
- [ ] Audio player: responsive width
- [ ] Transcript: full-width, readable
- [ ] Download buttons: full-width or stacked

---

## GROUP 4: DASHBOARD

### Dashboard Page
**Desktop Elements:**
- Greeting + hero subtitle
- Date filter tabs: Today | 7 days | 30 days | All
- Stat section (4 cards):
  - Calls handled
  - Reservations
  - Covers
  - Conversion rate
- Analysis section (4 cards):
  - Occupancy rate
  - Lowest slot
  - Unplaced requests
  - Abandoned calls
  - Best slot to promote
- Recent calls (table, 7 columns):
  - Dot + number
  - Guest name (if known)
  - Status
  - Timestamp
  - Duration
  - Reservation tag
  - Listen button
- Upcoming reservations (table, 5 columns):
  - Guest name
  - Date/Time
  - Party size
  - Status
  - Action
- "See all" links

**Responsive Issues on 360px:**
- [ ] Date tabs: don't overflow
  - Lines 150-155: Not yet checked for responsive wrapping
- [ ] Stat cards (4): Convert to 2-2 grid or 1-column
  - Line 260: Verify `grid-cols-2 sm:grid-cols-4`
- [ ] Analysis section: Verify responsive grid
- [ ] Recent calls table → Card layout
  - Each call is a card (number, status, time, duration, reservation tag, action)
- [ ] Upcoming reservations table → Card layout
  - Each reservation is a card (name, date/time, party size, status, action)

---

## GROUP 5: SETUP PAGES

### Setup/Restaurant Page
**Desktop Elements:**
- Progress indicator (multi-step form visual)
- Current step title
- Step content (varies by step):
  - Step 1: Restaurant search + prefill
  - Step 2: Business hours
  - Step 3: Confirmation page
- Navigation buttons: Previous | Next/Create

**Responsive Issues on 360px:**
- [ ] Progress visual: readable on 360px
- [ ] Form inputs: full-width, stacked
- [ ] Buttons: full-width or stacked
- [ ] Hours grid: Verify responsive layout
  - Lines 320, 381, 402: Verify `grid-cols-1 sm:grid-cols-...`

### Setup/Success Page
**Desktop Elements:**
- Success icon + title
- AI phone number display
- Buttons: Call to test + Copy number
- Call forwarding instructions (2 columns on desktop):
  - iPhone steps (4 numbered steps)
  - Android steps (4 numbered steps)
- CTA button: Go to dashboard

**Responsive Issues on 360px:**
- [ ] Title + phone number: centered, readable
- [ ] Test call + Copy buttons: 2 cols → 1-column stack
  - Line 107: Verify `flex-col sm:flex-row`
- [ ] Call forwarding sections: 2 cols → 1-column stack
  - Line 149: Verify `grid-cols-1 md:grid-cols-2`
- [ ] CTA button: full-width or centered

---

## GROUP 6: PUBLIC AUTH PAGES

### Login Page
**Desktop Elements:**
- Logo + tagline
- Card with top border:
  - Title + subtitle
  - Error message (if any)
  - Email input
  - Password input
  - Remember me checkbox + Forgot password link
  - Sign in button
  - Divider
  - Google sign-in button
  - Create account link
- Alternative: Forgot password view with back button + form

**Responsive Issues on 360px:**
- [ ] Logo: centered, readable
- [ ] Card (max-w-lg): Check padding
  - Line 129: `p-10` = 40px padding on 360px = 280px content width
  - Need to reduce padding on mobile?
- [ ] Inputs: full-width
- [ ] Remember me + forgot link: flex justify-between doesn't compress
- [ ] Buttons: full-width

### Register Page
**Desktop Elements:**
- Logo + tagline
- Large card (max-w-2xl):
  - Title + subtitle
  - Selected plan indicator (if applicable)
  - Google Places search input + suggestions
  - Divider
  - Owner name input
  - Email input
  - Password + confirm inputs (2 cols on desktop)
  - Phone + cuisine type inputs (2 cols on desktop)
  - Create account button
- Success view (if email sent)

**Responsive Issues on 360px:**
- [ ] Card (max-w-2xl): Check padding
  - Line 256: `p-12` = 48px on 360px = 264px content width
  - Likely too tight; may need responsive padding
- [ ] Google Places search: full-width
- [ ] Inputs: full-width
- [ ] 2-col grids (lines 379, 429): Verify `grid-cols-1 sm:grid-cols-2`
  - Already checked: should be OK
- [ ] Password inputs with eye icons: don't overflow
- [ ] Buttons: full-width

### Verify Email Page
**Desktop Elements:**
- Logo
- Card:
  - Icon (loader | checkmark | error)
  - Title (Verifying... | Verified | Failed)
  - Subtitle message
  - Back to login button (if error)

**Responsive Issues on 360px:**
- [ ] Card (max-w-md): responsive
  - Line 52: `max-w-md` = 28rem = 448px (larger than 360px but with padding should work)
- [ ] Icon centered
- [ ] Text readable
- [ ] Button: full-width or centered

---

## VERIFICATION RULES

For each page, before marking PASS:
1. Count all interactive elements on desktop (inputs, buttons, selects, toggles)
2. Verify each element is present on 360px viewport
3. Verify no horizontal scroll required
4. Verify no text cut-off
5. Verify all buttons are clickable (not hidden behind other elements)
6. Verify all form fields are visible (not collapsed behind accordions)

FAIL conditions:
- Missing element on 360px that exists on desktop
- Horizontal scroll required
- Text truncation without overflow handling
- Button hidden or unreachable

---

## Implementation Order (by group)

1. **Settings** (all 4 tabs) - IN PROGRESS
   - [ ] General tab responsive layout
   - [ ] Hours & Services tab (already partially fixed, verify all elements)
   - [ ] Integrations tab responsive layout
   - [ ] Referral tab responsive layout

2. **Reservations** (list + detail)
3. **Calls** (list + detail)
4. **Dashboard**
5. **Setup** (restaurant + success)
6. **Auth pages** (login, register, verify email)

---
