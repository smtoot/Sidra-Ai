# Admin Roles with Per-User Permission Overrides

## Goal

Enable SUPER_ADMIN to create sub-admins and moderators with customizable permissions. Each role has default permissions, but individual users can have extra permissions added or default permissions removed.

---

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///Users/omerheathrow/Sidra-Ai/packages/database/prisma/schema.prisma)

**Update UserRole enum:**
```prisma
enum UserRole {
  PARENT
  STUDENT
  TEACHER
  SUPER_ADMIN   // NEW - Full access, can create other admins
  ADMIN         // Full admin access (cannot create admins)
  MODERATOR     // NEW - Teacher reviews, disputes, bookings
  CONTENT_ADMIN // NEW - CMS management only
  FINANCE       // NEW - Wallet and payouts only
  SUPPORT       // Already exists - Read-only access
}
```

**Add to User model:**
```prisma
model User {
  // ... existing fields ...
  
  // Permission overrides (JSON)
  // Format: { "add": ["finance.approve"], "remove": ["disputes.resolve"] }
  permissionOverrides Json?
  
  // Admin metadata
  createdByAdminId    String?   // Who created this admin user
  createdByAdmin      User?     @relation("AdminCreator", fields: [createdByAdminId], references: [id])
  createdAdmins       User[]    @relation("AdminCreator")
}
```

---

### 2. Permission Constants

#### [NEW] [permissions.constants.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/auth/permissions.constants.ts)

Define all permissions and role mappings:

```typescript
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_BAN: 'users.ban',
  
  // Teacher Management
  TEACHERS_VIEW: 'teachers.view',
  TEACHERS_APPROVE: 'teachers.approve',
  
  // Disputes
  DISPUTES_VIEW: 'disputes.view',
  DISPUTES_RESOLVE: 'disputes.resolve',
  
  // Bookings
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_CANCEL: 'bookings.cancel',
  
  // CMS
  CMS_MANAGE: 'cms.manage',
  
  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_APPROVE: 'finance.approve',
  
  // Settings
  SETTINGS_UPDATE: 'settings.update',
  
  // Admin Management
  ADMINS_CREATE: 'admins.create',
  ADMINS_VIEW: 'admins.view',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  
  ADMIN: [
    'users.*', 'teachers.*', 'disputes.*', 'bookings.*',
    'cms.*', 'finance.*', 'settings.*', 'admins.view'
  ],
  
  MODERATOR: [
    'users.view', 'teachers.*', 'disputes.*', 'bookings.*'
  ],
  
  CONTENT_ADMIN: ['cms.*'],
  
  FINANCE: ['finance.*'],
  
  SUPPORT: [
    'users.view', 'teachers.view', 'disputes.view',
    'bookings.view', 'finance.view'
  ],
};
```

---

### 3. Permission Service

#### [NEW] [permission.service.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/auth/permission.service.ts)

Core permission checking logic:

```typescript
@Injectable()
export class PermissionService {
  
  hasPermission(user: UserWithOverrides, permission: string): boolean {
    // SUPER_ADMIN has all permissions
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Get base permissions for role
    const basePerms = this.expandWildcards(ROLE_PERMISSIONS[user.role] || []);
    
    // Apply overrides
    const overrides = user.permissionOverrides as PermissionOverrides || {};
    
    // Explicitly removed?
    if (overrides.remove?.includes(permission)) return false;
    
    // Explicitly added?
    if (overrides.add?.includes(permission)) return true;
    
    // Check base permissions
    return basePerms.includes(permission);
  }
  
  getEffectivePermissions(user: UserWithOverrides): string[] {
    // Returns full list of what user can do
  }
}
```

---

### 4. Permissions Guard

#### [NEW] [permissions.guard.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/auth/permissions.guard.ts)

Decorator-based permission checking:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );
    
    if (!requiredPermissions) return true;
    
    const { user } = context.switchToHttp().getRequest();
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, permissionOverrides: true }
    });
    
    return requiredPermissions.every(perm => 
      this.permissionService.hasPermission(fullUser, perm)
    );
  }
}
```

#### [NEW] [permissions.decorator.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/auth/permissions.decorator.ts)

```typescript
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

---

### 5. Update Admin Endpoints

#### [MODIFY] [admin.controller.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/admin/admin.controller.ts)

Replace `@Roles(UserRole.ADMIN)` with granular permissions:

```typescript
// Before
@Roles(UserRole.ADMIN)
async getTeacherApplications() {}

// After
@UseGuards(PermissionsGuard)
@RequirePermissions(PERMISSIONS.TEACHERS_VIEW)
async getTeacherApplications() {}

@UseGuards(PermissionsGuard)
@RequirePermissions(PERMISSIONS.TEACHERS_APPROVE)
async approveTeacher() {}
```

---

### 6. Admin Team Management

#### [NEW] [admin-team.controller.ts](file:///Users/omerheathrow/Sidra-Ai/apps/api/src/admin/admin-team.controller.ts)

Endpoints for managing admin users:

| Endpoint | Permission | Description |
|----------|------------|-------------|
| `GET /admin/team` | `admins.view` | List all admin users |
| `POST /admin/team` | `admins.create` | Create new admin |
| `PATCH /admin/team/:id/permissions` | `admins.create` | Update permission overrides |
| `DELETE /admin/team/:id` | `admins.create` | Deactivate admin |

---

### 7. Frontend Changes

#### [NEW] [/admin/team/page.tsx](file:///Users/omerheathrow/Sidra-Ai/apps/web/src/app/admin/team/page.tsx)

Admin team management UI with:
- List of admin users with roles
- Create new admin form
- Permission override editor (checkboxes)

#### [MODIFY] Admin Navigation

Filter nav items based on user permissions from JWT or API.

---

## Verification Plan

### Automated Tests

No existing tests found for admin role checking. The following **manual verification** will be performed:

### Manual Verification Steps

1. **Create MODERATOR user via database seed**
   - Login as moderator
   - Verify access to: Teacher Applications, Disputes, Bookings
   - Verify NO access to: CMS, Finance, Settings, Team

2. **Test Permission Override: ADD**
   - Give a MODERATOR user `add: ["finance.view"]`
   - Verify they can now view finance page (but not approve)

3. **Test Permission Override: REMOVE**
   - Give a MODERATOR user `remove: ["disputes.resolve"]`
   - Verify they can view disputes but resolve button is hidden/disabled

4. **Test SUPER_ADMIN team creation**
   - Login as SUPER_ADMIN
   - Create new MODERATOR user via Team page
   - Verify new user can login and has correct access

5. **Test non-admin rejection**
   - Login as TEACHER
   - Try to access `/admin/*` routes
   - Verify 403 Forbidden

---

## Questions for You

1. **Existing ADMIN users**: Should your current admin account become `SUPER_ADMIN`?

2. **SUPPORT role**: Already exists in enum. What should SUPPORT users be able to do?
   - Current plan: View-only access to everything

3. **Admin creation flow**: Should new admins:
   - Receive email with temp password?
   - Or you manually share credentials?

4. **Frontend scope**: Do you want full Team Management page now, or just backend first?
