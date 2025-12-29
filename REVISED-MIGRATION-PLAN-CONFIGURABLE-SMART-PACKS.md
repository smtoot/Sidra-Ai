# Revised Migration Plan: Configurable Smart Pack System

## Key Revision: Admin-Configurable Packages

**Original Plan**: Single hardcoded 10-session Smart Pack
**Revised Plan**: Flexible, admin-configurable Smart Pack tiers (5/10/15/20 sessions, etc.)

This revision makes the Smart Pack system **fully configurable** from the admin panel while maintaining the semi-structured behavior (recurring pattern + floating sessions).

---

## Core Concept: Configurable Smart Packs

### What Admins Can Configure

1. **Package Tiers** (5, 10, 15, 20 sessions - any combination)
2. **Discount Percentage** per tier (e.g., 5% for 5-session, 10% for 10-session, 15% for 15-session)
3. **Recurring Session Ratio** (e.g., 80% recurring, 20% floating)
4. **Reschedule Limits** per session (default: 2, configurable)
5. **Duration Formula** (weeks = sessions * multiplier)
6. **Grace Period** (days after last scheduled session)

### What Teachers Can Control

1. **Enable/Disable Packages** entirely for their profile
2. **Enable/Disable Demo Sessions** independently
3. **Select Which Package Tiers** to offer (e.g., only 10 and 20-session packages)

### What Stays Consistent (Semi-Structured Behavior)

- Recurring pattern (weekday + time) selected at purchase
- X% of sessions auto-booked based on pattern
- Y% of sessions remain floating (book anytime)
- Reschedule limits enforced
- Expiry based on last scheduled session + grace period

---

## Revised Database Schema

### 1. Enhanced PackageTier Model

```prisma
model PackageTier {
  id              String   @id @default(uuid())

  // Basic config (existing)
  sessionCount    Int      // 5, 10, 15, 20, etc.
  discountPercent Decimal  @db.Decimal(5, 2)
  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)

  // NEW: Smart Pack configuration
  recurringRatio     Decimal  @default(0.8)  @db.Decimal(3, 2)  // 0.8 = 80% recurring
  floatingRatio      Decimal  @default(0.2)  @db.Decimal(3, 2)  // 0.2 = 20% floating
  rescheduleLimit    Int      @default(2)                       // Reschedules per session
  durationWeeks      Int                                        // Total duration in weeks
  gracePeriodDays    Int      @default(14)                      // Grace period after last session

  // Display labels (bilingual)
  nameAr          String?  // "باقة المبتدئين"
  nameEn          String?  // "Starter Pack"
  descriptionAr   String?  @db.Text
  descriptionEn   String?  @db.Text

  // Marketing
  isFeatured      Boolean  @default(false)  // Show "Most Popular" badge
  badge           String?  // "RECOMMENDED", "BEST_VALUE", etc.

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  studentPackages StudentPackage[]
  teacherTierSettings TeacherPackageTierSetting[]  // NEW: Teacher opt-in

  @@map("package_tiers")
}
```

### 2. New Model: TeacherPackageTierSetting

Allows teachers to selectively enable/disable specific tiers.

```prisma
model TeacherPackageTierSetting {
  id        String   @id @default(uuid())
  teacherId String
  tierId    String
  isEnabled Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  teacher TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  tier    PackageTier    @relation(fields: [tierId], references: [id], onDelete: Cascade)

  @@unique([teacherId, tierId])
  @@index([teacherId])
  @@map("teacher_package_tier_settings")
}
```

### 3. Update TeacherDemoSettings

Add package enable/disable control.

```prisma
model TeacherDemoSettings {
  id             String         @id @default(uuid())
  teacherId      String         @unique

  // Existing
  demoEnabled    Boolean        @default(false)

  // NEW: Package control
  packagesEnabled Boolean       @default(true)  // Master toggle for all packages

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  teacher        TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@map("teacher_demo_settings")
}
```

### 4. Update StudentPackage Model

Add dynamic fields calculated from PackageTier config.

```prisma
model StudentPackage {
  // ... existing fields ...

  // NEW: Smart Pack tracking (from tier config at purchase time)
  isSmartPack           Boolean   @default(true)   // All new packages are Smart Packs
  recurringWeekday      String?                    // "TUESDAY"
  recurringTime         String?                    // "17:00"

  // Calculated from tier at purchase (immutable snapshot)
  recurringSessionCount Int?                       // Calculated: sessionCount * recurringRatio
  floatingSessionCount  Int?                       // Calculated: sessionCount * floatingRatio
  floatingSessionsUsed  Int       @default(0)
  rescheduleLimit       Int       @default(2)      // From tier config

  // Expiry tracking
  firstScheduledSession DateTime?
  lastScheduledSession  DateTime?
  gracePeriodEnds       DateTime?                  // lastScheduled + tier.gracePeriodDays

  // Relations
  tierId                String?                    // Reference to tier config
  packageTier           PackageTier? @relation(fields: [tierId], references: [id])
}
```

---

## Admin Configuration UI

### Admin Panel: Package Tier Management

**Location**: `/admin/packages/tiers`

```typescript
// apps/web/src/app/admin/packages/tiers/page.tsx

export default function PackageTiersAdmin() {
  const { data: tiers } = useQuery({
    queryKey: ['admin', 'package-tiers'],
    queryFn: adminApi.getPackageTiers,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Package Tier Configuration</h1>
        <Button onClick={handleCreateTier}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Tier
        </Button>
      </div>

      {/* Tiers Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Recurring/Floating</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Grace Period</TableHead>
            <TableHead>Reschedules</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers?.map(tier => (
            <TableRow key={tier.id}>
              <TableCell>{tier.displayOrder}</TableCell>
              <TableCell>{tier.sessionCount}</TableCell>
              <TableCell>{tier.discountPercent}%</TableCell>
              <TableCell>
                {Math.round(tier.recurringRatio * 100)}% / {Math.round(tier.floatingRatio * 100)}%
              </TableCell>
              <TableCell>{tier.durationWeeks} weeks</TableCell>
              <TableCell>{tier.gracePeriodDays} days</TableCell>
              <TableCell>{tier.rescheduleLimit}x per session</TableCell>
              <TableCell>
                <Badge variant={tier.isActive ? 'success' : 'secondary'}>
                  {tier.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEdit(tier)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(tier)}>
                      {tier.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(tier)} className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Create/Edit Tier Modal

```typescript
// apps/web/src/components/admin/PackageTierForm.tsx

export function PackageTierForm({
  tier,
  onSave,
  onClose
}: {
  tier?: PackageTier;
  onSave: () => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    sessionCount: tier?.sessionCount || 10,
    discountPercent: tier?.discountPercent || 10,
    recurringRatio: tier?.recurringRatio || 0.8,
    floatingRatio: tier?.floatingRatio || 0.2,
    rescheduleLimit: tier?.rescheduleLimit || 2,
    durationWeeks: tier?.durationWeeks || 6,
    gracePeriodDays: tier?.gracePeriodDays || 14,
    nameAr: tier?.nameAr || '',
    nameEn: tier?.nameEn || '',
    isFeatured: tier?.isFeatured || false,
  });

  // Auto-calculate recurring and floating session counts
  const recurringCount = Math.round(formData.sessionCount * formData.recurringRatio);
  const floatingCount = formData.sessionCount - recurringCount;

  const handleSubmit = async () => {
    // Validate ratios sum to 1.0
    if (formData.recurringRatio + formData.floatingRatio !== 1.0) {
      toast.error('Recurring + Floating ratios must equal 100%');
      return;
    }

    try {
      if (tier) {
        await adminApi.updatePackageTier(tier.id, formData);
      } else {
        await adminApi.createPackageTier(formData);
      }
      toast.success('Package tier saved successfully');
      onSave();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save tier');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tier ? 'Edit Package Tier' : 'Create New Package Tier'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Session Count *</Label>
              <Input
                type="number"
                min={1}
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Discount Percentage *</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Session Distribution */}
          <Separator />
          <h3 className="font-semibold">Session Distribution</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recurring Ratio (0-1) *</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={formData.recurringRatio}
                onChange={(e) => {
                  const recurring = Number(e.target.value);
                  setFormData({
                    ...formData,
                    recurringRatio: recurring,
                    floatingRatio: 1 - recurring
                  });
                }}
              />
              <p className="text-sm text-gray-500 mt-1">
                {recurringCount} recurring sessions
              </p>
            </div>

            <div>
              <Label>Floating Ratio (auto-calculated)</Label>
              <Input
                type="number"
                value={formData.floatingRatio}
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                {floatingCount} floating sessions
              </p>
            </div>
          </div>

          {/* Duration & Grace Period */}
          <Separator />
          <h3 className="font-semibold">Timeline Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (weeks) *</Label>
              <Input
                type="number"
                min={1}
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) })}
              />
              <p className="text-sm text-gray-500 mt-1">
                Total package duration
              </p>
            </div>

            <div>
              <Label>Grace Period (days) *</Label>
              <Input
                type="number"
                min={0}
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
              />
              <p className="text-sm text-gray-500 mt-1">
                After last scheduled session
              </p>
            </div>
          </div>

          {/* Reschedule Limit */}
          <div>
            <Label>Reschedule Limit (per session) *</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={formData.rescheduleLimit}
              onChange={(e) => setFormData({ ...formData, rescheduleLimit: Number(e.target.value) })}
            />
            <p className="text-sm text-gray-500 mt-1">
              How many times each session can be rescheduled
            </p>
          </div>

          {/* Display Names */}
          <Separator />
          <h3 className="font-semibold">Display Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name (Arabic)</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: باقة المبتدئين"
                dir="rtl"
              />
            </div>

            <div>
              <Label>Name (English)</Label>
              <Input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Example: Starter Pack"
              />
            </div>
          </div>

          {/* Featured Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
            />
            <Label htmlFor="featured">
              Mark as featured (show "Most Popular" badge)
            </Label>
          </div>

          {/* Preview */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Package Summary</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{formData.sessionCount} total sessions</li>
                <li>{recurringCount} auto-booked via recurring pattern</li>
                <li>{floatingCount} floating (book anytime)</li>
                <li>{formData.discountPercent}% discount</li>
                <li>{formData.durationWeeks} weeks + {formData.gracePeriodDays} days grace period</li>
                <li>{formData.rescheduleLimit} reschedules per session</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {tier ? 'Update Tier' : 'Create Tier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Teacher Controls: Package Settings

### Teacher Settings Page

**Location**: `/teacher/settings` (existing page)

Add new section for package configuration.

```typescript
// apps/web/src/app/teacher/settings/page.tsx

export default function TeacherSettingsPage() {
  const { data: settings } = useQuery({
    queryKey: ['teacher', 'demo-settings'],
    queryFn: teacherApi.getDemoSettings,
  });

  const { data: availableTiers } = useQuery({
    queryKey: ['package-tiers', 'active'],
    queryFn: packageApi.getActiveTiers,
  });

  const { data: teacherTierSettings } = useQuery({
    queryKey: ['teacher', 'tier-settings'],
    queryFn: teacherApi.getPackageTierSettings,
  });

  return (
    <div className="space-y-6">
      {/* Demo Session Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Sessions</CardTitle>
          <CardDescription>
            Allow students to book a free demo session before purchasing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="demo-enabled">Enable Demo Sessions</Label>
            <Switch
              id="demo-enabled"
              checked={settings?.demoEnabled}
              onCheckedChange={handleToggleDemoSessions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Package Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Package Sessions</CardTitle>
          <CardDescription>
            Allow students to purchase session packages at discounted rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="packages-enabled">Enable Packages</Label>
              <p className="text-sm text-gray-500">
                Master toggle for all package tiers
              </p>
            </div>
            <Switch
              id="packages-enabled"
              checked={settings?.packagesEnabled}
              onCheckedChange={handleTogglePackages}
            />
          </div>

          {settings?.packagesEnabled && (
            <>
              <Separator />
              <div>
                <Label className="text-base">Available Package Tiers</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Select which package sizes you want to offer
                </p>

                <div className="space-y-3">
                  {availableTiers?.map(tier => {
                    const isEnabled = teacherTierSettings?.find(
                      s => s.tierId === tier.id
                    )?.isEnabled ?? true;

                    const recurringCount = Math.round(tier.sessionCount * tier.recurringRatio);
                    const floatingCount = tier.sessionCount - recurringCount;

                    return (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {tier.nameAr || `${tier.sessionCount} Sessions`}
                            </h4>
                            {tier.isFeatured && (
                              <Badge variant="default">Most Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {recurringCount} recurring + {floatingCount} floating sessions
                            • {tier.discountPercent}% discount
                            • {tier.durationWeeks} weeks duration
                          </p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggleTier(tier.id, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Backend API Updates

### 1. Package Service: Dynamic Tier Handling

```typescript
// apps/api/src/package/package.service.ts

async purchaseSmartPackage(
  payerId: string,
  studentId: string,
  teacherId: string,
  subjectId: string,
  tierId: string,          // NEW: Dynamic tier selection
  recurringWeekday: string,
  recurringTime: string,
  idempotencyKey: string
) {
  // 1. Get tier configuration
  const tier = await this.prisma.packageTier.findUnique({
    where: { id: tierId }
  });

  if (!tier || !tier.isActive) {
    throw new BadRequestException('Package tier not available');
  }

  // 2. Check if teacher has enabled this tier
  const teacherSettings = await this.prisma.teacherDemoSettings.findUnique({
    where: { teacherId }
  });

  if (!teacherSettings?.packagesEnabled) {
    throw new BadRequestException('Teacher has disabled package purchases');
  }

  const tierSetting = await this.prisma.teacherPackageTierSetting.findUnique({
    where: {
      teacherId_tierId: { teacherId, tierId }
    }
  });

  if (tierSetting && !tierSetting.isEnabled) {
    throw new BadRequestException('Teacher has disabled this package tier');
  }

  // 3. Calculate session distribution from tier config
  const recurringCount = Math.round(tier.sessionCount * tier.recurringRatio.toNumber());
  const floatingCount = tier.sessionCount - recurringCount;

  // 4. Validate teacher availability for recurring sessions
  const availabilityCheck = await this.validateRecurringPattern(
    teacherId,
    recurringWeekday,
    recurringTime,
    recurringCount,  // Dynamic based on tier
    tier.durationWeeks
  );

  if (!availabilityCheck.available) {
    throw new BadRequestException(
      `المعلمة ليس لديها ${recurringCount} أسابيع متتالية متاحة في هذا الموعد`
    );
  }

  // 5. Calculate pricing
  const teacherSubject = await this.getTeacherSubject(teacherId, subjectId);
  const originalPrice = teacherSubject.pricePerHour;
  const discountMultiplier = new Decimal(1).sub(tier.discountPercent.div(100)).toNumber();
  const discountedPrice = normalizeMoney(originalPrice * discountMultiplier);
  const totalPaid = normalizeMoney(discountedPrice * tier.sessionCount);

  // 6. Calculate expiry dates
  const firstSession = availabilityCheck.suggestedDates[0];
  const lastSession = availabilityCheck.suggestedDates[recurringCount - 1];
  const gracePeriodEnds = addDays(lastSession, tier.gracePeriodDays);

  // 7. Create package + auto-book recurring sessions
  return this.prisma.$transaction(async (tx) => {
    // Debit wallet
    await this.debitWallet(tx, payerId, totalPaid);

    // Create Smart Pack with tier snapshot
    const pkg = await tx.studentPackage.create({
      data: {
        payerId,
        studentId,
        teacherId,
        subjectId,
        tierId,  // Reference to tier
        sessionCount: tier.sessionCount,
        sessionsUsed: 0,
        originalPricePerSession: originalPrice,
        discountedPricePerSession: discountedPrice,
        totalPaid,
        escrowRemaining: totalPaid,
        status: 'ACTIVE',
        expiresAt: gracePeriodEnds,

        // Smart Pack specific (from tier)
        isSmartPack: true,
        recurringWeekday,
        recurringTime,
        recurringSessionCount: recurringCount,
        floatingSessionCount: floatingCount,
        floatingSessionsUsed: 0,
        rescheduleLimit: tier.rescheduleLimit,
        firstScheduledSession: firstSession,
        lastScheduledSession: lastSession,
        gracePeriodEnds,
      }
    });

    // Auto-create recurring bookings
    for (const sessionDate of availabilityCheck.suggestedDates) {
      const booking = await tx.booking.create({
        data: {
          bookedByUserId: payerId,
          beneficiaryType: 'STUDENT',
          studentUserId: studentId,
          teacherId,
          subjectId,
          startTime: sessionDate,
          endTime: addHours(sessionDate, 1),
          price: discountedPrice,
          status: 'CONFIRMED',
          packageSessionType: 'AUTO_SCHEDULED',
          rescheduleCount: 0,
          maxReschedules: tier.rescheduleLimit,  // From tier config
        }
      });

      // Create redemption
      await tx.packageRedemption.create({
        data: {
          packageId: pkg.id,
          bookingId: booking.id,
          status: 'RESERVED',
        }
      });
    }

    return pkg;
  });
}
```

### 2. Admin API: Tier Management

```typescript
// apps/api/src/admin/admin.controller.ts

@Get('package-tiers')
@UseGuards(JwtAuthGuard, AdminGuard)
async getPackageTiers() {
  return this.adminService.getPackageTiers();
}

@Post('package-tiers')
@UseGuards(JwtAuthGuard, AdminGuard)
async createPackageTier(@Body() dto: CreatePackageTierDto) {
  return this.adminService.createPackageTier(dto);
}

@Patch('package-tiers/:id')
@UseGuards(JwtAuthGuard, AdminGuard)
async updatePackageTier(
  @Param('id') id: string,
  @Body() dto: UpdatePackageTierDto
) {
  return this.adminService.updatePackageTier(id, dto);
}

@Delete('package-tiers/:id')
@UseGuards(JwtAuthGuard, AdminGuard)
async deletePackageTier(@Param('id') id: string) {
  return this.adminService.deletePackageTier(id);
}
```

```typescript
// apps/api/src/admin/admin.service.ts

async createPackageTier(dto: CreatePackageTierDto) {
  // Validate ratios sum to 1.0
  if (dto.recurringRatio + dto.floatingRatio !== 1.0) {
    throw new BadRequestException('Recurring and floating ratios must sum to 1.0');
  }

  return this.prisma.packageTier.create({
    data: {
      sessionCount: dto.sessionCount,
      discountPercent: new Decimal(dto.discountPercent),
      recurringRatio: new Decimal(dto.recurringRatio),
      floatingRatio: new Decimal(dto.floatingRatio),
      rescheduleLimit: dto.rescheduleLimit,
      durationWeeks: dto.durationWeeks,
      gracePeriodDays: dto.gracePeriodDays,
      nameAr: dto.nameAr,
      nameEn: dto.nameEn,
      descriptionAr: dto.descriptionAr,
      descriptionEn: dto.descriptionEn,
      isFeatured: dto.isFeatured || false,
      isActive: true,
      displayOrder: dto.displayOrder || 0,
    }
  });
}
```

### 3. Teacher API: Tier Settings

```typescript
// apps/api/src/teacher/teacher.controller.ts

@Get('me/package-tier-settings')
@UseGuards(JwtAuthGuard, TeacherGuard)
async getPackageTierSettings(@Request() req) {
  return this.teacherService.getPackageTierSettings(req.user.userId);
}

@Patch('me/package-tier-settings/:tierId')
@UseGuards(JwtAuthGuard, TeacherGuard)
async updateTierSetting(
  @Request() req,
  @Param('tierId') tierId: string,
  @Body() dto: { isEnabled: boolean }
) {
  return this.teacherService.updateTierSetting(
    req.user.userId,
    tierId,
    dto.isEnabled
  );
}

@Patch('me/demo-settings')
@UseGuards(JwtAuthGuard, TeacherGuard)
async updateDemoSettings(
  @Request() req,
  @Body() dto: UpdateDemoSettingsDto
) {
  return this.teacherService.updateDemoSettings(req.user.userId, dto);
}
```

```typescript
// apps/api/src/teacher/teacher.service.ts

async updateTierSetting(userId: string, tierId: string, isEnabled: boolean) {
  const teacher = await this.getTeacherByUserId(userId);

  return this.prisma.teacherPackageTierSetting.upsert({
    where: {
      teacherId_tierId: {
        teacherId: teacher.id,
        tierId
      }
    },
    create: {
      teacherId: teacher.id,
      tierId,
      isEnabled
    },
    update: {
      isEnabled
    }
  });
}
```

---

## Admin Emergency Reschedule Override

### Admin Panel: Booking Management

```typescript
// apps/web/src/app/admin/bookings/[id]/page.tsx

export default function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const { data: booking } = useQuery({
    queryKey: ['admin', 'booking', params.id],
    queryFn: () => adminApi.getBooking(params.id),
  });

  return (
    <div className="space-y-6">
      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking #{booking?.readableId}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... booking details ... */}
        </CardContent>
      </Card>

      {/* Admin Override Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Override system rules for emergency situations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Emergency Reschedule */}
          <div>
            <Label className="text-base font-semibold">Emergency Reschedule</Label>
            <p className="text-sm text-gray-500 mb-3">
              Override reschedule limit and 24h notice requirement
            </p>
            <Button
              variant="outline"
              onClick={handleEmergencyReschedule}
              disabled={booking?.status === 'COMPLETED'}
            >
              <Clock className="w-4 h-4 mr-2" />
              Emergency Reschedule
            </Button>
          </div>

          <Separator />

          {/* Force Completion */}
          <div>
            <Label className="text-base font-semibold">Force Completion</Label>
            <p className="text-sm text-gray-500 mb-3">
              Mark session as completed and release payment
            </p>
            <Button
              variant="outline"
              onClick={handleForceComplete}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Force Complete
            </Button>
          </div>

          <Separator />

          {/* Manual Refund */}
          <div>
            <Label className="text-base font-semibold">Manual Refund</Label>
            <p className="text-sm text-gray-500 mb-3">
              Cancel booking and issue refund
            </p>
            <Button
              variant="destructive"
              onClick={handleManualRefund}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel & Refund
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Backend: Admin Override Endpoints

```typescript
// apps/api/src/admin/admin.controller.ts

@Post('bookings/:id/emergency-reschedule')
@UseGuards(JwtAuthGuard, AdminGuard)
async emergencyReschedule(
  @Param('id') bookingId: string,
  @Request() req,
  @Body() dto: EmergencyRescheduleDto
) {
  return this.adminService.emergencyReschedule(
    bookingId,
    dto.newStartTime,
    dto.newEndTime,
    dto.reason,
    req.user.userId  // Admin who performed override
  );
}
```

```typescript
// apps/api/src/admin/admin.service.ts

async emergencyReschedule(
  bookingId: string,
  newStartTime: Date,
  newEndTime: Date,
  reason: string,
  adminUserId: string
) {
  const booking = await this.prisma.booking.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new NotFoundException('Booking not found');
  }

  // ADMIN OVERRIDE: Bypass reschedule limit and 24h notice
  return this.prisma.$transaction(async (tx) => {
    // Update booking with new time
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        originalScheduledAt: booking.originalScheduledAt || booking.startTime,
        // DON'T increment rescheduleCount - admin override doesn't count
      }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'EMERGENCY_RESCHEDULE',
        entityType: 'BOOKING',
        entityId: bookingId,
        metadata: {
          oldStartTime: booking.startTime,
          newStartTime,
          reason,
          rescheduleCount: booking.rescheduleCount,
          adminOverride: true,
        }
      }
    });

    return updated;
  });
}
```

---

## Refund Strategy Discussion

### Option 1: Auto-Refund (Recommended)

**Pros**:
- Fully automated, no manual work
- Immediate refund on expiry
- Clear, predictable UX

**Cons**:
- Some users may forget they had unused sessions

**Implementation**:
```typescript
@Cron('0 0 * * *') // Daily at midnight
async autoRefundExpiredFloatingSessions() {
  const expiredPackages = await this.prisma.studentPackage.findMany({
    where: {
      status: 'ACTIVE',
      gracePeriodEnds: { lte: new Date() },
    }
  });

  for (const pkg of expiredPackages) {
    const unbookedFloating = pkg.floatingSessionCount - pkg.floatingSessionsUsed;

    if (unbookedFloating > 0) {
      const refundAmount = pkg.discountedPricePerSession * unbookedFloating;

      await this.refundToWallet(pkg.payerId, refundAmount, {
        reason: 'AUTO_REFUND_UNUSED_FLOATING',
        packageId: pkg.id,
        sessionCount: unbookedFloating,
      });

      // Send notification
      await this.notificationService.send({
        userId: pkg.payerId,
        type: 'PACKAGE_EXPIRED_REFUND',
        data: {
          packageId: pkg.readableId,
          refundAmount,
          unusedSessions: unbookedFloating,
        }
      });
    }

    // Mark as expired
    await this.prisma.studentPackage.update({
      where: { id: pkg.id },
      data: { status: 'EXPIRED' }
    });
  }
}
```

### Option 2: Manual Request (Not Recommended)

**Pros**:
- Lower refund rate (users forget to claim)

**Cons**:
- Poor UX, feels like platform is trying to keep money
- Support burden (users asking for refunds)
- Trust issues

---

## Summary of Changes

### Database Changes
1. ✅ Enhanced `PackageTier` with configurable ratios, duration, grace period
2. ✅ New `TeacherPackageTierSetting` for teacher opt-in/opt-out
3. ✅ Updated `TeacherDemoSettings` with `packagesEnabled` flag
4. ✅ Updated `StudentPackage` with dynamic tier references

### Admin Features
1. ✅ Full CRUD for package tiers
2. ✅ Configure session distribution (recurring/floating ratio)
3. ✅ Configure duration, grace period, reschedule limits
4. ✅ Emergency reschedule override
5. ✅ Force completion/manual refund

### Teacher Features
1. ✅ Master toggle for packages (enable/disable all)
2. ✅ Per-tier enable/disable (selectively offer 5, 10, or 20-session packages)
3. ✅ Independent demo session toggle

### Student Experience
1. ✅ View available package tiers (filtered by teacher's enabled tiers)
2. ✅ Purchase flow adapts to tier configuration
3. ✅ Auto-refund for unused floating sessions on expiry

---

## Revised Timeline

| Phase | Days | Tasks |
|-------|------|-------|
| 1. Enhanced Schema | 2-3 | Add tier config fields, teacher settings, migration |
| 2. Admin UI | 3-4 | Tier CRUD, emergency override |
| 3. Backend Logic | 4-5 | Dynamic tier handling, validations |
| 4. Teacher UI | 2-3 | Settings page for tier enable/disable |
| 5. Student UI | 3-4 | Dynamic tier selection, purchase flow |
| 6. Testing | 3-4 | Unit, integration, E2E tests |
| 7. Deployment | 2 | Migration, rollout, monitoring |

**Total**: ~20-23 days (4-5 weeks)

---

## Next Steps

1. **Confirm Refund Strategy**: Auto-refund vs manual request?
2. **Default Tier Configuration**: What initial tiers should we seed?
   - Suggested: 5 sessions (5% discount), 10 sessions (10%), 15 sessions (15%), 20 sessions (20%)
3. **Grace Period Default**: 14 days reasonable for all tiers?
4. **Begin Phase 1**: Database schema enhancement + migration script

Let me know your decision on the refund strategy and I'll proceed with implementation!
