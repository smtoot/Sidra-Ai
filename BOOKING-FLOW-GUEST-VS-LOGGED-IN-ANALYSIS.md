# Booking Flow: Guest vs Logged-In User Analysis & Multi-Step Redesign

**Date**: December 29, 2025
**Focus**: Compare guest browsing vs authenticated booking flows
**Goal**: Implement industry-standard multi-step booking with optimal UX for both user states

---

## 📊 EXECUTIVE SUMMARY

### Current State Problems
1. **Guest users get redirected to login TOO EARLY** - before seeing prices, availability, or booking options
2. **All booking steps shown in ONE modal** - overwhelming, especially on mobile
3. **No clear progress indication** - users don't know how many steps remain
4. **Different paths for single session vs package** - inconsistent experience
5. **Price transparency issues** - packages don't show clear savings calculation

### Recommended Solution
**Multi-step wizard with progressive disclosure:**
- Guests can browse through step 3 before login required
- Clear progress indicator (Step 1 of 5)
- Consistent flow for all booking types
- Price breakdown visible at every relevant step

---

## 🎯 INDUSTRY BEST PRACTICES RESEARCH

### Calendly Booking Flow
**Source**: [Calendly Redesign Case Study](https://www.aubergine.co/insights/ux-re-design-experiments-elevating-calendlys-one-on-one-event-type-feature)

**Key Learnings**:
- **Progressive disclosure**: Break complex forms into manageable chunks
- **Smart defaults**: Pre-select popular options (highlighted with "Best Value" labels)
- **Minimal forms**: Only collect information needed at each step
- **Clear labels**: Use simple field names (2-3 words max)
- **Visual hierarchy**: Recommended options prominently featured

### Multi-Step UX Patterns
**Sources**:
- [Progress Step UI Design Patterns](https://designmodo.com/progress-step-ui/)
- [Progress Trackers in UX Design](https://uxplanet.org/progress-trackers-in-ux-design-4319cef1c600)
- [Ecommerce Checkout UX Best Practices 2025](https://www.designstudiouiux.com/blog/ecommerce-checkout-ux-best-practices/)

**Key Principles**:
1. **Always show progress** - Users need to know: where they are, what's completed, what remains
2. **Label each step clearly** - 2-3 words max (e.g., "Subject", "Date & Time", "Review")
3. **Use visual indicators** - Checkmarks for completed steps, color coding for active/inactive
4. **Mobile-first** - Vertical stepper for mobile, horizontal for desktop
5. **Allow back navigation** - Users should be able to edit previous choices
6. **Show price early** - Transparency builds trust, unexpected fees kill conversions

### Booking Platforms Analysis
**Sources**:
- [Preply vs iTalki Comparison](https://happilyevertravels.com/preply-vs-italki/)
- [Preply Lesson Booking Settings](https://help.preply.com/en/articles/4175368-lesson-booking-settings)

**Preply Pattern**:
- Browse teacher profiles freely (no login)
- See prices and availability
- Login required ONLY at payment step
- Package-based pricing (minimum 6 lessons)

**iTalki Pattern**:
- Browse and filter teachers (no login)
- See detailed profiles and prices
- Login required to book
- Pay-as-you-go for single lessons

### General Booking UX Best Practices 2025
**Source**: [Booking UX Best Practices](https://ralabs.org/blog/booking-ux-best-practices/)

**Critical Points**:
- **Avoid overwhelming users** - Don't show all options at once
- **Price transparency** - Show breakdown BEFORE final step: `price × count - discount = total`
- **Inline validation** - Real-time feedback on errors
- **Sticky CTA** - Keep "Next" button visible
- **Mobile optimization** - 44px minimum tap targets, bottom sheets for selections

---

## 🔍 CURRENT IMPLEMENTATION AUDIT

### Current User States

#### 1. **Guest User** (Not Logged In)
**Current Behavior**:
```
1. Clicks "احجز الآن" (Book Now)
2. Modal opens
3. Sees subject selection
4. Sees booking type selector
5. BookingTypeSelectorV2 calls checkDemoEligibility() → 401
6. [FIXED] No longer redirects (our axios interceptor allows this)
7. Can browse booking options
8. Clicks "تأكيد الحجز" → Redirected to /login
```

**Issues**:
- ❌ Still asks to "select child" when guest has no children data
- ❌ Shows validation errors for fields guest can't fill
- ❌ No clear indication of "you can browse, but login required to book"
- ❌ All steps shown at once - overwhelming

#### 2. **Logged-In Student**
**Current Behavior**:
```
1. Clicks "احجز الآن"
2. Modal opens with all fields
3. Subject → Type → Date → Time → Notes → Submit
4. Validation on submit
5. Creates booking
```

**Issues**:
- ❌ All-in-one modal is long (requires scrolling on mobile)
- ❌ No progress indication
- ❌ Can't go back if you make a mistake early
- ❌ No review step before final submit

#### 3. **Logged-In Parent**
**Current Behavior**:
```
Same as student, but adds child selection dropdown
```

**Issues**:
- ❌ Same as student issues +
- ❌ Child selection appears AFTER booking type (should be earlier)
- ❌ Child dropdown is plain - no context about child (age, grade, etc.)

### Current Booking Paths

#### Path A: Single Session Booking
```
Steps in current modal:
1. Subject selection
2. Booking type (SINGLE)
3. Child selection (if parent)
4. Date selection (calendar)
5. Time slot selection
6. Optional notes
7. Submit
```

#### Path B: Package Booking (Existing Package)
```
Steps in current modal:
1. Subject selection
2. Booking type (PACKAGE - from existing)
3. Child selection (if parent)
4. Date selection
5. Time slot selection
6. Optional notes
7. Submit (uses package session)
```

#### Path C: Package Purchase + First Booking
```
Steps in current modal:
1. Subject selection
2. Booking type (PACKAGE - new purchase)
3. Recurring pattern (weekday + time)
4. Check availability
5. See suggested dates
6. Child selection (if parent)
7. Notes
8. Submit (purchases package + books first session)
```

**Issue**: Path C is VERY different from A & B, confusing users

---

## 💡 PROPOSED MULTI-STEP FLOW

### Design Philosophy
1. **Progressive disclosure** - Show only what's needed at each step
2. **Consistent structure** - Same steps for all booking types (with conditional fields)
3. **Guest-friendly** - Allow browsing up to step 3 before requiring login
4. **Clear progress** - Always show where user is in the flow
5. **Mobile-first** - Optimize for small screens

### Step Structure (5 Steps)

```
┌─────────────────────────────────────────────────────────┐
│  [1. Subject] → [2. Type] → [3. Schedule] → [4. Details] → [5. Review]  │
│      ✓            ○           ○              ○            ○     │
└─────────────────────────────────────────────────────────┘
```

---

### STEP 1: Choose Subject
**Shown to**: Everyone (guest + logged-in)

```
┌─────────────────────────────────────────┐
│ Step 1 of 5: اختر المادة                 │
├─────────────────────────────────────────┤
│                                         │
│ ○ Mathematics / رياضيات                 │
│   400 SDG per session                   │
│                                         │
│ ○ Physics / فيزياء                      │
│   450 SDG per session                   │
│                                         │
│ ○ Chemistry / كيمياء                    │
│   400 SDG per session                   │
│                                         │
│               [Next: Choose Type →]     │
└─────────────────────────────────────────┘
```

**Data Required**:
- `selectedSubject: string`

**Validation**:
- Must select one subject

**Guest Access**: ✅ Allowed

---

### STEP 2: Choose Booking Type
**Shown to**: Everyone (guest + logged-in)

```
┌──────────────────────────────────────────────────────────┐
│ Step 2 of 5: اختر نوع الحجز                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ⭐ RECOMMENDED                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ● باقة 10 حصص                                      │  │
│ │                                                    │  │
│ │   Original: 4,000 SDG                              │  │
│ │   Discount: -720 SDG (18%)                         │  │
│ │   ─────────────────────────                        │  │
│ │   Total: 3,280 SDG                                 │  │
│ │   💰 Save 720 SDG!                                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Show other options ▼                                     │
│                                                          │
│ [← Back]                    [Next: Choose Time →]        │
└──────────────────────────────────────────────────────────┘
```

**Expanded "Other options"**:
```
│ ○ حصة تجريبية (Demo)                                     │
│   30 minutes • FREE                                      │
│   ⚠️ Already used with this teacher                      │
│                                                          │
│ ○ حصة واحدة (Single)                                     │
│   60 minutes • 400 SDG                                   │
│                                                          │
│ ○ من باقتك الحالية                                       │
│   5 sessions remaining                                   │
│   No additional cost                                     │
│                                                          │
│ ○ باقة 5 حصص                                             │
│   Save 200 SDG (10%)                                     │
│   Total: 1,800 SDG                                       │
│                                                          │
│ ○ باقة 20 حصة                                            │
│   Save 1,600 SDG (20%)                                   │
│   Total: 6,400 SDG                                       │
```

**Data Required**:
- `selectedBookingType: 'DEMO' | 'SINGLE' | 'PACKAGE'`
- `selectedBookingOption: BookingTypeOption`

**Validation**:
- Must select one option
- If option disabled, show reason

**Guest Access**: ✅ Allowed

**Key Improvement**:
- Price breakdown shown IMMEDIATELY
- Savings calculation visible
- Recommended option highlighted
- Disabled options show reason

---

### STEP 3: Choose Schedule
**Shown to**: Everyone (guest + logged-in)

**Two Variants Based on Booking Type:**

#### Variant A: Single Session / Demo / Existing Package
```
┌──────────────────────────────────────────────────────────┐
│ Step 3 of 5: اختر الموعد                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────┐  ┌────────────────────────────┐ │
│ │   January 2025     ││  │  Available Times           │ │
│ │                     ││  │  Sunday, Jan 15            │ │
│ │  Su Mo Tu We Th ... ││  │                            │ │
│ │      1  2  3  4 ... ││  │  ○ 9:00 AM - 10:00 AM     │ │
│ │  5● 6  7  8● 9  ... ││  │  ● 3:00 PM - 4:00 PM      │ │
│ │  12 13●14 15 16 ... ││  │  ○ 7:00 PM - 8:00 PM      │ │
│ │  19 20 21 22 23 ... ││  │                            │ │
│ │                     ││  │  All times shown in       │ │
│ │  ● = Available      ││  │  your timezone (GMT+3)    │ │
│ │  ◌ = Fully booked   ││  │                            │ │
│ └─────────────────────┘  └────────────────────────────┘ │
│                                                          │
│ 📅 Quick select: Tomorrow at 3 PM →                      │
│                                                          │
│ [← Back]                    [Next: Your Info →]          │
└──────────────────────────────────────────────────────────┘
```

#### Variant B: New Package Purchase
```
┌──────────────────────────────────────────────────────────┐
│ Step 3 of 5: حدد النمط الأسبوعي                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Choose your weekly schedule:                             │
│                                                          │
│ Day of week:                                             │
│ ○ Sunday    ○ Monday   ○ Tuesday  ● Wednesday            │
│ ○ Thursday  ○ Friday   ○ Saturday                        │
│                                                          │
│ Time:                                                    │
│ ○ 9:00 AM   ○ 12:00 PM   ● 3:00 PM   ○ 6:00 PM          │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✓ This teacher is available                        │  │
│ │   Every Wednesday at 3:00 PM                       │  │
│ │                                                    │  │
│ │   Your first 10 sessions will be:                 │  │
│ │   • Jan 15, Jan 22, Jan 29                        │  │
│ │   • Feb 5, Feb 12, Feb 19, Feb 26                 │  │
│ │   • Mar 5, Mar 12, Mar 19                         │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [← Back]                    [Next: Your Info →]          │
└──────────────────────────────────────────────────────────┘
```

**Data Required**:
- **Single/Demo/Existing**: `selectedDate`, `selectedSlot`
- **New Package**: `recurringWeekday`, `recurringTime`, `suggestedDates[]`

**Validation**:
- **Single path**: Must select date AND time
- **Package path**: Must select weekday AND time, must verify availability

**Guest Access**: ✅ Allowed

**Key Improvements**:
- Calendar shows availability with dots
- "Quick select" for next available slot
- Timezone clearly indicated
- Package path shows PREVIEW of all sessions
- Real-time availability check

**🔑 CHECKPOINT**: After Step 3, guest must login to continue

---

### STEP 4: Your Details
**Shown to**: Logged-in users only

**For Parents**:
```
┌──────────────────────────────────────────────────────────┐
│ Step 4 of 5: معلومات الحجز                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔒 Login required - Redirected from guest flow           │
│                                                          │
│ This booking is for:                                     │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ● Ahmed (12 years old, Grade 7)                    │  │
│ │   📚 Currently studying: IGCSE                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ○ Fatima (15 years old, Grade 10)                       │
│   📚 Currently studying: Sudanese Curriculum             │
│                                                          │
│ ○ + Add new child                                        │
│                                                          │
│ Optional notes for teacher:                              │
│ ┌────────────────────────────────────────────────────┐  │
│ │                                                    │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [← Back]                    [Next: Review Booking →]     │
└──────────────────────────────────────────────────────────┘
```

**For Students**:
```
┌──────────────────────────────────────────────────────────┐
│ Step 4 of 5: معلومات الحجز                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ This booking is for: You (Ahmed, Grade 12)              │
│                                                          │
│ Optional notes for teacher:                              │
│ ┌────────────────────────────────────────────────────┐  │
│ │ I need help with calculus derivatives              │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [← Back]                    [Next: Review Booking →]     │
└──────────────────────────────────────────────────────────┘
```

**Data Required**:
- `selectedChildId` (if parent)
- `bookingNotes` (optional)

**Validation**:
- Parents MUST select child
- Notes optional

**Guest Access**: ❌ Login required (redirected to login with state saved)

**State Preservation**:
```typescript
// Save to localStorage before redirect
const bookingState = {
  teacherId,
  teacherName,
  selectedSubject,
  selectedDate,
  selectedSlot,
  selectedBookingType,
  selectedBookingOption,
  recurringWeekday,
  recurringTime,
  suggestedDates,
  returnUrl: window.location.pathname
};
localStorage.setItem('pendingBooking', JSON.stringify(bookingState));
```

---

### STEP 5: Review & Confirm
**Shown to**: Logged-in users only

```
┌──────────────────────────────────────────────────────────┐
│ Step 5 of 5: مراجعة الحجز                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📋 Booking Summary                                 │  │
│ │                                                    │  │
│ │ Teacher: Ahmad Ali                    [Edit]      │  │
│ │ Subject: Mathematics                  [Edit]      │  │
│ │ Type: Package (10 sessions)           [Edit]      │  │
│ │ Student: Ahmed (12 years)             [Edit]      │  │
│ │                                                    │  │
│ │ Schedule:                              [Edit]      │  │
│ │ Every Wednesday at 3:00 PM                        │  │
│ │ Starting: Jan 15, 2025                            │  │
│ │                                                    │  │
│ │ ─────────────────────────────────────            │  │
│ │                                                    │  │
│ │ Price Breakdown:                                   │  │
│ │ 10 sessions × 400 SDG     = 4,000 SDG             │  │
│ │ Package discount (18%)    = -720 SDG              │  │
│ │ ═══════════════════════════════════              │  │
│ │ Total to Pay              = 3,280 SDG  💰         │  │
│ │                                                    │  │
│ │ ℹ️ First session will be Jan 15 at 3 PM           │  │
│ │ ℹ️ Teacher will confirm within 24 hours           │  │
│ │ ℹ️ Payment required after teacher approval        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [ ] I agree to the booking terms                        │
│                                                          │
│ [← Back]              [Confirm Booking ✓]               │
└──────────────────────────────────────────────────────────┘
```

**For Single Session**:
```
│ Schedule:                              [Edit]      │  │
│ Sunday, January 15, 2025                          │  │
│ 3:00 PM - 4:00 PM (your time)                     │  │
│                                                    │  │
│ Price: 400 SDG                                     │  │
```

**Data Required**:
- All previous step data (read-only summary)
- Terms acceptance checkbox

**Validation**:
- Must accept terms

**Key Features**:
- **Edit links** - Can go back to any previous step
- **Clear price breakdown** - No surprises
- **Important notices** - Set expectations
- **One-click submit** - Friction removed at final step

---

## 🎨 VISUAL DESIGN ELEMENTS

### Progress Indicator Component

**Desktop (Horizontal)**:
```tsx
<div className="flex items-center justify-between mb-8">
  {steps.map((step, idx) => (
    <div key={idx} className="flex items-center">
      <div className={cn(
        "flex items-center gap-2",
        idx < currentStep && "text-green-600",
        idx === currentStep && "text-primary",
        idx > currentStep && "text-gray-400"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          idx < currentStep && "bg-green-600 text-white",
          idx === currentStep && "bg-primary text-white",
          idx > currentStep && "bg-gray-200 text-gray-400"
        )}>
          {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
        </div>
        <span className="text-sm font-medium">{step.label}</span>
      </div>
      {idx < steps.length - 1 && (
        <div className={cn(
          "h-0.5 w-16 mx-2",
          idx < currentStep ? "bg-green-600" : "bg-gray-200"
        )} />
      )}
    </div>
  ))}
</div>
```

**Mobile (Vertical - Compact)**:
```tsx
<div className="text-center mb-4">
  <p className="text-sm text-gray-600">
    Step {currentStep + 1} of {steps.length}
  </p>
  <h3 className="text-lg font-bold text-gray-900">
    {steps[currentStep].label}
  </h3>
  <div className="flex gap-1 justify-center mt-2">
    {steps.map((_, idx) => (
      <div key={idx} className={cn(
        "h-1 flex-1 rounded-full",
        idx <= currentStep ? "bg-primary" : "bg-gray-200"
      )} />
    ))}
  </div>
</div>
```

### Guest Info Banner (Steps 1-3)

```tsx
{!user && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
    <div className="flex items-start gap-3">
      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-blue-900 text-sm mb-1">
          تصفح بحرية، سجّل دخول للحجز
        </p>
        <p className="text-xs text-blue-700">
          يمكنك استكشاف الأسعار والمواعيد المتاحة. تسجيل الدخول مطلوب فقط عند إتمام الحجز.
        </p>
      </div>
    </div>
  </div>
)}
```

### Login Required Checkpoint (Before Step 4)

```tsx
{currentStep === 3 && !user && (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
      <Lock className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">
      تسجيل الدخول للمتابعة
    </h3>
    <p className="text-gray-600 mb-6">
      لإتمام الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد
    </p>
    <div className="flex flex-col gap-3 max-w-sm mx-auto">
      <button
        onClick={handleLoginRedirect}
        className="btn-primary"
      >
        تسجيل الدخول
      </button>
      <button
        onClick={handleRegisterRedirect}
        className="btn-outline"
      >
        إنشاء حساب جديد
      </button>
    </div>
    <p className="text-xs text-gray-500 mt-4">
      ✓ سيتم حفظ اختياراتك
    </p>
  </div>
)}
```

---

## 🔄 STATE MANAGEMENT ARCHITECTURE

### Step Navigation State

```typescript
interface BookingFlowState {
  // Meta
  currentStep: number;
  completedSteps: number[];
  isGuest: boolean;

  // Step 1: Subject
  selectedSubject: string | null;

  // Step 2: Type
  selectedBookingType: BookingType | null;
  selectedBookingOption: BookingTypeOption | null;

  // Step 3: Schedule
  selectedDate: Date | null;
  selectedSlot: SlotWithTimezone | null;
  recurringWeekday: string | null;
  recurringTime: string | null;
  suggestedDates: Date[];

  // Step 4: Details
  selectedChildId: string | null;
  bookingNotes: string;

  // Step 5: Review
  termsAccepted: boolean;
}

// Step configuration
const steps = [
  { id: 0, label: 'اختر المادة', requiredFields: ['selectedSubject'], guestAllowed: true },
  { id: 1, label: 'نوع الحجز', requiredFields: ['selectedBookingType', 'selectedBookingOption'], guestAllowed: true },
  { id: 2, label: 'الموعد', requiredFields: ['selectedDate', 'selectedSlot'], guestAllowed: true },
  { id: 3, label: 'معلوماتك', requiredFields: ['selectedChildId?', 'bookingNotes?'], guestAllowed: false },
  { id: 4, label: 'المراجعة', requiredFields: ['termsAccepted'], guestAllowed: false }
];
```

### Navigation Logic

```typescript
const canGoToStep = (targetStep: number): boolean => {
  // Can't skip ahead if not logged in
  if (isGuest && targetStep >= 3) return false;

  // Can't skip ahead if previous steps incomplete
  for (let i = 0; i < targetStep; i++) {
    if (!isStepComplete(i)) return false;
  }

  return true;
};

const isStepComplete = (stepIndex: number): boolean => {
  const step = steps[stepIndex];

  // Check all required fields are filled
  return step.requiredFields.every(field => {
    // Optional fields (marked with ?)
    if (field.endsWith('?')) {
      return true;
    }

    // Required fields
    const value = state[field as keyof BookingFlowState];
    return value !== null && value !== undefined && value !== '';
  });
};

const goToNextStep = () => {
  // Validate current step
  if (!isStepComplete(currentStep)) {
    showValidationErrors();
    return;
  }

  // Check if login required
  if (isGuest && currentStep === 2) {
    saveStateAndRedirectToLogin();
    return;
  }

  // Advance to next step
  setCurrentStep(currentStep + 1);
  setCompletedSteps([...completedSteps, currentStep]);
};

const goToStep = (targetStep: number) => {
  if (!canGoToStep(targetStep)) return;
  setCurrentStep(targetStep);
};
```

### State Persistence

```typescript
// Save on every change (debounced)
useEffect(() => {
  const saveTimer = setTimeout(() => {
    if (isGuest) {
      // Save to localStorage for guests
      localStorage.setItem('pendingBooking', JSON.stringify({
        ...state,
        teacherId,
        teacherName,
        timestamp: Date.now()
      }));
    }
  }, 500);

  return () => clearTimeout(saveTimer);
}, [state]);

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem('pendingBooking');
  if (saved) {
    try {
      const data = JSON.parse(saved);

      // Check if not expired (24 hours)
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        setState(data);
        toast.success('تم استعادة اختياراتك السابقة');
      } else {
        localStorage.removeItem('pendingBooking');
      }
    } catch (err) {
      console.error('Failed to restore booking state', err);
    }
  }
}, []);
```

---

## 📱 MOBILE OPTIMIZATIONS

### Bottom Sheet for Steps on Mobile

```tsx
<div className={cn(
  "fixed inset-0 z-50 bg-black/50",
  isOpen ? "block" : "hidden"
)}>
  <div className={cn(
    "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl",
    "max-h-[90vh] overflow-y-auto",
    "transition-transform duration-300",
    isOpen ? "translate-y-0" : "translate-y-full"
  )}>
    {/* Drag handle */}
    <div className="sticky top-0 bg-white pt-4 pb-2 border-b z-10">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
      <ProgressIndicator currentStep={currentStep} />
    </div>

    {/* Step content */}
    <div className="p-4 pb-safe">
      {renderCurrentStep()}
    </div>

    {/* Sticky navigation */}
    <div className="sticky bottom-0 bg-white border-t p-4 pb-safe">
      <div className="flex gap-2">
        {currentStep > 0 && (
          <button onClick={goToPreviousStep} className="btn-outline flex-1">
            ← رجوع
          </button>
        )}
        <button
          onClick={goToNextStep}
          disabled={!isStepComplete(currentStep)}
          className="btn-primary flex-1"
        >
          {currentStep === steps.length - 1 ? 'تأكيد الحجز ✓' : 'التالي →'}
        </button>
      </div>
    </div>
  </div>
</div>
```

### Swipe Gestures (Optional Enhancement)

```typescript
const { handlers } = useSwipeable({
  onSwipedLeft: () => canGoToStep(currentStep + 1) && goToNextStep(),
  onSwipedRight: () => currentStep > 0 && goToPreviousStep(),
  trackMouse: false
});

<div {...handlers}>
  {renderCurrentStep()}
</div>
```

---

## 🧪 COMPARISON TABLE: CURRENT vs PROPOSED

| Aspect | Current (Single Modal) | Proposed (Multi-Step) |
|--------|------------------------|----------------------|
| **Guest Experience** | Redirects early (bad) | Browse 3 steps freely ✓ |
| **Mobile UX** | Long scroll, hidden CTA | One screen per step ✓ |
| **Progress Clarity** | None | Step 1 of 5 ✓ |
| **Back Navigation** | Browser back only | Built-in step nav ✓ |
| **Price Transparency** | Final price only | Breakdown at step 2 ✓ |
| **Validation** | All at submit | Per-step validation ✓ |
| **State Persistence** | Lost on close | Auto-saved ✓ |
| **Single vs Package** | Very different flows | Unified experience ✓ |
| **Child Selection** | After booking type | Before schedule ✓ |
| **Review Before Submit** | None | Full summary step ✓ |

---

## 🎯 IMPLEMENTATION PRIORITIES

### Phase 1: Core Multi-Step Structure (Week 1)
- [ ] Create step configuration and state management
- [ ] Build progress indicator component
- [ ] Implement step navigation (next/back)
- [ ] Add guest checkpoint at step 3→4
- [ ] Implement state persistence to localStorage

**Complexity**: High
**Impact**: Very High
**Estimated**: 3-4 days

### Phase 2: Redesign Each Step (Week 2)
- [ ] Step 1: Subject selector (radio buttons with prices)
- [ ] Step 2: Booking type with price breakdown
- [ ] Step 3a: Calendar with availability dots
- [ ] Step 3b: Recurring pattern selector
- [ ] Step 4: Child selection + notes
- [ ] Step 5: Review & summary

**Complexity**: Medium
**Impact**: Very High
**Estimated**: 4-5 days

### Phase 3: Mobile Optimization (Week 3)
- [ ] Convert to bottom sheet on mobile
- [ ] Sticky navigation buttons
- [ ] Touch-friendly tap targets (44px min)
- [ ] Swipe gestures (optional)

**Complexity**: Medium
**Impact**: High
**Estimated**: 2-3 days

### Phase 4: Polish & Testing (Week 4)
- [ ] Loading states for each step
- [ ] Error handling and recovery
- [ ] Accessibility (keyboard nav, screen readers)
- [ ] Analytics tracking per step
- [ ] A/B test against current flow

**Complexity**: Low
**Impact**: Medium
**Estimated**: 2-3 days

---

## 📊 SUCCESS METRICS

Track these metrics before and after implementation:

### Conversion Metrics
- **Booking completion rate**: % of modal opens that result in booking
  - Current baseline: ?
  - Target: +25%
- **Step-by-step drop-off**: Where do users abandon?
  - Identify problem steps
  - Target: <10% drop at any single step
- **Guest-to-registered conversion**: % of guests who complete signup
  - Target: >60%

### UX Metrics
- **Time to complete booking**: Average seconds from modal open to submit
  - Current: ?
  - Target: -20% (faster despite more steps)
- **Step back-navigation usage**: How often do users go back to edit?
  - Healthy range: 15-25%
- **Mobile vs Desktop completion**: Ensure mobile doesn't lag
  - Target: Mobile ≥ 95% of desktop rate

### Error Metrics
- **Validation errors per booking**: How many times user hits validation
  - Current: ?
  - Target: -40% (per-step validation catches early)
- **Booking failures**: Technical errors during submit
  - Target: <1%

---

## 🚀 DEPLOYMENT STRATEGY

### Gradual Rollout
1. **Week 1**: Deploy to staging, internal testing
2. **Week 2**: A/B test with 10% of users
3. **Week 3**: Expand to 50% if metrics positive
4. **Week 4**: Full rollout or rollback if issues

### Feature Flag Setup
```typescript
const isMultiStepBookingEnabled = () => {
  // Check feature flag
  const flag = localStorage.getItem('feature_multistep_booking');
  if (flag === 'true') return true;
  if (flag === 'false') return false;

  // Random A/B test assignment
  const variant = Math.random();
  return variant < 0.5; // 50% split
};

// In component
{isMultiStepBookingEnabled() ? (
  <MultiStepBookingModal {...props} />
) : (
  <CreateBookingModal {...props} />
)}
```

### Rollback Plan
If any of these occur, rollback immediately:
- Booking completion rate drops >10%
- Technical error rate >3%
- Mobile completion drops >15%
- User complaints spike

---

## 🎨 UI/UX CHECKLIST

### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces step changes
- [ ] Focus management (trap in modal)
- [ ] Color contrast ≥ 4.5:1
- [ ] Error messages announced to screen readers
- [ ] Touch targets ≥ 44×44px

### Performance
- [ ] Modal opens in <200ms
- [ ] Step transitions smooth (<100ms)
- [ ] Availability check <500ms
- [ ] No layout shift when loading
- [ ] Images lazy loaded
- [ ] Code split per step (load on demand)

### Edge Cases
- [ ] Handle no children (parents)
- [ ] Handle no available slots
- [ ] Handle network errors
- [ ] Handle session timeout
- [ ] Handle browser back button
- [ ] Handle modal close mid-flow (save state)
- [ ] Handle expired saved state (24h)

---

## 📝 SOURCES & REFERENCES

### Industry Research
- [Calendly Redesign Case Study - Elevating User Experience](https://www.aubergine.co/insights/ux-re-design-experiments-elevating-calendlys-one-on-one-event-type-feature)
- [Booking UX Best Practices to Boost Conversions in 2025](https://ralabs.org/blog/booking-ux-best-practices/)
- [Progress Step UI Design Patterns](https://designmodo.com/progress-step-ui/)
- [How to Design Better Progress Trackers](https://www.uxpin.com/studio/blog/design-progress-trackers/)
- [Progress Indicator UI Design Best Practices](https://mobbin.com/glossary/progress-indicator)
- [32 Stepper UI Examples and What Makes Them Work](https://www.eleken.co/blog-posts/stepper-ui-examples)
- [15 Ecommerce Checkout & Cart UX Best Practices for 2025](https://www.designstudiouiux.com/blog/ecommerce-checkout-ux-best-practices/)
- [Progress Trackers in UX Design](https://uxplanet.org/progress-trackers-in-ux-design-4319cef1c600)
- [Preply vs iTalki: Language Tutor Comparison](https://happilyevertravels.com/preply-vs-italki/)
- [Preply Lesson Booking Settings](https://help.preply.com/en/articles/4175368-lesson-booking-settings)

---

## ✅ FINAL RECOMMENDATIONS

### Immediate Actions (This Week)
1. **Approve multi-step approach** - Get stakeholder buy-in
2. **Create UI mockups** - Design each step in Figma/design tool
3. **Set up A/B testing** - Prepare infrastructure for gradual rollout

### Implementation Strategy
1. **Start with Phase 1** - Build core step structure
2. **Test early and often** - Don't wait for perfection
3. **Measure everything** - Track all metrics from day 1
4. **Iterate based on data** - Be ready to adjust based on user behavior

### Key Success Factors
- ✅ **Guest-friendly until step 4** - Maximize browsing before login gate
- ✅ **Clear progress at all times** - Users never lost or confused
- ✅ **Price transparency** - Show breakdown early, no surprises
- ✅ **Mobile-first design** - Most users on mobile
- ✅ **State persistence** - Never lose user's work

---

**End of Analysis**

*Next Steps: Review with team → Design mockups → Begin Phase 1 implementation*
