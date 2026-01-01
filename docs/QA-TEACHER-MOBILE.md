# Teacher Flow QA Checklist (Mobile First)

> [!IMPORTANT]
> **Device Constraint**: This checklist MUST be executed on a **Mobile Device** (iOS or Android). Browser simulation is acceptable for initial passes but final verification requires a real device.
> **Scope**: Teacher Lifecycle (Registration -> Onboarding -> Approval -> Readiness).

## 1. Registration Process
**Page**: `/register`
**Goal**: Validate strict entry requirements and role assignment.

### A) Business Logic & Enforced Limits
- [ ] **Role Selection**: Ensure "Teacher" (معلم) is selected.
    - *Incorrect*: Selecting "Parent" and trying to access teacher features.
- [ ] **Phone Number**: Try registering with an existing phone number.
    - *Expected*: Error "This number is already registered".
- [ ] **Mandatory Fields**: Try submitting with empty First Name or Last Name.
    - *Expected*: Client-side blocking or error message.

### B) Functional Correctness
- [ ] **Data Save**: Register a NEW user (e.g., `test_teacher_QA_[date]@test.com`).
- [ ] **Redirection**: After success, user MUST be redirected to `/teacher/onboarding` (or dashboard -> onboarding).
- [ ] **Token**: Verify JWT is stored (user remains logged in on refresh).

### C) Mobile UI/UX
- [ ] **Keyboard**: Does the keyboard push the content up correctly?
- [ ] **Country Code**: Is the country code selector (+249) easy to tap on mobile?
- [ ] **Visibility**: are password dots visible/hidden correctly?

> **[SCREENSHOT 1]**: Capture the Registration Form filled out just before tapping "Create Account".
> *Check*: No input fields are cut off. Submit button is visible.

---

## 2. Onboarding: Basic Information (Step 1)
**Page**: `/teacher/onboarding` (Wizard Step 1)
**Goal**: Verify profile completion requirements.

### A) Business Logic
- [ ] **Years of Experience**: Try entering negative numbers or > 50.
    - *Expected*: Validation error.
- [ ] **Bio**: Try entering a bio with < 50 characters (if enforcement exists in UI, otherwise check backend acceptance).
    - *Logic*: Bio determines teacher quality perception.
- [ ] **Gender**: Verify selection is mandatory.

### B) Functional Correctness
- [ ] **Save State**: Fill data, click "Next", then refresh page.
    - *Expected*: Data persists or user returns to Step 2 (if saved).
- [ ] **Draft Status**: Profile should exist in DB even if incomplete.

### C) Mobile UI/UX
- [ ] **Text Area**: Is the Bio text area easy to type in on mobile?
- [ ] **Scroll**: Can you scroll down to the "Next" button without issue?

> **[SCREENSHOT 2]**: Capture the "Basic Info" step with all fields filled.
> *Check*: Alignment of gender radio buttons.

---

## 3. Onboarding: Subjects & Pricing (Step 2)
**Page**: `/teacher/onboarding` (Wizard Step 2)
**Goal**: Validate the core "Product" definition of the teacher.

### A) Business Logic
- [ ] **Subject-Curriculum Link**: Select a Curriculum (e.g., "Sudanese"). Ensure only relevant Subjects appear.
- [ ] **Pricing Logic**:
    - Try entering 0 or negative price. (*Expected*: Blocked).
    - Try entering a massive price (e.g., 1,000,000). (*Expected*: Max price limit warning).
- [ ] **Grade Selection**:
    - Select a stage (e.g., "Secondary").
    - Ensure you MUST select at least one grade (e.g., "Grade 1").
    - *Logic*: A teacher cannot teach "Secondary" without specifying which grades.
- [ ] **Duplicate Check**: Try adding the SAME Subject + Curriculum twice.
    - *Expected*: Error "You already teach this subject".

### B) Functional Correctness
- [ ] **Add Operation**: Tap "Add" button.
    - *Expected*: Subject appears immediately in the list below.
    - *Verify*: Price is formatted correctly (e.g., "SDG").
- [ ] **Remove Operation**: Add a subject, then delete it.
    - *Expected*: Item removed from list.

### C) Mobile UI/UX
- [ ] **Complex Dropdowns**: Are the Curriculum/Subject dropdowns usable on small screens?
- [ ] **Collapsible Stages**: Tap the "Stage" arrow. Does it expand smoothly?
- [ ] **Grade Taps**: Are the grade "pills" or checkboxes easy to tap with a finger?
- [ ] **List View**: Does the list of added subjects stack nicely (no horizontal scroll)?

> **[SCREENSHOT 3]**: Capture the "Add Subject" form with the Grade selection Expanded.
> *Check*: Grade checkboxes are not too small.
> **[SCREENSHOT 4]**: Capture the list of valid added subjects.

---

## 4. Onboarding: Submission & Review (Step 3)
**Page**: `/teacher/onboarding` (Wizard Step 3)

### A) Business Logic
- [ ] **Prerequisites**: Try reaching Step 3 without adding ANY subjects.
    - *Expected*: "Next" button disabled on Step 2.
- [ ] **Status Transition**: Upon landing here, backend status should change to `SUBMITTED`.

### B) Functional Correctness
- [ ] **Confirmation UI**: Verify the "Success" message is shown.
- [ ] **Navigation**: Try to go "Back" to edit. Is it allowed?

> **[SCREENSHOT 5]**: The "Under Review" success screen.

---

## 5. Dashboard (Pending Approval State)
**Page**: `/teacher/dashboard` or `/teacher`
**Goal**: Verify "Locked" state behavior.

### A) Business Logic (Guard Rails)
- [ ] **Access Control**: Try navigating / clicking on "Wallet" or "Sessions".
    - *Expected*: Redirected to a "Locked" / "Under Review" page or blocked by `TeacherApprovalGuard`.
    - *Logic*: Unapproved teachers cannot see wallet or sessions.
- [ ] **Banner**: Is there a visible "Your application is under review" banner at the top?

### C) Mobile UI/UX
- [ ] **Banner Visibility**: Does the status banner take up too much screen space?
- [ ] **Empty States**: Do the stats show "0" or "-" correctly without crashing?

> **[SCREENSHOT 6]**: The Dashboard in "Pending" state showing the restriction banner.

---

## 6. Access Control & Restrictions (Guard Testing)
**Goal**: Ensure a non-approved teacher cannot bypass restrictions.

### Execute these links manually in browser address bar:
- [ ] `/teacher/wallet` -> **Blocked/Guard Screen**?
- [ ] `/teacher/sessions` -> **Blocked/Guard Screen**?
- [ ] `/teacher/settings` -> **Allowed**? (Should generally be allowed or specific parts locked).

---

## 7. Post-Approval & Readiness (Simulated)
*Note: You may need to manually approve the teacher in DB or Admin panel for this step.*

**Page**: `/teacher/dashboard` (Approved State)

### A) Business Logic
- [ ] **Status Change**: Dashboard should NO LONGER show "Under Review".
- [ ] **Availability Setup**:
    - Go to Availability page.
    - Add a slot (e.g., Monday 10:00 - 12:00).
    - Overlap Check: Try adding Monday 11:00 - 13:00. (*Expected*: Error).
- [ ] **Meeting Link**:
    - Add a meeting link (Zoom/Google Meet). (Required for discoverability in some flows).
    - Try a random URL (e.g., `amazon.com`). (*Expected*: Error - must be valid meeting domain).

### C) Mobile UI/UX
- [ ] **Time Pickers**: Are the start/end time inputs native mobile pickers or custom? Are they usable?
- [ ] **Slot Rendering**: Do the availability slots look good on mobile width?

> **[SCREENSHOT 7]**: Availability screen with populated slots.

---

## 8. General Mobile Usability & Improvement Detection

### User Flow
- [ ] **Confusing Steps**: Was any step unclear? (Note here).
- [ ] **Redundant Info**: Did we ask for the same thing twice?
- [ ] **Trust**: Did the app feel secure and professional?

### Performance
- [ ] **Load Times**: Did the Dashboard load stats instantly?
- [ ] **Transitions**: Was moving between Onboarding steps smooth?

### Improvement Opportunities (Tester Notes)
- [ ] *[Tester to write]*: __________________________________________________
- [ ] *[Tester to write]*: __________________________________________________

---

## Final Sign-off
**Tester Name**: __________________
**Device Model**: __________________
**OS Version**: __________________
**Date**: __________________
**Result**: [ ] PASS  [ ] FAIL (Blocker Found)
