# Offline/In-Home Teaching Feature - Implementation Plan

## Executive Summary

This plan outlines the implementation of an offline teaching feature that enables teachers to offer in-home tutoring services. Students and parents will be able to search for teachers by city/location and book sessions at their home address instead of online meetings.

**Core Capabilities:**
- Teachers can specify cities they serve and their service radius
- Teachers can offer online-only, in-home-only, or hybrid (both) teaching modes
- Students/parents can search for teachers by city and teaching mode
- Booking flow supports address collection for in-home sessions
- Different pricing structure for in-home vs online sessions
- Location verification and safety features for in-home teaching

---

## Current System Analysis

### What Already Exists
✅ **Location Data**: Teachers already have `city` and `country` fields in their profiles
✅ **Timezone Handling**: System properly handles timezones for availability
✅ **Availability System**: Weekly recurring schedules with exceptions
✅ **KYC Verification**: Teachers are verified with ID, qualifications
✅ **Session Proof**: `sessionProofUrl` field exists for completion verification
✅ **Flexible Pricing**: Per-subject, per-curriculum pricing already supported
✅ **Approval Workflow**: Teacher verification and session approval flows in place

### What Needs to Be Built
❌ Teaching mode selection (online vs in-home vs hybrid)
❌ City-based search and filtering
❌ Service radius and location matching
❌ Address collection during booking
❌ In-home specific pricing
❌ Location verification for in-home sessions
❌ Enhanced safety features for in-home teaching

---

## Implementation Phases

### Phase 1: Core Offline Teaching (MVP)
**Goal**: Enable basic city-based search and in-home bookings

#### 1.1 Database Schema Changes

**File**: `packages/database/prisma/schema.prisma`

**Modify `teacher_profiles` table** (line 626):
```prisma
model teacher_profiles {
  // ... existing fields ...

  // NEW FIELDS FOR OFFLINE TEACHING
  teachingModes            String[]  @default(["ONLINE"])  // ["ONLINE", "IN_HOME", "HYBRID"]
  inHomeServiceRadius      Int?                            // kilometers radius for in-home teaching
  inHomeEnabled            Boolean   @default(false)       // quick toggle for in-home availability

  // Keep existing: city, country (already at lines 658-659)
}
```

**Modify `bookings` table** (line 64):
```prisma
model bookings {
  // ... existing fields ...

  // NEW FIELDS FOR OFFLINE TEACHING
  teachingMode            String    @default("ONLINE")    // "ONLINE" or "IN_HOME"
  sessionAddress          String?                         // full address for in-home sessions
  sessionCity             String?                         // extracted city
  addressNotes            String?                         // apartment number, building name, etc.
  addressVerified         Boolean   @default(false)       // confirmation flag

  // Keep existing: meetingLink (will be null for in-home sessions)
}
```

**Modify `teacher_subjects` table** (for dual pricing):
```prisma
model teacher_subjects {
  // ... existing fields ...

  // NEW FIELDS FOR DUAL PRICING
  inHomePricePerHour      Decimal?  @db.Decimal(10, 2)   // optional different price for in-home

  // Keep existing: pricePerHour (for online sessions)
}
```

**Add to `parent_profiles` table** (line 482):
```prisma
model parent_profiles {
  // ... existing fields ...

  // NEW FIELDS FOR IN-HOME BOOKINGS
  homeAddress             String?
  homeAddressNotes        String?

  // Keep existing: city, country (already exists)
}
```

**Add to `student_profiles` table** (line 519):
```prisma
model student_profiles {
  // ... existing fields ...

  // NEW FIELDS FOR IN-HOME BOOKINGS
  homeAddress             String?
  homeAddressNotes        String?

  // Keep existing: city, country (already exists)
}
```

**Migration command**:
```bash
npx prisma migrate dev --name add_offline_teaching_fields
```

---

#### 1.2 Backend API Changes

##### 1.2.1 DTOs - Search Request
**File**: `packages/shared/src/marketplace/search.dto.ts`

**Add to `SearchTeachersDto`** (after line 55):
```typescript
export enum TeachingMode {
    ONLINE = 'ONLINE',
    IN_HOME = 'IN_HOME',
    HYBRID = 'HYBRID'  // Teachers who offer both
}

export class SearchTeachersDto {
    // ... existing fields ...

    // NEW FIELDS
    @IsOptional()
    @IsString()
    city?: string;  // Search teachers serving this city

    @IsOptional()
    @IsEnum(TeachingMode)
    teachingMode?: TeachingMode;  // Filter by teaching mode

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    inHomeOnly?: boolean;  // Shortcut to find in-home teachers
}
```

##### 1.2.2 DTOs - Booking Request
**File**: `packages/shared/src/booking/create-booking.dto.ts`

**Add to booking DTO**:
```typescript
export class CreateBookingDto {
    // ... existing fields ...

    // NEW FIELDS
    @IsOptional()
    @IsEnum(TeachingMode)
    teachingMode?: TeachingMode;  // Defaults to ONLINE if not specified

    @ValidateIf(o => o.teachingMode === 'IN_HOME')
    @IsString()
    @IsNotEmpty()
    sessionAddress?: string;  // Required for in-home sessions

    @IsOptional()
    @IsString()
    addressNotes?: string;  // Apartment, floor, etc.
}
```

##### 1.2.3 DTOs - Teacher Profile Update
**File**: `packages/shared/src/teacher/update-teacher-profile.dto.ts`

**Add fields**:
```typescript
export class UpdateTeacherProfileDto {
    // ... existing fields ...

    // NEW FIELDS
    @IsOptional()
    @IsArray()
    @IsEnum(TeachingMode, { each: true })
    teachingModes?: TeachingMode[];

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    inHomeServiceRadius?: number;  // Max 100km

    @IsOptional()
    @IsBoolean()
    inHomeEnabled?: boolean;
}
```

##### 1.2.4 DTOs - Teacher Subject Pricing
**File**: `packages/shared/src/teacher/update-teacher-subject.dto.ts`

**Add dual pricing**:
```typescript
export class UpdateTeacherSubjectDto {
    // ... existing fields ...

    // NEW FIELDS
    @IsOptional()
    @IsNumber()
    @Min(0)
    inHomePricePerHour?: number;  // Optional premium for in-home
}
```

---

##### 1.2.5 Marketplace Service - Search Logic
**File**: `apps/api/src/marketplace/marketplace.service.ts`

**Update `searchTeachers` method** (line 57):

```typescript
async searchTeachers(dto: SearchTeachersDto) {
    const whereClause: any = {
        teacher_profiles: {
            applicationStatus: 'APPROVED',
            availability: { some: {} },

            // NEW: Filter by teaching mode
            ...(dto.inHomeOnly || dto.teachingMode === 'IN_HOME'
                ? { inHomeEnabled: true }
                : {}
            ),

            // NEW: Filter by city (if specified)
            ...(dto.city
                ? { city: { equals: dto.city, mode: 'insensitive' } }
                : {}
            ),
        },
    };

    // NEW: Filter by teaching modes array
    if (dto.teachingMode) {
        if (dto.teachingMode === 'ONLINE') {
            whereClause.teacher_profiles.teachingModes = {
                has: 'ONLINE'
            };
        } else if (dto.teachingMode === 'IN_HOME') {
            whereClause.teacher_profiles.teachingModes = {
                has: 'IN_HOME'
            };
        } else if (dto.teachingMode === 'HYBRID') {
            whereClause.teacher_profiles.teachingModes = {
                hasEvery: ['ONLINE', 'IN_HOME']
            };
        }
    }

    // ... rest of existing logic (price, gender, subject filters)

    const results = await this.prisma.teacher_subjects.findMany({
        where: whereClause,
        include: {
            teacher_profiles: true,
            subjects: true,
            curricula: true,
            teacher_subject_grades: {
                include: { grade_levels: true },
            },
        },
        orderBy: orderBy,
    });

    // Transform results
    return results.map((result: any) => ({
        id: result.id,
        pricePerHour: result.pricePerHour?.toString() || '0',
        inHomePricePerHour: result.inHomePricePerHour?.toString(),  // NEW
        gradeLevels: result.teacher_subject_grades?.map((g: any) => ({
            id: g.grade_levels?.id,
            nameAr: g.grade_levels?.nameAr,
            nameEn: g.grade_levels?.nameEn,
        })) || [],
        teacherProfile: {
            id: result.teacher_profiles.id,
            slug: result.teacher_profiles.slug,
            displayName: result.teacher_profiles.displayName,
            profilePhotoUrl: result.teacher_profiles.profilePhotoUrl,
            gender: result.teacher_profiles.gender,
            bio: result.teacher_profiles.bio,
            city: result.teacher_profiles.city,  // NEW
            country: result.teacher_profiles.country,
            teachingModes: result.teacher_profiles.teachingModes,  // NEW
            inHomeServiceRadius: result.teacher_profiles.inHomeServiceRadius,  // NEW
            averageRating: result.teacher_profiles.averageRating,
            totalReviews: result.teacher_profiles.totalReviews,
            totalSessions: result.teacher_profiles.totalSessions,
        },
        // ... rest of fields
    }));
}
```

**Add helper method for city suggestions**:
```typescript
async getCitiesWithTeachers(): Promise<string[]> {
    const cities = await this.prisma.teacher_profiles.findMany({
        where: {
            applicationStatus: 'APPROVED',
            city: { not: null },
            inHomeEnabled: true,
        },
        select: { city: true },
        distinct: ['city'],
    });

    return cities
        .map(t => t.city)
        .filter(Boolean)
        .sort();
}
```

---

##### 1.2.6 Booking Service - Handle In-Home Sessions
**File**: `apps/api/src/booking/booking.service.ts`

**Update `createBooking` method**:

```typescript
async createBooking(userId: string, dto: CreateBookingDto) {
    // ... existing teacher/subject validation ...

    // NEW: Validate teaching mode
    const teachingMode = dto.teachingMode || 'ONLINE';

    if (teachingMode === 'IN_HOME') {
        // Check if teacher offers in-home teaching
        const teacher = await this.prisma.teacher_profiles.findUnique({
            where: { id: dto.teacherId },
        });

        if (!teacher.inHomeEnabled || !teacher.teachingModes.includes('IN_HOME')) {
            throw new BadRequestException('This teacher does not offer in-home teaching');
        }

        // Validate address is provided
        if (!dto.sessionAddress) {
            throw new BadRequestException('Session address is required for in-home teaching');
        }

        // Optional: Extract city from address or require explicit city
        const sessionCity = this.extractCityFromAddress(dto.sessionAddress);

        // Optional: Check if student city is within teacher's service radius
        // (requires geolocation implementation - see Phase 2)
    }

    // Determine price based on teaching mode
    const pricePerHour = teachingMode === 'IN_HOME' && teacherSubject.inHomePricePerHour
        ? teacherSubject.inHomePricePerHour
        : teacherSubject.pricePerHour;

    const totalPrice = this.calculatePrice(pricePerHour, dto.startTime, dto.endTime);

    // Create booking
    const booking = await this.prisma.bookings.create({
        data: {
            teacherId: dto.teacherId,
            subjectId: dto.subjectId,
            bookedByUserId: userId,
            beneficiaryType: dto.beneficiaryType,
            childId: dto.childId,
            studentUserId: dto.studentUserId,
            startTime: dto.startTime,
            endTime: dto.endTime,
            teachingMode,  // NEW
            sessionAddress: dto.sessionAddress,  // NEW
            addressNotes: dto.addressNotes,  // NEW
            price: totalPrice,
            status: 'PENDING_TEACHER_APPROVAL',
            timezone: dto.timezone || 'UTC',
            commissionRate: 0.18,
            // meetingLink is null for in-home sessions
        },
    });

    // ... rest of notification logic ...

    return booking;
}

private extractCityFromAddress(address: string): string | null {
    // Simple implementation - can be enhanced with geocoding API
    // For now, assume city is provided separately or extracted via pattern matching
    return null;  // TODO: Implement city extraction
}
```

**Update booking approval flow**:
```typescript
async approveBooking(teacherId: string, bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
        where: { id: bookingId },
        include: { teacher_profiles: true },
    });

    // ... existing validation ...

    // NEW: For in-home sessions, verify address confirmation
    if (booking.teachingMode === 'IN_HOME' && !booking.sessionAddress) {
        throw new BadRequestException('Session address must be provided for in-home teaching');
    }

    // Update status
    await this.prisma.bookings.update({
        where: { id: bookingId },
        data: {
            status: 'WAITING_FOR_PAYMENT',
            addressVerified: booking.teachingMode === 'IN_HOME',  // Mark as verified
        },
    });

    // ... rest of payment notification logic ...
}
```

---

##### 1.2.7 Teacher Service - Profile Updates
**File**: `apps/api/src/teacher/teacher.service.ts`

**Update profile update method**:
```typescript
async updateProfile(userId: string, dto: UpdateTeacherProfileDto) {
    // ... existing validation ...

    // NEW: Validate teaching modes
    if (dto.teachingModes) {
        if (dto.teachingModes.includes('IN_HOME')) {
            // Ensure city is set
            const profile = await this.prisma.teacher_profiles.findUnique({
                where: { userId },
            });

            if (!profile.city && !dto.city) {
                throw new BadRequestException(
                    'City is required to enable in-home teaching'
                );
            }

            // Ensure service radius is set
            if (!dto.inHomeServiceRadius && !profile.inHomeServiceRadius) {
                throw new BadRequestException(
                    'Service radius is required for in-home teaching'
                );
            }
        }
    }

    await this.prisma.teacher_profiles.update({
        where: { userId },
        data: {
            city: dto.city,
            country: dto.country,
            teachingModes: dto.teachingModes,
            inHomeServiceRadius: dto.inHomeServiceRadius,
            inHomeEnabled: dto.inHomeEnabled,
            // ... other fields ...
        },
    });
}
```

---

#### 1.3 Frontend Changes

##### 1.3.1 Search Interface Updates
**File**: `apps/web/src/lib/api/search.ts`

**Update search function**:
```typescript
export async function searchTeachers(params: {
    subjectId?: string;
    curriculumId?: string;
    gradeLevelId?: string;
    minPrice?: number;
    maxPrice?: number;
    gender?: string;
    sortBy?: string;
    availableDate?: string;
    // NEW PARAMETERS
    city?: string;
    teachingMode?: 'ONLINE' | 'IN_HOME' | 'HYBRID';
    inHomeOnly?: boolean;
}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
        }
    });

    const response = await fetch(`/api/marketplace/search?${queryParams}`);
    return response.json();
}

export async function getCitiesWithTeachers() {
    const response = await fetch('/api/marketplace/cities');
    return response.json();
}
```

##### 1.3.2 Search UI Component
**File**: `apps/web/src/components/search/SearchFilters.tsx` (new or update existing)

**Add teaching mode and city filters**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getCitiesWithTeachers } from '@/lib/api/search';

export default function SearchFilters({ onFilterChange }) {
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [teachingMode, setTeachingMode] = useState('');

    useEffect(() => {
        getCitiesWithTeachers().then(setCities);
    }, []);

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        onFilterChange({ city });
    };

    const handleTeachingModeChange = (mode: string) => {
        setTeachingMode(mode);
        onFilterChange({ teachingMode: mode });
    };

    return (
        <div className="space-y-4">
            {/* City Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    City / Location
                </label>
                <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
            </div>

            {/* Teaching Mode Filter */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Teaching Mode
                </label>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="teachingMode"
                            value=""
                            checked={teachingMode === ''}
                            onChange={(e) => handleTeachingModeChange(e.target.value)}
                            className="mr-2"
                        />
                        All Modes
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="teachingMode"
                            value="ONLINE"
                            checked={teachingMode === 'ONLINE'}
                            onChange={(e) => handleTeachingModeChange(e.target.value)}
                            className="mr-2"
                        />
                        Online Only
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="teachingMode"
                            value="IN_HOME"
                            checked={teachingMode === 'IN_HOME'}
                            onChange={(e) => handleTeachingModeChange(e.target.value)}
                            className="mr-2"
                        />
                        In-Home Only
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="teachingMode"
                            value="HYBRID"
                            checked={teachingMode === 'HYBRID'}
                            onChange={(e) => handleTeachingModeChange(e.target.value)}
                            className="mr-2"
                        />
                        Both (Hybrid)
                    </label>
                </div>
            </div>

            {/* ... existing filters (subject, price, gender, etc.) ... */}
        </div>
    );
}
```

##### 1.3.3 Teacher Profile Display
**File**: `apps/web/src/components/teacher/TeacherCard.tsx`

**Show teaching modes in teacher card**:
```typescript
export default function TeacherCard({ teacher }) {
    const showsInHome = teacher.teachingModes?.includes('IN_HOME');
    const showsOnline = teacher.teachingModes?.includes('ONLINE');

    return (
        <div className="border rounded-lg p-4">
            {/* ... existing teacher info ... */}

            {/* NEW: Teaching Mode Badges */}
            <div className="flex gap-2 mt-2">
                {showsOnline && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Online
                    </span>
                )}
                {showsInHome && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        In-Home
                    </span>
                )}
            </div>

            {/* NEW: Location Info for In-Home Teachers */}
            {showsInHome && teacher.city && (
                <div className="mt-2 text-sm text-gray-600">
                    Serves: {teacher.city}
                    {teacher.inHomeServiceRadius && (
                        <span> (within {teacher.inHomeServiceRadius}km)</span>
                    )}
                </div>
            )}

            {/* NEW: Dual Pricing Display */}
            <div className="mt-3">
                <div className="text-lg font-bold">
                    {showsOnline && (
                        <div>Online: ${teacher.pricePerHour}/hr</div>
                    )}
                    {showsInHome && teacher.inHomePricePerHour && (
                        <div>In-Home: ${teacher.inHomePricePerHour}/hr</div>
                    )}
                    {showsInHome && !teacher.inHomePricePerHour && (
                        <div>In-Home: ${teacher.pricePerHour}/hr</div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

##### 1.3.4 Booking Flow - Address Collection
**File**: `apps/web/src/components/booking/BookingForm.tsx`

**Add teaching mode selection and address input**:
```typescript
'use client';

import { useState } from 'react';

export default function BookingForm({ teacher, subject }) {
    const [teachingMode, setTeachingMode] = useState('ONLINE');
    const [sessionAddress, setSessionAddress] = useState('');
    const [addressNotes, setAddressNotes] = useState('');

    const canOfferInHome = teacher.teachingModes?.includes('IN_HOME');
    const canOfferOnline = teacher.teachingModes?.includes('ONLINE');

    const selectedPrice = teachingMode === 'IN_HOME' && subject.inHomePricePerHour
        ? subject.inHomePricePerHour
        : subject.pricePerHour;

    return (
        <form>
            {/* Teaching Mode Selection (if teacher offers both) */}
            {canOfferInHome && canOfferOnline && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Teaching Mode
                    </label>
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="teachingMode"
                                value="ONLINE"
                                checked={teachingMode === 'ONLINE'}
                                onChange={(e) => setTeachingMode(e.target.value)}
                                className="mr-2"
                            />
                            Online Session (${subject.pricePerHour}/hr)
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="teachingMode"
                                value="IN_HOME"
                                checked={teachingMode === 'IN_HOME'}
                                onChange={(e) => setTeachingMode(e.target.value)}
                                className="mr-2"
                            />
                            In-Home Session (${subject.inHomePricePerHour || subject.pricePerHour}/hr)
                        </label>
                    </div>
                </div>
            )}

            {/* Address Input for In-Home Sessions */}
            {teachingMode === 'IN_HOME' && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium mb-2">Session Location</h3>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">
                            Full Address *
                        </label>
                        <textarea
                            value={sessionAddress}
                            onChange={(e) => setSessionAddress(e.target.value)}
                            placeholder="Street address, city, postal code"
                            required
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Additional Notes (Optional)
                        </label>
                        <input
                            type="text"
                            value={addressNotes}
                            onChange={(e) => setAddressNotes(e.target.value)}
                            placeholder="Apartment number, floor, building name, etc."
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                        This address will be shared with the teacher after booking confirmation.
                    </p>
                </div>
            )}

            {/* ... rest of booking form (date/time, payment, etc.) ... */}

            <div className="mt-4 p-3 bg-gray-100 rounded">
                <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${selectedPrice * sessionDurationHours}</span>
                </div>
            </div>
        </form>
    );
}
```

##### 1.3.5 Teacher Settings - Enable In-Home Teaching
**File**: `apps/web/src/app/teacher/settings/page.tsx`

**Add in-home teaching settings section**:
```typescript
'use client';

import { useState } from 'react';
import { updateTeacherProfile } from '@/lib/api/teacher';

export default function TeacherSettings() {
    const [teachingModes, setTeachingModes] = useState(['ONLINE']);
    const [city, setCity] = useState('');
    const [inHomeServiceRadius, setInHomeServiceRadius] = useState(10);

    const handleToggleInHome = (enabled: boolean) => {
        if (enabled) {
            setTeachingModes(prev => [...prev, 'IN_HOME']);
        } else {
            setTeachingModes(prev => prev.filter(m => m !== 'IN_HOME'));
        }
    };

    const handleSave = async () => {
        await updateTeacherProfile({
            city,
            teachingModes,
            inHomeServiceRadius: teachingModes.includes('IN_HOME') ? inHomeServiceRadius : null,
            inHomeEnabled: teachingModes.includes('IN_HOME'),
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Teaching Settings</h1>

            {/* Teaching Modes */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Teaching Modes</h2>

                <label className="flex items-center mb-3">
                    <input
                        type="checkbox"
                        checked={teachingModes.includes('ONLINE')}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setTeachingModes(prev => [...prev, 'ONLINE']);
                            } else {
                                setTeachingModes(prev => prev.filter(m => m !== 'ONLINE'));
                            }
                        }}
                        className="mr-2"
                    />
                    <span>Offer Online Teaching</span>
                </label>

                <label className="flex items-center mb-3">
                    <input
                        type="checkbox"
                        checked={teachingModes.includes('IN_HOME')}
                        onChange={(e) => handleToggleInHome(e.target.checked)}
                        className="mr-2"
                    />
                    <span>Offer In-Home Teaching</span>
                </label>
            </section>

            {/* In-Home Settings (shown only if enabled) */}
            {teachingModes.includes('IN_HOME') && (
                <section className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">In-Home Teaching Settings</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Your City *
                        </label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g., Riyadh, Jeddah, Dubai"
                            required
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Service Radius (km)
                        </label>
                        <input
                            type="number"
                            value={inHomeServiceRadius}
                            onChange={(e) => setInHomeServiceRadius(Number(e.target.value))}
                            min={1}
                            max={100}
                            className="w-full border rounded px-3 py-2"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            Maximum distance you're willing to travel for in-home sessions
                        </p>
                    </div>

                    <div className="p-3 bg-yellow-100 rounded text-sm">
                        <strong>Note:</strong> You can set different prices for in-home teaching
                        in your subject settings.
                    </div>
                </section>
            )}

            <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
                Save Settings
            </button>
        </div>
    );
}
```

---

#### 1.4 Email Notifications
**File**: `apps/api/src/emails/templates/BookingConfirmation.tsx`

**Update booking confirmation email to include address for in-home sessions**:
```tsx
export default function BookingConfirmation({ booking }) {
    return (
        <BaseEmail>
            <h1>Booking Confirmed</h1>

            {/* ... existing booking details ... */}

            {/* NEW: Show address for in-home sessions */}
            {booking.teachingMode === 'IN_HOME' && (
                <div style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f9ff' }}>
                    <h3>Session Location</h3>
                    <p><strong>Address:</strong> {booking.sessionAddress}</p>
                    {booking.addressNotes && (
                        <p><strong>Notes:</strong> {booking.addressNotes}</p>
                    )}
                </div>
            )}

            {booking.teachingMode === 'ONLINE' && (
                <div style={{ marginTop: 20 }}>
                    <p><strong>Meeting Link:</strong> Will be provided 15 minutes before session</p>
                </div>
            )}
        </BaseEmail>
    );
}
```

---

### Phase 1 Summary

**What You'll Have After Phase 1:**
✅ Teachers can enable in-home teaching and specify their city
✅ Students/parents can search for teachers by city and teaching mode
✅ Booking flow supports both online and in-home sessions
✅ Address collection for in-home sessions
✅ Optional dual pricing (different rates for in-home vs online)
✅ Email notifications include session location

**Limitations in Phase 1:**
⚠️ City matching is exact text match (case-insensitive)
⚠️ No distance calculations or geolocation
⚠️ No verification that student is within teacher's service radius
⚠️ Manual address entry (no autocomplete)

---

## Phase 2: Enhanced Location & Safety Features

### 2.1 Geolocation & Distance Calculations

**Goal**: Implement precise location-based matching using latitude/longitude

#### 2.1.1 Database Schema Updates

**Add geolocation fields**:
```prisma
model teacher_profiles {
    // ... existing fields ...
    latitude              Decimal?  @db.Decimal(10, 8)
    longitude             Decimal?  @db.Decimal(11, 8)
}

model parent_profiles {
    // ... existing fields ...
    latitude              Decimal?  @db.Decimal(10, 8)
    longitude             Decimal?  @db.Decimal(11, 8)
}

model student_profiles {
    // ... existing fields ...
    latitude              Decimal?  @db.Decimal(10, 8)
    longitude             Decimal?  @db.Decimal(11, 8)
}

model bookings {
    // ... existing fields ...
    locationLatitude      Decimal?  @db.Decimal(10, 8)
    locationLongitude     Decimal?  @db.Decimal(11, 8)
    distanceKm            Decimal?  @db.Decimal(6, 2)  // calculated distance
}
```

#### 2.1.2 Geocoding Service

**File**: `apps/api/src/location/geocoding.service.ts` (new)

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeocodingService {
    // Use Google Maps Geocoding API or similar service

    async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
        // Implementation using Google Maps API
        // Return coordinates for an address
    }

    calculateDistance(
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
```

#### 2.1.3 Search with Distance Filtering

**Update search to filter by distance**:
```typescript
async searchTeachers(dto: SearchTeachersDto, userLocation?: { lat: number; lng: number }) {
    // ... existing filters ...

    let teachers = await this.prisma.teacher_subjects.findMany({
        where: whereClause,
        include: { teacher_profiles: true },
    });

    // Filter by distance if user location provided
    if (userLocation && dto.teachingMode === 'IN_HOME') {
        teachers = teachers.filter(t => {
            if (!t.teacher_profiles.latitude || !t.teacher_profiles.longitude) {
                return false;
            }

            const distance = this.geocodingService.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                Number(t.teacher_profiles.latitude),
                Number(t.teacher_profiles.longitude)
            );

            return distance <= (t.teacher_profiles.inHomeServiceRadius || 0);
        });

        // Sort by distance (closest first)
        teachers.sort((a, b) => {
            const distA = this.geocodingService.calculateDistance(
                userLocation.lat, userLocation.lng,
                Number(a.teacher_profiles.latitude),
                Number(a.teacher_profiles.longitude)
            );
            const distB = this.geocodingService.calculateDistance(
                userLocation.lat, userLocation.lng,
                Number(b.teacher_profiles.latitude),
                Number(b.teacher_profiles.longitude)
            );
            return distA - distB;
        });
    }

    return teachers;
}
```

#### 2.1.4 Address Autocomplete UI

**File**: `apps/web/src/components/booking/AddressAutocomplete.tsx` (new)

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function AddressAutocomplete({ value, onChange }) {
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (!value) return;

        // Use Google Places Autocomplete API
        const fetchSuggestions = async () => {
            const response = await fetch(
                `/api/location/autocomplete?query=${encodeURIComponent(value)}`
            );
            const data = await response.json();
            setSuggestions(data.predictions);
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [value]);

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Start typing your address..."
                className="w-full border rounded px-3 py-2"
            />

            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-auto">
                    {suggestions.map((suggestion) => (
                        <li
                            key={suggestion.place_id}
                            onClick={() => onChange(suggestion.description)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {suggestion.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

---

### 2.2 Safety & Verification Features

#### 2.2.1 Enhanced Teacher Verification

**Add to teacher_profiles**:
```prisma
model teacher_profiles {
    // ... existing fields ...

    backgroundCheckStatus    String?   @default("NOT_STARTED")  // NOT_STARTED, PENDING, VERIFIED, FAILED
    backgroundCheckDate      DateTime?
    backgroundCheckDocument  String?   // URL to verification certificate
    inHomeTeachingExperience Int?      @default(0)             // years of in-home experience
}
```

#### 2.2.2 Session Safety Features

**Add to bookings**:
```prisma
model bookings {
    // ... existing fields ...

    sessionStartConfirmed    Boolean   @default(false)  // Teacher confirms arrival
    sessionEndConfirmed      Boolean   @default(false)  // Parent/student confirms completion
    safetyIssueReported      Boolean   @default(false)
    safetyIssueDescription   String?
}
```

**Emergency contact system**:
```prisma
model emergency_contacts {
    id              String   @id @default(uuid())
    userId          String
    name            String
    phoneNumber     String
    relationship    String
    createdAt       DateTime @default(now())

    users           users    @relation(fields: [userId], references: [id])

    @@index([userId])
}
```

#### 2.2.3 Session Check-In Flow

**File**: `apps/api/src/booking/session-checkin.service.ts` (new)

```typescript
@Injectable()
export class SessionCheckinService {
    async teacherCheckIn(teacherId: string, bookingId: string) {
        const booking = await this.prisma.bookings.findUnique({
            where: { id: bookingId },
        });

        if (booking.teachingMode !== 'IN_HOME') {
            throw new BadRequestException('Check-in only required for in-home sessions');
        }

        await this.prisma.bookings.update({
            where: { id: bookingId },
            data: {
                sessionStartConfirmed: true,
                // Send notification to parent/student
            },
        });

        // Send notification to student/parent that teacher has arrived
        await this.notificationService.sendSessionStartNotification(booking);
    }

    async studentCheckOut(userId: string, bookingId: string) {
        await this.prisma.bookings.update({
            where: { id: bookingId },
            data: {
                sessionEndConfirmed: true,
            },
        });
    }

    async reportSafetyIssue(bookingId: string, description: string) {
        await this.prisma.bookings.update({
            where: { id: bookingId },
            data: {
                safetyIssueReported: true,
                safetyIssueDescription: description,
                status: 'CANCELLED',
            },
        });

        // Alert admin team immediately
        await this.notificationService.alertAdminSafetyIssue(bookingId);
    }
}
```

#### 2.2.4 Rating System Updates

**Add in-home specific rating criteria**:
```prisma
model ratings {
    // ... existing fields ...

    punctualityRating        Int?      // 1-5 (important for in-home)
    professionalismRating    Int?      // 1-5
    safetyRating             Int?      // 1-5 (in-home specific)
    wouldRecommendForInHome  Boolean?  // specific to in-home sessions
}
```

---

### 2.3 Multi-Location Support for Teachers

**Goal**: Allow teachers to serve multiple cities or neighborhoods

#### 2.3.1 Teacher Locations Table

```prisma
model teacher_locations {
    id            String   @id @default(uuid())
    teacherId     String
    city          String
    district      String?
    neighborhood  String?
    latitude      Decimal? @db.Decimal(10, 8)
    longitude     Decimal? @db.Decimal(11, 8)
    serviceRadius Int      @default(10)  // km
    isPrimary     Boolean  @default(false)
    isActive      Boolean  @default(true)
    createdAt     DateTime @default(now())

    teacher_profiles teacher_profiles @relation(fields: [teacherId], references: [id], onDelete: Cascade)

    @@index([teacherId])
    @@index([city])
    @@index([latitude, longitude])
}
```

#### 2.3.2 Search Updates

**Search across all teacher locations**:
```typescript
async searchTeachers(dto: SearchTeachersDto) {
    const whereClause: any = {
        teacher_profiles: {
            applicationStatus: 'APPROVED',
            inHomeEnabled: true,

            // Search by teacher_locations instead of city field
            teacher_locations: {
                some: {
                    isActive: true,
                    ...(dto.city ? { city: { equals: dto.city, mode: 'insensitive' } } : {}),
                },
            },
        },
    };

    // ... rest of search logic
}
```

---

## Phase 3: Advanced Features

### 3.1 Travel Time Optimization

**File**: `apps/api/src/booking/travel-time.service.ts` (new)

```typescript
@Injectable()
export class TravelTimeService {
    async calculateTravelTime(
        teacherLocation: { lat: number; lng: number },
        sessionLocation: { lat: number; lng: number }
    ): Promise<number> {
        // Use Google Maps Distance Matrix API
        // Return travel time in minutes
    }

    async getAvailableSlots(teacherId: string, date: string, studentLocation: { lat: number; lng: number }) {
        // Get teacher's regular availability
        const availability = await this.getTeacherAvailability(teacherId, date);

        // Get teacher's scheduled bookings for that day
        const bookings = await this.getScheduledBookings(teacherId, date);

        // Calculate travel time between each booking
        const slotsWithTravel = [];

        for (let i = 0; i < bookings.length - 1; i++) {
            const currentBooking = bookings[i];
            const nextBooking = bookings[i + 1];

            // Calculate travel time from current booking to student location
            const travelTime = await this.calculateTravelTime(
                { lat: currentBooking.locationLatitude, lng: currentBooking.locationLongitude },
                studentLocation
            );

            // Check if there's enough time between bookings
            const timeBetween = nextBooking.startTime.getTime() - currentBooking.endTime.getTime();
            const requiredTime = (travelTime + 15) * 60 * 1000; // travel + 15 min buffer

            if (timeBetween >= requiredTime) {
                slotsWithTravel.push({
                    startTime: new Date(currentBooking.endTime.getTime() + travelTime * 60 * 1000),
                    endTime: nextBooking.startTime,
                    travelTimeMinutes: travelTime,
                });
            }
        }

        return slotsWithTravel;
    }
}
```

### 3.2 Smart Pricing Based on Distance

**File**: `apps/api/src/booking/pricing.service.ts`

```typescript
@Injectable()
export class PricingService {
    calculateInHomePrice(
        basePrice: number,
        distance: number,
        peakHours: boolean
    ): number {
        let price = basePrice;

        // Distance premium (per km over 5km)
        if (distance > 5) {
            const extraKm = distance - 5;
            price += extraKm * 2; // $2 per extra km
        }

        // Peak hours premium (15% extra for evenings/weekends)
        if (peakHours) {
            price *= 1.15;
        }

        return Math.round(price * 100) / 100;
    }
}
```

### 3.3 Recurring In-Home Sessions

**Support weekly/monthly recurring bookings at the same address**:

```prisma
model recurring_bookings {
    id                String   @id @default(uuid())
    teacherId         String
    studentUserId     String?
    childId           String?
    subjectId         String
    teachingMode      String
    sessionAddress    String?
    frequency         String   // WEEKLY, BIWEEKLY, MONTHLY
    dayOfWeek         Int      // 0-6 (Sunday-Saturday)
    startTime         String   // HH:MM
    endTime           String   // HH:MM
    startDate         DateTime
    endDate           DateTime?
    isActive          Boolean  @default(true)
    createdAt         DateTime @default(now())

    bookings          bookings[]  // Links to individual session instances

    @@index([teacherId])
    @@index([studentUserId])
}
```

---

## Technical Considerations

### Security & Privacy

1. **Address Protection**:
   - Student addresses only revealed AFTER teacher approves booking
   - Exact coordinates stored but not displayed
   - Address history retained for dispute resolution

2. **Teacher Verification**:
   - Enhanced KYC for in-home teachers
   - Background check integration (optional)
   - In-home teaching experience validation

3. **Session Safety**:
   - Check-in/check-out system
   - Emergency contact notifications
   - Safety rating system
   - Admin alerts for reported issues

### Performance

1. **Geolocation Indexing**:
   - Add spatial indexes for lat/lng columns
   - Cache geocoding results (city → coordinates)
   - Use PostGIS extension for advanced queries (optional)

2. **Search Optimization**:
   - Index on `city`, `teachingModes`, `inHomeEnabled`
   - Consider separate index for in-home teachers
   - Pagination for search results

### Data Migration

**Migration strategy for existing data**:
```sql
-- Set default teaching mode for all existing teachers
UPDATE teacher_profiles
SET teachingModes = ARRAY['ONLINE']::text[],
    inHomeEnabled = false;

-- Set default teaching mode for all existing bookings
UPDATE bookings
SET teachingMode = 'ONLINE';
```

---

## Testing Strategy

### Unit Tests

**File**: `apps/api/src/marketplace/marketplace.service.spec.ts`

```typescript
describe('MarketplaceService - Offline Teaching', () => {
    it('should filter teachers by city', async () => {
        const result = await service.searchTeachers({
            city: 'Riyadh',
            teachingMode: 'IN_HOME',
        });

        expect(result.every(t => t.teacherProfile.city === 'Riyadh')).toBe(true);
    });

    it('should return only in-home enabled teachers when filtering by IN_HOME mode', async () => {
        const result = await service.searchTeachers({
            teachingMode: 'IN_HOME',
        });

        expect(result.every(t => t.teacherProfile.inHomeEnabled)).toBe(true);
    });

    it('should calculate distance between teacher and student', () => {
        const distance = geocodingService.calculateDistance(
            24.7136, 46.6753,  // Riyadh
            21.3891, 39.8579   // Mecca
        );

        expect(distance).toBeCloseTo(715, 0);  // ~715km
    });
});
```

### Integration Tests

**File**: `apps/api/test/booking.e2e-spec.ts`

```typescript
describe('Booking - In-Home Sessions', () => {
    it('should create in-home booking with address', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                teacherId: 'teacher-id',
                subjectId: 'subject-id',
                teachingMode: 'IN_HOME',
                sessionAddress: '123 Main St, Riyadh 12345',
                addressNotes: 'Apartment 5B',
                startTime: '2026-01-15T10:00:00Z',
                endTime: '2026-01-15T11:00:00Z',
            });

        expect(response.status).toBe(201);
        expect(response.body.teachingMode).toBe('IN_HOME');
        expect(response.body.sessionAddress).toBe('123 Main St, Riyadh 12345');
    });

    it('should reject in-home booking without address', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/bookings')
            .send({
                teachingMode: 'IN_HOME',
                // missing sessionAddress
            });

        expect(response.status).toBe(400);
    });
});
```

---

## Deployment Checklist

### Phase 1 Launch

- [ ] Database migration executed
- [ ] Seed data: Update existing teachers with default `teachingModes: ['ONLINE']`
- [ ] Backend API endpoints deployed and tested
- [ ] Frontend search filters deployed
- [ ] Email templates updated
- [ ] Documentation updated for teachers (how to enable in-home teaching)
- [ ] Admin panel updated to show teaching modes
- [ ] Analytics events added for in-home bookings
- [ ] Customer support team trained on new feature

### Phase 2 Launch

- [ ] Geocoding API keys configured
- [ ] Google Places API enabled
- [ ] Distance calculation tested
- [ ] Address autocomplete tested in multiple regions
- [ ] Background check integration (if applicable)
- [ ] Safety reporting flow tested

### Phase 3 Launch

- [ ] Travel time optimization tested
- [ ] Recurring booking system deployed
- [ ] Multi-location search tested

---

## Success Metrics

### KPIs to Track

1. **Adoption Rate**:
   - % of teachers who enable in-home teaching
   - % of bookings that are in-home vs online

2. **Search Behavior**:
   - City filter usage rate
   - Teaching mode filter usage rate
   - Conversion rate for in-home vs online searches

3. **Booking Success**:
   - In-home booking completion rate
   - Cancellation rate (in-home vs online)
   - Average in-home session rating

4. **Safety**:
   - Safety issue report rate
   - Check-in/check-out completion rate
   - Teacher verification completion rate

5. **Revenue**:
   - Average in-home booking value vs online
   - Commission earned from in-home sessions
   - Teacher earnings comparison

---

## Risks & Mitigation

### Risk 1: Low Teacher Adoption
**Mitigation**:
- Promote in-home teaching with marketing campaigns
- Offer promotional pricing for first in-home sessions
- Highlight earning potential from in-home premium pricing

### Risk 2: Safety Concerns
**Mitigation**:
- Mandatory background checks for in-home teachers
- Insurance coverage for in-home sessions
- Emergency contact system
- Real-time check-in/check-out monitoring

### Risk 3: Geolocation Accuracy
**Mitigation**:
- Fallback to city-based matching if geocoding fails
- Allow manual location adjustment
- Use multiple geocoding providers

### Risk 4: Complex Scheduling with Travel Time
**Mitigation**:
- Start with simple availability (Phase 1)
- Add travel time optimization gradually (Phase 3)
- Allow teachers to manually block time for travel

---

## Alternative Approaches Considered

### Approach 1: Neighborhood/District System
Instead of geolocation, use predefined neighborhoods/districts.
- **Pros**: Simpler, no external APIs, culturally relevant
- **Cons**: Less precise, requires manual data entry
- **Decision**: Use in Phase 1, add geolocation in Phase 2

### Approach 2: Fixed Meeting Points
Teachers specify public meeting locations instead of going to homes.
- **Pros**: Safer, easier logistics
- **Cons**: Not true "in-home" teaching, requires travel for students
- **Decision**: Not implemented, but could be Phase 4 feature

### Approach 3: Agency/Dispatch Model
Platform assigns teachers to students based on location.
- **Pros**: Better utilization, route optimization
- **Cons**: Removes teacher choice, complex algorithm
- **Decision**: Not suitable for marketplace model

---

## Questions for Stakeholders

Before implementation, clarify:

1. **Pricing**:
   - Should in-home teaching have a mandatory premium? Or optional?
   - Should platform take higher commission on in-home sessions?

2. **Verification**:
   - Are background checks mandatory for in-home teachers?
   - What level of ID verification is sufficient?

3. **Insurance**:
   - Does platform need to provide insurance for in-home sessions?
   - Who is liable in case of incidents?

4. **Geographic Scope**:
   - Start with specific cities or nationwide?
   - Should we limit to urban areas initially?

5. **Session Proof**:
   - Is photo proof mandatory for in-home sessions?
   - How to verify session occurred without being intrusive?

6. **Cancellation Policy**:
   - Different policies for in-home vs online?
   - How to handle travel expenses if student cancels last minute?

---

## Next Steps

1. **Stakeholder Review**: Present this plan to product, engineering, and business teams
2. **Technical Design Review**: Deep dive into database schema and API design
3. **UI/UX Mockups**: Design interfaces for search, booking, and teacher settings
4. **Estimation**: Break down tasks and estimate development effort
5. **Pilot Program**: Launch with small group of teachers in one city
6. **Iterate**: Gather feedback and refine before full rollout

---

## Appendix: File Structure Summary

### Backend Files to Create/Modify

**Database**:
- `packages/database/prisma/schema.prisma` - Add fields for teaching modes, locations

**DTOs**:
- `packages/shared/src/marketplace/search.dto.ts` - Add city, teaching mode filters
- `packages/shared/src/booking/create-booking.dto.ts` - Add teaching mode, address
- `packages/shared/src/teacher/update-teacher-profile.dto.ts` - Add in-home settings

**Services**:
- `apps/api/src/marketplace/marketplace.service.ts` - Update search logic
- `apps/api/src/booking/booking.service.ts` - Handle in-home bookings
- `apps/api/src/teacher/teacher.service.ts` - Update profile management
- `apps/api/src/location/geocoding.service.ts` (new) - Geolocation utilities
- `apps/api/src/booking/session-checkin.service.ts` (new) - Safety check-ins

**Email Templates**:
- `apps/api/src/emails/templates/BookingConfirmation.tsx` - Add address info

### Frontend Files to Create/Modify

**Components**:
- `apps/web/src/components/search/SearchFilters.tsx` - Add city/mode filters
- `apps/web/src/components/teacher/TeacherCard.tsx` - Show teaching modes
- `apps/web/src/components/booking/BookingForm.tsx` - Add address input
- `apps/web/src/components/booking/AddressAutocomplete.tsx` (new) - Address autocomplete

**API Layer**:
- `apps/web/src/lib/api/search.ts` - Add city parameter
- `apps/web/src/lib/api/booking.ts` - Add in-home booking support
- `apps/web/src/lib/api/teacher.ts` - Add in-home settings

**Pages**:
- `apps/web/src/app/teacher/settings/page.tsx` - Add in-home teaching settings

---

## Conclusion

This plan provides a phased approach to implementing offline/in-home teaching:

**Phase 1 (MVP)**: Basic city-based search and in-home bookings with address collection
**Phase 2 (Enhanced)**: Geolocation, distance calculations, safety features
**Phase 3 (Advanced)**: Travel time optimization, recurring sessions, multi-location

The feature builds on existing strengths (timezone handling, availability system, verification) while adding new capabilities for location-based teaching. The phased approach allows for iteration based on user feedback and minimizes risk.
