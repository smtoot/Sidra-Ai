# Support Ticket System - Architecture & Implementation Plan

**Status:** Approved for Implementation
**Last Updated:** 2025-12-28
**Author:** Senior Product Architect & Backend Lead
**Decision Maker:** Product Owner

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Architectural Principles](#core-architectural-principles)
3. [Design Decisions Summary](#design-decisions-summary)
4. [Database Schema](#database-schema)
5. [API Specification](#api-specification)
6. [Permission Model](#permission-model)
7. [State Machine & Business Rules](#state-machine--business-rules)
8. [Integration with Dispute System](#integration-with-dispute-system)
9. [Migration Strategy](#migration-strategy)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Risk Mitigation](#risk-mitigation)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

### Problem Statement
Currently, students, parents, and teachers have no structured way to contact support. Issues are handled via WhatsApp, phone calls, or informal channels, leading to:
- Lost communication history
- No accountability or SLA tracking
- Admin overload
- Inability to scale support operations

### Solution Overview
Implement a **unified Support Ticket System** that:
- Provides structured communication channels for all user types
- Integrates seamlessly with the existing Dispute System (without replacing it)
- Enables L1/L2/L3 escalation to reduce admin workload
- Maintains full audit trails and SLA tracking
- Scales to handle growing user base

### Key Architectural Decision
**Ticket is the base container. Dispute is a specialized type of Ticket.**

- Every Dispute IS a Ticket (with `type: DISPUTE`)
- NOT every Ticket is a Dispute
- Existing Dispute table and financial logic remain **completely intact**
- Bidirectional linking: `SupportTicket.disputeId ↔ Dispute.supportTicketId`

---

## Core Architectural Principles

### 1. **Non-Breaking Integration**
- Existing dispute creation flow continues to work as-is
- Dispute resolution UI unchanged
- Financial logic (payment freeze, escrow, payout) remains in Dispute domain
- Zero downtime migration

### 2. **Single Source of Truth**
- **Financial state:** Dispute table (authoritative)
- **Communication state:** SupportTicket table (authoritative)
- **Resolution state:** Dispute table drives SupportTicket updates (one-way sync)

### 3. **Clear Separation of Concerns**
```
SupportTicket (Communication Container)
    ├── Normal tickets: Full lifecycle (create, reply, escalate, close, reopen)
    └── Dispute tickets: Linked to Dispute record (restricted lifecycle)

Dispute (Financial Decision Engine)
    ├── Payment freeze logic
    ├── Escrow management
    ├── Payout/refund calculations
    └── Admin resolution workflow
```

### 4. **Fail-Safe Design**
- If ticket creation fails, dispute creation still succeeds
- If sync fails, reconciliation job fixes drift
- Idempotent operations (safe to retry)

---

## Design Decisions Summary

Based on stakeholder input, the following decisions have been made:

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Historical Disputes** | No backfill | Faster implementation, less risk. Only new disputes create tickets. |
| **Multiple Disputes Per Booking** | Block (1 dispute per booking) | Maintains current database constraint. Appeals handled via ticket messages. |
| **Status Sync Strategy** | Event-driven (Webhook/Emitter) | Real-time sync, reliable, scalable. |
| **Teacher Access After Conversion** | Revoke immediately | Protects user privacy, matches current dispute model. |
| **Dispute Table** | Keep separate | Zero risk to financial logic, clear separation of concerns. |
| **Ticket Reopening** | Allowed for SUPPORT, blocked for DISPUTE | Disputes are immutable after resolution (financial finality). |

---

## Database Schema

### New Tables

#### SupportTicket
```prisma
model SupportTicket {
  id                    String              @id @default(uuid())
  readableId            String              @unique // TKT-2501-0001

  // Ownership
  createdByUserId       String              @db.Uuid
  assignedToId          String?             @db.Uuid

  // Classification
  category              TicketCategory      // ACADEMIC, SESSION, FINANCIAL, TECHNICAL, BEHAVIORAL, GENERAL
  type                  TicketType          @default(SUPPORT) // SUPPORT | DISPUTE
  priority              TicketPriority      @default(NORMAL)
  status                TicketStatus        @default(OPEN)

  // Context Linking (all optional)
  linkedBookingId       String?             @db.Uuid
  linkedPaymentId       String?             @db.Uuid
  linkedTeacherId       String?             @db.Uuid
  linkedStudentId       String?             @db.Uuid

  // Content
  subject               String
  description           String              @db.Text
  evidence              String[]            @default([]) // S3 URLs

  // SLA & Escalation
  escalationLevel       EscalationLevel     @default(L1)
  slaDeadline           DateTime?
  slaBreach             Boolean             @default(false)

  // Resolution
  resolvedAt            DateTime?
  resolvedByUserId      String?             @db.Uuid
  resolutionNote        String?             @db.Text

  // Dispute Integration
  disputeId             String?             @unique @db.Uuid // Foreign key to Dispute table

  // Audit
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  closedAt              DateTime?
  lastActivityAt        DateTime            @default(now())

  // Relations
  createdBy             User                @relation("TicketCreator", fields: [createdByUserId], references: [id])
  assignedTo            User?               @relation("TicketAssignee", fields: [assignedToId], references: [id])
  resolvedBy            User?               @relation("TicketResolver", fields: [resolvedByUserId], references: [id])

  linkedBooking         Booking?            @relation(fields: [linkedBookingId], references: [id], onDelete: SET NULL)
  linkedPayment         Payment?            @relation(fields: [linkedPaymentId], references: [id], onDelete: SET NULL)
  linkedTeacher         TeacherProfile?     @relation(fields: [linkedTeacherId], references: [id], onDelete: SET NULL)
  linkedStudent         StudentProfile?     @relation(fields: [linkedStudentId], references: [id], onDelete: SET NULL)

  dispute               Dispute?            @relation(fields: [disputeId], references: [id])
  messages              TicketMessage[]
  statusHistory         TicketStatusHistory[]
  accessControls        TicketAccessControl[]

  @@index([createdByUserId])
  @@index([assignedToId])
  @@index([status, priority])
  @@index([type, status])
  @@index([linkedBookingId])
  @@index([escalationLevel, slaBreach])
  @@index([lastActivityAt])
  @@map("support_tickets")
}

enum TicketCategory {
  ACADEMIC        // Curriculum, teaching methods, learning issues
  SESSION         // Scheduling, attendance, session quality
  FINANCIAL       // Payments, refunds, wallet issues
  TECHNICAL       // Platform bugs, login issues, performance
  BEHAVIORAL      // Teacher/student conduct, professionalism
  GENERAL         // Everything else
}

enum TicketType {
  SUPPORT         // Normal support ticket (full lifecycle)
  DISPUTE         // Financial dispute (restricted lifecycle, links to Dispute table)
}

enum TicketStatus {
  OPEN                    // Newly created, awaiting assignment
  IN_PROGRESS             // Someone is working on it
  WAITING_FOR_CUSTOMER    // Waiting for user to reply
  WAITING_FOR_SUPPORT     // Waiting for support/teacher to reply
  RESOLVED                // Issue resolved, awaiting auto-close
  CLOSED                  // Fully closed (can be reopened for SUPPORT type)
  CANCELLED               // User cancelled before resolution
}

enum TicketPriority {
  CRITICAL    // Financial disputes, payment issues, safety concerns (SLA: 2h)
  HIGH        // Session disruptions, booking problems (SLA: 12h)
  NORMAL      // General support, account questions (SLA: 24h)
  LOW         // Feature requests, documentation (SLA: 72h)
}

enum EscalationLevel {
  L1    // Teacher (for session tickets) or automated response
  L2    // Support agent (SUPPORT role)
  L3    // Admin/Manager (ADMIN, SUPER_ADMIN roles)
}
```

#### TicketMessage
```prisma
model TicketMessage {
  id                    String              @id @default(uuid())
  ticketId              String              @db.Uuid
  authorId              String              @db.Uuid

  content               String              @db.Text
  attachments           String[]            @default([])
  isInternal            Boolean             @default(false) // Only visible to SUPPORT/ADMIN
  isSystemGenerated     Boolean             @default(false) // Auto-generated notifications

  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  deletedAt             DateTime?           // Soft delete

  ticket                SupportTicket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author                User                @relation(fields: [authorId], references: [id])

  @@index([ticketId, createdAt])
  @@index([authorId])
  @@map("ticket_messages")
}
```

#### TicketStatusHistory
```prisma
model TicketStatusHistory {
  id                    String              @id @default(uuid())
  ticketId              String              @db.Uuid

  fromStatus            TicketStatus?       // NULL for initial creation
  toStatus              TicketStatus
  changedByUserId       String              @db.Uuid
  reason                String?             @db.Text

  createdAt             DateTime            @default(now())

  ticket                SupportTicket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  changedBy             User                @relation(fields: [changedByUserId], references: [id])

  @@index([ticketId, createdAt])
  @@map("ticket_status_history")
}
```

#### TicketAccessControl
```prisma
model TicketAccessControl {
  id                    String              @id @default(uuid())
  ticketId              String              @db.Uuid
  userId                String              @db.Uuid

  canView               Boolean             @default(true)
  canReply              Boolean             @default(true)
  canClose              Boolean             @default(false)
  canReopen             Boolean             @default(false)

  revokedAt             DateTime?
  revokedByUserId       String?             @db.Uuid
  revokedReason         String?

  createdAt             DateTime            @default(now())

  ticket                SupportTicket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user                  User                @relation(fields: [userId], references: [id])
  revokedBy             User?               @relation("AccessRevoker", fields: [revokedByUserId], references: [id])

  @@unique([ticketId, userId])
  @@index([userId])
  @@map("ticket_access_controls")
}
```

### Updated Existing Table

#### Dispute (ADD ONE FIELD)
```prisma
model Dispute {
  // ... all existing fields unchanged ...

  // NEW: Bidirectional link to SupportTicket
  supportTicketId       String?             @unique @db.Uuid
  supportTicket         SupportTicket?      @relation(fields: [supportTicketId], references: [id])
}
```

---

## API Specification

### Endpoints

#### User/Parent/Teacher Endpoints
```typescript
// Create new support ticket
POST /support-tickets
Body: CreateSupportTicketDto
Response: SupportTicketDto
Auth: JwtAuthGuard

// List my tickets (paginated)
GET /support-tickets
Query: { page?, limit?, status?, category?, type? }
Response: PaginatedResponse<SupportTicketDto>
Auth: JwtAuthGuard

// Get ticket details (if authorized)
GET /support-tickets/:id
Response: SupportTicketDetailDto
Auth: JwtAuthGuard + TicketAccessGuard

// Add message to ticket
POST /support-tickets/:id/messages
Body: CreateMessageDto
Response: TicketMessageDto
Auth: JwtAuthGuard + TicketAccessGuard

// Close ticket (only if user is creator and type = SUPPORT)
PATCH /support-tickets/:id/close
Response: SupportTicketDto
Auth: JwtAuthGuard + TicketAccessGuard

// Reopen ticket (only if type = SUPPORT)
PATCH /support-tickets/:id/reopen
Response: SupportTicketDto
Auth: JwtAuthGuard + TicketAccessGuard
```

#### Admin/Support Endpoints
```typescript
// List all tickets (with advanced filters)
GET /admin/support-tickets
Query: {
  page?,
  limit?,
  status?,
  category?,
  type?,
  escalationLevel?,
  assignedToId?,
  createdByUserId?,
  slaBreach?,
  dateFrom?,
  dateTo?
}
Response: PaginatedResponse<SupportTicketDto>
Auth: JwtAuthGuard + PermissionsGuard('tickets.view')

// Assign ticket to support agent
PATCH /admin/support-tickets/:id/assign
Body: { assignedToId: string }
Response: SupportTicketDto
Auth: JwtAuthGuard + PermissionsGuard('tickets.assign')

// Escalate ticket
PATCH /admin/support-tickets/:id/escalate
Body: { toLevel: EscalationLevel, reason?: string }
Response: SupportTicketDto
Auth: JwtAuthGuard + PermissionsGuard('tickets.escalate')

// Convert normal ticket to dispute
POST /admin/support-tickets/:id/convert-to-dispute
Body: { disputeType: DisputeType, reason: string }
Response: SupportTicketDto
Auth: JwtAuthGuard + PermissionsGuard('disputes.create')

// Bulk update (close, assign, escalate)
PATCH /admin/support-tickets/bulk
Body: { ticketIds: string[], action: BulkAction, params: any }
Response: BulkUpdateResultDto
Auth: JwtAuthGuard + PermissionsGuard('tickets.bulk-update')

// Get ticket statistics
GET /admin/support-tickets/stats
Query: { dateFrom?, dateTo?, groupBy? }
Response: TicketStatsDto
Auth: JwtAuthGuard + PermissionsGuard('tickets.view')
```

### DTOs

```typescript
// packages/shared/src/support-ticket/create-support-ticket.dto.ts
export class CreateSupportTicketDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsOptional()
  @IsUUID()
  linkedBookingId?: string;

  @IsOptional()
  @IsUUID()
  linkedPaymentId?: string;

  @IsOptional()
  @IsUUID()
  linkedTeacherId?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  evidence?: string[];
}

// Response DTO
export class SupportTicketDto {
  id: string;
  readableId: string;
  createdByUserId: string;
  assignedToId?: string;
  category: TicketCategory;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  evidence: string[];
  escalationLevel: EscalationLevel;
  slaDeadline?: Date;
  slaBreach: boolean;
  resolvedAt?: Date;
  resolvedByUserId?: string;
  resolutionNote?: string;
  disputeId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  lastActivityAt: Date;

  // Embedded relations
  createdBy?: PublicUserDto;
  assignedTo?: PublicUserDto;
  linkedBooking?: BookingSummaryDto;
  messageCount?: number;
  unreadMessageCount?: number;
}

export class SupportTicketDetailDto extends SupportTicketDto {
  messages: TicketMessageDto[];
  statusHistory: TicketStatusHistoryDto[];
  canReply: boolean;
  canClose: boolean;
  canReopen: boolean;
}

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean; // Only for SUPPORT/ADMIN roles
}

export class TicketMessageDto {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  attachments: string[];
  isInternal: boolean;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  author?: PublicUserDto;
}
```

---

## Permission Model

### Existing Permissions (Extended)
```typescript
// packages/shared/src/auth/permissions.constants.ts

export const PERMISSIONS = {
  // ... existing permissions ...

  // New ticket permissions
  TICKETS: {
    VIEW: 'tickets.view',           // View all tickets
    CREATE: 'tickets.create',       // Create tickets (all users have this)
    ASSIGN: 'tickets.assign',       // Assign tickets to agents
    ESCALATE: 'tickets.escalate',   // Escalate to higher level
    RESOLVE: 'tickets.resolve',     // Mark as resolved
    CLOSE: 'tickets.close',         // Close tickets
    REOPEN: 'tickets.reopen',       // Reopen closed tickets
    DELETE: 'tickets.delete',       // Delete tickets (rare)
    BULK_UPDATE: 'tickets.bulk-update', // Bulk operations
    CONVERT_TO_DISPUTE: 'disputes.create', // Reuse existing dispute permission
  },
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // All permissions

  ADMIN: [
    // ... existing ...
    'tickets.view',
    'tickets.assign',
    'tickets.escalate',
    'tickets.resolve',
    'tickets.close',
    'tickets.reopen',
    'tickets.bulk-update',
    'disputes.create', // Can convert tickets to disputes
  ],

  SUPPORT: [
    // ... existing ...
    'tickets.view',
    'tickets.assign',     // Can assign to themselves or peers
    'tickets.escalate',   // Can escalate to L3 (admin)
    'tickets.resolve',    // Can resolve L1/L2 tickets
    'tickets.close',
    'tickets.reopen',
  ],

  MODERATOR: [
    // ... existing ...
    'tickets.view',       // Read-only
  ],

  // End users (PARENT, STUDENT, TEACHER) have implicit permissions:
  // - Create tickets
  // - View own tickets
  // - Reply to own tickets
  // - Close own tickets (if type = SUPPORT)
};
```

### Custom Access Control

Beyond role-based permissions, ticket-specific access is managed via `TicketAccessControl` table:

```typescript
// apps/api/src/support-ticket/guards/ticket-access.guard.ts

@Injectable()
export class TicketAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ticketId = request.params.id;

    // Admins bypass all checks
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    const ticket = await this.ticketService.findOne(ticketId);

    // Check if user is ticket creator
    if (ticket.createdByUserId === user.userId) {
      return true;
    }

    // Check if user is assigned to ticket
    if (ticket.assignedToId === user.userId) {
      return true;
    }

    // Check TicketAccessControl table
    const accessControl = await this.prisma.ticketAccessControl.findUnique({
      where: {
        ticketId_userId: {
          ticketId,
          userId: user.userId,
        },
      },
    });

    if (accessControl && !accessControl.revokedAt) {
      // Check specific permissions based on HTTP method
      const action = this.getActionFromRequest(request);
      return accessControl[this.getPermissionKey(action)];
    }

    // For teachers: can access tickets about their sessions
    if (user.role === UserRole.TEACHER && ticket.linkedTeacherId === user.teacherId) {
      // BUT: Cannot access if ticket is converted to DISPUTE
      if (ticket.type === TicketType.DISPUTE) {
        return false;
      }
      return true;
    }

    return false;
  }
}
```

---

## State Machine & Business Rules

### Normal Ticket (type: SUPPORT) State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                         NORMAL TICKET LIFECYCLE                   │
└──────────────────────────────────────────────────────────────────┘

                    User creates ticket
                           │
                           ▼
                    ┌─────────────┐
                    │    OPEN     │◄──────────────────┐
                    └──────┬──────┘                   │
                           │                          │
          Support/Teacher assigns self or admin assigns
                           │                          │
                           ▼                          │
                  ┌─────────────────┐                 │
                  │  IN_PROGRESS    │                 │
                  └────────┬─────┬──┘                 │
                           │     │                    │
        User asked ────────┘     └─────── Support asked
        for info                           for info
           │                                    │
           ▼                                    ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │ WAITING_FOR_CUSTOMER │        │ WAITING_FOR_SUPPORT  │
    └──────────┬───────────┘        └──────────┬───────────┘
               │                               │
               └──────────┬────────────────────┘
                          │ Issue resolved
                          ▼
                   ┌─────────────┐
                   │  RESOLVED   │
                   └──────┬──────┘
                          │
                Auto-close after 48h OR manual close
                          │
                          ▼
                   ┌─────────────┐
                   │   CLOSED    │──────► Can REOPEN
                   └─────────────┘        (back to OPEN)

Legend:
  - Any status can transition to CANCELLED (by creator only)
  - RESOLVED → auto-transitions to CLOSED after 48h (if no new messages)
  - CLOSED tickets can be reopened by creator (transitions back to OPEN)
```

### Dispute Ticket (type: DISPUTE) State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│                        DISPUTE TICKET LIFECYCLE                   │
│                   (Restricted - Admin Only)                       │
└──────────────────────────────────────────────────────────────────┘

         User raises dispute OR Admin converts ticket
                           │
                           ▼
                    ┌─────────────┐
                    │    OPEN     │──────► Dispute record created
                    └──────┬──────┘        Payment FROZEN
                           │
                   Admin assigns self
                           │
                           ▼
                  ┌─────────────────┐
                  │  IN_PROGRESS    │───► Admin investigates
                  └────────┬─────────┘    (may contact parties)
                           │
                           │
              Admin resolves via Dispute UI
           (RESOLVED_TEACHER / RESOLVED_STUDENT / SPLIT)
                           │
                           ▼
                   ┌─────────────┐
                   │  RESOLVED   │──────► Payment released
                   └──────┬──────┘        Dispute.status updated
                          │
                Auto-close after 48h (no appeal)
                          │
                          ▼
                   ┌─────────────┐
                   │   CLOSED    │──────► CANNOT REOPEN
                   └─────────────┘        (financial finality)

RESTRICTIONS:
  - User CANNOT reply after dispute created
  - Teacher CANNOT view/reply (access revoked)
  - Only ADMIN can add internal notes
  - Status sync: Dispute → SupportTicket (one-way)
  - Cannot transition back to SUPPORT type
```

### Business Rules

#### Ticket Creation Rules
```typescript
// When user creates a ticket
rules:
  - subject: min 5 chars, max 200 chars
  - description: min 20 chars, max 5000 chars
  - category: required, must be valid enum
  - evidence: optional, max 10 files, each max 10MB
  - linkedBookingId: optional, must exist and user must be related to booking
  - Auto-set priority based on category:
      * FINANCIAL → HIGH
      * SESSION → HIGH
      * TECHNICAL → NORMAL
      * Others → NORMAL
  - Auto-set escalationLevel:
      * If linkedBookingId exists and linkedTeacherId exists → L1 (teacher)
      * Else → L2 (support)
  - Auto-calculate slaDeadline based on priority:
      * CRITICAL → 2 hours
      * HIGH → 12 hours
      * NORMAL → 24 hours
      * LOW → 72 hours
```

#### Message Creation Rules
```typescript
// When adding a message to ticket
rules:
  - content: min 1 char, max 5000 chars
  - attachments: optional, max 5 files
  - isInternal:
      * If author is SUPPORT/ADMIN → allowed
      * Else → force false (cannot create internal notes)
  - Auto-update ticket.lastActivityAt to now()
  - If ticket.status === 'WAITING_FOR_CUSTOMER' and author is customer → set to 'IN_PROGRESS'
  - If ticket.status === 'WAITING_FOR_SUPPORT' and author is SUPPORT → set to 'IN_PROGRESS'
  - Send notification to other party
```

#### Ticket Conversion Rules
```typescript
// When admin converts SUPPORT ticket to DISPUTE
rules:
  - Ticket must have linkedBookingId (cannot dispute without booking)
  - Booking must NOT already have a dispute (Dispute.bookingId is unique)
  - Create Dispute record with:
      * bookingId = ticket.linkedBookingId
      * raisedByUserId = ticket.createdByUserId
      * type = inferred from ticket.category or manually selected
      * description = ticket.description
      * evidence = ticket.evidence
      * status = 'PENDING'
  - Update ticket:
      * type = 'DISPUTE'
      * disputeId = dispute.id
      * escalationLevel = 'L3' (force admin level)
      * priority = 'CRITICAL' (force highest priority)
  - Revoke teacher access:
      * Update TicketAccessControl set revokedAt = now()
      * Remove teacher from assignedToId if applicable
  - Freeze payment (handled by existing Dispute service)
  - Send notification to all parties
  - Create audit log
```

#### SLA Breach Rules
```typescript
// Background job runs every 5 minutes
rules:
  - For each ticket with status IN_PROGRESS or WAITING_FOR_SUPPORT:
      * If now() > slaDeadline and slaBreach === false:
          - Set slaBreach = true
          - Send alert to assignee (if exists)
          - Send alert to admin
          - Create audit log
      * If escalationLevel === L1 and slaBreach === true:
          - Auto-escalate to L2
          - Assign to random available SUPPORT agent
          - Send notification
      * If escalationLevel === L2 and slaBreach === true for 2+ hours:
          - Auto-escalate to L3
          - Assign to admin
          - Send urgent notification
```

#### Auto-Close Rules
```typescript
// Background job runs every hour
rules:
  - For each ticket with status RESOLVED:
      * If now() > resolvedAt + 48 hours:
          - If no new messages since resolvedAt:
              - Set status = 'CLOSED'
              - Set closedAt = now()
              - Send notification to creator
              - Create audit log
          - Else (new messages exist):
              - Do NOT close (conversation ongoing)
```

---

## Integration with Dispute System

### Dispute Creation Flow (Dual Write)

```typescript
// apps/api/src/dispute/dispute.service.ts

async createDispute(data: CreateDisputeDto, userId: string): Promise<Dispute> {
  return await this.prisma.$transaction(async (tx) => {
    // STEP 1: Validate booking
    const booking = await tx.booking.findUnique({
      where: { id: data.bookingId },
      include: { teacher: true, parent: true, student: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // STEP 2: Check if dispute already exists
    const existingDispute = await tx.dispute.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingDispute) {
      throw new ConflictException('Dispute already exists for this booking');
    }

    // STEP 3: Create Dispute record (CRITICAL - must succeed)
    const dispute = await tx.dispute.create({
      data: {
        bookingId: data.bookingId,
        raisedByUserId: userId,
        type: data.type,
        description: data.description,
        evidence: data.evidence,
        status: DisputeStatus.PENDING,
      },
    });

    // STEP 4: Freeze payment (existing logic)
    await this.paymentService.freezeEscrow(booking.paymentId, dispute.id, tx);

    // STEP 5: Create SupportTicket (NEW - non-blocking)
    let ticketId: string | null = null;
    try {
      const readableId = await this.readableIdService.generate('TKT', tx);

      const ticket = await tx.supportTicket.create({
        data: {
          readableId,
          createdByUserId: userId,
          category: TicketCategory.SESSION, // Disputes are always session-related
          type: TicketType.DISPUTE,
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.CRITICAL,
          escalationLevel: EscalationLevel.L3, // Admin only
          subject: `Dispute: ${data.type}`,
          description: data.description,
          evidence: data.evidence,
          linkedBookingId: data.bookingId,
          linkedTeacherId: booking.teacher.id,
          linkedStudentId: booking.student?.id,
          disputeId: dispute.id,
          slaDeadline: this.calculateSLA(TicketPriority.CRITICAL), // 2 hours
        },
      });

      ticketId = ticket.id;

      // Link back to dispute
      await tx.dispute.update({
        where: { id: dispute.id },
        data: { supportTicketId: ticket.id },
      });

      // Create initial system message
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: userId,
          content: `Dispute raised: ${data.description}`,
          isSystemGenerated: true,
        },
      });

    } catch (ticketError) {
      // Log error but DO NOT fail transaction
      this.logger.error(
        `Failed to create support ticket for dispute ${dispute.id}`,
        ticketError
      );
      // Dispute creation still succeeds
    }

    // STEP 6: Notifications
    await this.notificationService.notifyUser({
      userId,
      type: NotificationType.DISPUTE_RAISED,
      title: 'Dispute Submitted',
      message: `Your dispute for booking ${booking.readableId} has been submitted and is under review.`,
      link: ticketId ? `/support/tickets/${ticketId}` : `/disputes/${dispute.id}`,
    });

    await this.notificationService.notifyAdmins({
      type: NotificationType.ADMIN_ALERT,
      title: 'New Dispute Requires Attention',
      message: `Dispute ${dispute.id} raised for booking ${booking.readableId}`,
      link: ticketId ? `/admin/support-tickets/${ticketId}` : `/admin/disputes/${dispute.id}`,
    });

    // STEP 7: Audit log
    await this.auditService.log({
      action: AuditAction.DISPUTE_RAISED,
      actorId: userId,
      targetId: dispute.id,
      payload: { bookingId: data.bookingId, ticketId },
    });

    return dispute;
  });
}
```

### Dispute Resolution Flow (Sync Trigger)

```typescript
// apps/api/src/admin/admin.service.ts

async resolveDispute(
  disputeId: string,
  adminId: string,
  data: ResolveDisputeDto
): Promise<Dispute> {
  return await this.prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      include: { supportTicket: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // STEP 1: Resolve dispute (existing logic)
    const resolvedDispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: data.resolutionType, // RESOLVED_TEACHER_FAVOR, etc.
        resolution: data.resolutionNote,
        teacherPayout: data.teacherPayout,
        studentRefund: data.studentRefund,
        resolvedByAdminId: adminId,
        resolvedAt: new Date(),
      },
    });

    // STEP 2: Release payment (existing logic)
    await this.paymentService.releaseEscrow(
      dispute.bookingId,
      data.teacherPayout,
      data.studentRefund,
      tx
    );

    // STEP 3: Sync to SupportTicket (NEW)
    if (dispute.supportTicket) {
      await tx.supportTicket.update({
        where: { id: dispute.supportTicket.id },
        data: {
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedByUserId: adminId,
          resolutionNote: data.resolutionNote,
        },
      });

      // Create system message with resolution
      await tx.ticketMessage.create({
        data: {
          ticketId: dispute.supportTicket.id,
          authorId: adminId,
          content: `Dispute resolved: ${data.resolutionNote}`,
          isSystemGenerated: true,
        },
      });

      // Schedule auto-close (48 hours)
      await this.scheduleTicketAutoClose(dispute.supportTicket.id, 48 * 60 * 60 * 1000);
    }

    // STEP 4: Notifications
    await this.notificationService.notifyUser({
      userId: dispute.raisedByUserId,
      type: NotificationType.DISPUTE_UPDATE,
      title: 'Dispute Resolved',
      message: `Your dispute has been resolved. Resolution: ${data.resolutionNote}`,
      link: dispute.supportTicket
        ? `/support/tickets/${dispute.supportTicket.id}`
        : `/disputes/${dispute.id}`,
    });

    // STEP 5: Audit log
    await this.auditService.log({
      action: AuditAction.DISPUTE_RESOLVE,
      actorId: adminId,
      targetId: dispute.id,
      payload: {
        resolutionType: data.resolutionType,
        teacherPayout: data.teacherPayout,
        studentRefund: data.studentRefund,
        ticketId: dispute.supportTicket?.id,
      },
    });

    return resolvedDispute;
  });
}
```

### Event-Driven Sync (Recommended)

```typescript
// apps/api/src/dispute/dispute.service.ts

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DisputeService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {}

  async updateDisputeStatus(disputeId: string, newStatus: DisputeStatus) {
    const dispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: newStatus },
    });

    // Emit event (non-blocking)
    this.eventEmitter.emit('dispute.status.changed', {
      disputeId: dispute.id,
      oldStatus: dispute.status,
      newStatus,
      supportTicketId: dispute.supportTicketId,
    });

    return dispute;
  }
}

// apps/api/src/support-ticket/listeners/dispute-sync.listener.ts

@Injectable()
export class DisputeSyncListener {
  constructor(
    private readonly ticketService: SupportTicketService,
    private readonly logger: Logger,
  ) {}

  @OnEvent('dispute.status.changed')
  async handleDisputeStatusChange(payload: DisputeStatusChangedEvent) {
    if (!payload.supportTicketId) {
      return; // No linked ticket, nothing to sync
    }

    try {
      const ticketStatus = this.mapDisputeStatusToTicketStatus(payload.newStatus);

      await this.ticketService.updateStatus(
        payload.supportTicketId,
        ticketStatus,
        'SYSTEM', // System-triggered update
        `Dispute status changed to ${payload.newStatus}`
      );

      this.logger.log(
        `Synced ticket ${payload.supportTicketId} from dispute ${payload.disputeId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync ticket ${payload.supportTicketId} from dispute ${payload.disputeId}`,
        error
      );
      // Do NOT throw - sync failure should not break dispute flow
    }
  }

  private mapDisputeStatusToTicketStatus(disputeStatus: DisputeStatus): TicketStatus {
    switch (disputeStatus) {
      case DisputeStatus.PENDING:
        return TicketStatus.OPEN;
      case DisputeStatus.UNDER_REVIEW:
        return TicketStatus.IN_PROGRESS;
      case DisputeStatus.RESOLVED_TEACHER_FAVOR:
      case DisputeStatus.RESOLVED_STUDENT_FAVOR:
      case DisputeStatus.RESOLVED_SPLIT:
      case DisputeStatus.DISMISSED:
        return TicketStatus.RESOLVED;
      default:
        return TicketStatus.IN_PROGRESS;
    }
  }
}
```

### Reconciliation Job (Failsafe)

```typescript
// apps/api/src/support-ticket/jobs/dispute-sync-reconciliation.job.ts

import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DisputeSyncReconciliationJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  // Run daily at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async reconcileDisputeTicketSync() {
    this.logger.log('Starting dispute-ticket sync reconciliation...');

    // Find tickets that are out of sync with their disputes
    const outOfSyncTickets = await this.prisma.supportTicket.findMany({
      where: {
        type: TicketType.DISPUTE,
        disputeId: { not: null },
        OR: [
          // Dispute is resolved but ticket is not
          {
            dispute: {
              status: {
                in: [
                  DisputeStatus.RESOLVED_TEACHER_FAVOR,
                  DisputeStatus.RESOLVED_STUDENT_FAVOR,
                  DisputeStatus.RESOLVED_SPLIT,
                  DisputeStatus.DISMISSED,
                ],
              },
            },
            status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          },
          // Dispute is under review but ticket is not in progress
          {
            dispute: { status: DisputeStatus.UNDER_REVIEW },
            status: { not: TicketStatus.IN_PROGRESS },
          },
        ],
      },
      include: { dispute: true },
    });

    this.logger.log(`Found ${outOfSyncTickets.length} out-of-sync tickets`);

    // Fix each ticket
    for (const ticket of outOfSyncTickets) {
      try {
        const correctStatus = this.mapDisputeStatusToTicketStatus(ticket.dispute.status);

        await this.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: {
            status: correctStatus,
            resolvedAt: ticket.dispute.resolvedAt,
            resolvedByUserId: ticket.dispute.resolvedByAdminId,
            resolutionNote: ticket.dispute.resolution,
          },
        });

        this.logger.log(
          `Reconciled ticket ${ticket.readableId}: ${ticket.status} → ${correctStatus}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to reconcile ticket ${ticket.readableId}`,
          error
        );
      }
    }

    this.logger.log('Dispute-ticket sync reconciliation completed');
  }

  private mapDisputeStatusToTicketStatus(disputeStatus: DisputeStatus): TicketStatus {
    // Same mapping as DisputeSyncListener
    switch (disputeStatus) {
      case DisputeStatus.PENDING:
        return TicketStatus.OPEN;
      case DisputeStatus.UNDER_REVIEW:
        return TicketStatus.IN_PROGRESS;
      case DisputeStatus.RESOLVED_TEACHER_FAVOR:
      case DisputeStatus.RESOLVED_STUDENT_FAVOR:
      case DisputeStatus.RESOLVED_SPLIT:
      case DisputeStatus.DISMISSED:
        return TicketStatus.RESOLVED;
      default:
        return TicketStatus.IN_PROGRESS;
    }
  }
}
```

---

## Migration Strategy

### Phase 0: Preparation (Week 1)
**Objective:** Database ready, zero user impact

**Tasks:**
- [ ] Create Prisma schema for SupportTicket, TicketMessage, TicketStatusHistory, TicketAccessControl
- [ ] Add `supportTicketId` field to Dispute model
- [ ] Generate migration file
- [ ] Test migration on production database replica
- [ ] Validate schema constraints (foreign keys, indexes)
- [ ] Deploy migration to staging environment
- [ ] Monitor staging for 48 hours (no errors)

**Success Criteria:**
- Migration runs without errors
- Existing dispute queries unaffected
- No performance degradation

---

### Phase 1: Backend Foundation (Week 2-3)
**Objective:** API ready, no frontend changes

**Tasks:**
- [ ] Create `support-ticket` module (NestJS)
- [ ] Implement `SupportTicketService` (CRUD operations)
- [ ] Implement `TicketMessageService`
- [ ] Create DTOs in `@sidra/shared` package
- [ ] Add TicketAccessGuard
- [ ] Extend PermissionsGuard with ticket permissions
- [ ] Update ROLE_PERMISSIONS constants
- [ ] Implement ReadableIdService extension (TKT- prefix)
- [ ] Write unit tests (target: >80% coverage)
- [ ] Write integration tests (ticket creation, message flow)
- [ ] Deploy to staging

**Success Criteria:**
- All API endpoints return 200/201
- Unit tests pass
- Integration tests pass
- Postman collection works

---

### Phase 2: User Ticket Creation (Week 4-5)
**Objective:** Users can create support tickets

**Tasks:**
- [ ] Create ticket creation form component (React)
- [ ] Add category selection dropdown
- [ ] Implement file upload (reuse S3 component)
- [ ] Add "Contact Support" link to parent/teacher/student navigation
- [ ] Create "My Tickets" page (list view)
- [ ] Create ticket detail page (read-only for now)
- [ ] Implement `ticketApi` client methods
- [ ] Add email notification templates (ticket created, ticket updated)
- [ ] Add in-app notifications (TICKET_CREATED, TICKET_UPDATED)
- [ ] Test with real users (beta group: 10 parents, 5 teachers)

**Success Criteria:**
- Users can submit tickets successfully
- Notifications received (email + in-app)
- Tickets visible in database
- No console errors in browser

---

### Phase 3: L1/L2 Response Flow (Week 6-7)
**Objective:** Teachers and support team can respond

**Tasks:**
- [ ] Create ticket detail view with message thread
- [ ] Implement message composer (reply functionality)
- [ ] Add file attachment support for messages
- [ ] Implement L1 routing (notify teacher if ticket about their session)
- [ ] Create "Open Tickets" widget in teacher dashboard
- [ ] Create support team inbox (all tickets, filterable)
- [ ] Implement auto-escalation logic (L1 → L2 after 24h)
- [ ] Create SLA tracking background job
- [ ] Add email notifications for new messages
- [ ] Test with support team (5 agents)

**Success Criteria:**
- Teachers receive notifications for their tickets
- Teachers can reply
- Support team sees all tickets
- Escalation triggers correctly
- SLA alerts sent to admins

---

### Phase 4: Admin Integration (Week 8-9)
**Objective:** Admin sees unified view

**Tasks:**
- [ ] Create admin ticket inbox component
- [ ] Add filters (type, category, status, escalation level, SLA breach)
- [ ] Implement ticket assignment UI
- [ ] Add "Convert to Dispute" button (session tickets only)
- [ ] Implement conversion flow (validation, Dispute creation, access revocation)
- [ ] Update existing Dispute UI to embed in ticket view
- [ ] Add ticket statistics dashboard (KPIs: MTTR, volume, SLA compliance)
- [ ] Implement bulk actions (assign, close, escalate)
- [ ] Add audit log viewer
- [ ] Test with admin team

**Success Criteria:**
- Admin sees all tickets + disputes in one inbox
- Filters work correctly
- Conversion creates Dispute without errors
- Dispute resolution auto-updates ticket
- Statistics accurate

---

### Phase 5: Dispute Integration (Week 10-11)
**Objective:** New disputes create tickets automatically

**Tasks:**
- [ ] Update `disputeService.createDispute()` to dual-write
- [ ] Add event emitter for dispute status changes
- [ ] Implement DisputeSyncListener
- [ ] Add dispute resolution sync (resolveDispute → update ticket)
- [ ] Implement teacher access revocation on conversion
- [ ] Add financial freeze indicator in ticket UI
- [ ] Create reconciliation job (daily sync check)
- [ ] Update notification templates (include ticket link)
- [ ] Test full flow (raise dispute → admin resolves → ticket closes)

**Success Criteria:**
- All new disputes create tickets
- Dispute resolution updates ticket
- Reconciliation job finds no drift
- Notifications include ticket links
- Existing dispute flow unchanged

---

### Phase 6: Polish & Production (Week 12-13)
**Objective:** Production-ready

**Tasks:**
- [ ] Performance testing (simulate 10k tickets, 1k concurrent users)
- [ ] Database query optimization (eliminate N+1)
- [ ] Add Redis caching (ticket counts, unread counts)
- [ ] Implement search (by ticket ID, user email, booking ID)
- [ ] Add ticket export (CSV, Excel)
- [ ] Create canned responses library
- [ ] Write support team runbook
- [ ] Conduct security audit (OWASP top 10)
- [ ] Load testing on staging (simulate Black Friday traffic)
- [ ] Setup monitoring alerts (SLA breaches, high error rates)
- [ ] Deploy to production (feature flag enabled for admins only)

**Success Criteria:**
- <200ms avg response time for ticket list
- <500ms for ticket detail
- Zero N+1 queries
- 99.9% uptime SLA
- Support team trained

---

### Phase 7: Gradual Rollout (Week 14-16)
**Objective:** 100% user adoption

**Week 14:**
- Enable for 10% of users (feature flag)
- Monitor error rates, performance, support load

**Week 15:**
- Enable for 50% of users
- Collect feedback via in-app survey
- Iterate on UX based on feedback

**Week 16:**
- Enable for 100% of users
- Announce via email + in-app banner
- Monitor support ticket volume (expect 2x increase initially)

**Success Criteria:**
- <1% error rate
- User satisfaction >80%
- Support team can handle volume
- Admin workload decreased by 30%

---

## Risk Mitigation

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Dispute table migration fails** | Low | Critical | Test on replica, backup DB, rollback plan ready |
| **Ticket creation breaks dispute flow** | Medium | Critical | Non-blocking try/catch, dual write in transaction |
| **Ticket and Dispute get out of sync** | Medium | High | Event-driven sync + daily reconciliation job |
| **Performance degradation** | Medium | High | Indexes on all foreign keys, pagination, Redis caching |
| **Teacher sees private dispute evidence** | Low | Critical | TicketAccessControl + revocation on conversion |
| **Support team overwhelmed** | High | Medium | L1 routing to teachers, canned responses, auto-escalation |
| **User confusion (where to raise dispute?)** | High | Low | Clear UI prompts, redirect from session completion to dispute flow |
| **SLA breach floods admin** | Medium | Medium | Escalation thresholds, batched alerts (daily digest) |
| **File upload costs spike** | Low | Low | S3 lifecycle rules (delete after 90 days), file size limits |
| **Notification spam** | Medium | Medium | Digest emails (daily summary), notification preferences |

---

## Success Metrics

### Phase 2-3 Metrics (User Ticket Creation)
- **Ticket Volume:** >100 tickets created in first month
- **Response Time:** L1 responds within 12h (75% of tickets)
- **User Satisfaction:** >70% rating (via post-resolution survey)

### Phase 4-5 Metrics (Admin Integration + Dispute Sync)
- **Admin Time Saved:** 30% reduction in time spent on disputes (via time tracking)
- **Sync Accuracy:** <1% drift detected by reconciliation job
- **Conversion Success Rate:** >95% of ticket-to-dispute conversions succeed without errors

### Phase 6-7 Metrics (Production & Rollout)
- **SLA Compliance:** >90% of CRITICAL tickets resolved within 2h
- **Escalation Rate:** <20% of tickets escalate to L3 (admin)
- **First Response Time (FRT):**
  - CRITICAL: <2h
  - HIGH: <12h
  - NORMAL: <24h
  - LOW: <72h
- **Mean Time to Resolution (MTTR):**
  - CRITICAL: <4h
  - HIGH: <24h
  - NORMAL: <48h
  - LOW: <7 days
- **Ticket Reopen Rate:** <10% (indicates good resolution quality)
- **User Adoption:** >50% of users create at least 1 ticket in first 6 months
- **Admin Load:** 40% reduction in WhatsApp/phone support requests

---

## Next Steps

### Before Implementation Begins

1. **Stakeholder Sign-Off**
   - [ ] Product Owner approves architecture
   - [ ] CTO approves technical approach
   - [ ] Finance approves budget for support team expansion
   - [ ] Legal reviews data retention policy for tickets

2. **Resource Allocation**
   - [ ] Assign 2 backend engineers (full-time for 12 weeks)
   - [ ] Assign 1 frontend engineer (full-time for 10 weeks)
   - [ ] Assign 1 QA engineer (part-time for 8 weeks)
   - [ ] Hire/train 3 support agents (start Week 6)

3. **Technical Setup**
   - [ ] Create feature flag in LaunchDarkly (or equivalent)
   - [ ] Setup staging environment with production-like data
   - [ ] Configure monitoring dashboards (DataDog/Grafana)
   - [ ] Setup error tracking (Sentry)

4. **Documentation**
   - [ ] Write API documentation (Swagger)
   - [ ] Write support team runbook
   - [ ] Create user guide (how to create tickets)
   - [ ] Document dispute conversion flow

---

## Appendix

### A. Sample Ticket Workflows

#### Workflow 1: Academic Support (L1 Resolution)
```
1. Parent creates ticket:
   - Category: ACADEMIC
   - Subject: "My child needs help with algebra homework"
   - Linked: bookingId (session with Teacher X)

2. System routes to Teacher X (L1):
   - Teacher receives notification
   - Teacher replies: "I'll create a custom worksheet for next session"
   - Ticket status: IN_PROGRESS → WAITING_FOR_CUSTOMER

3. Parent confirms:
   - "Thank you, that helps!"
   - Ticket status: WAITING_FOR_CUSTOMER → RESOLVED

4. Auto-close after 48h:
   - Ticket status: RESOLVED → CLOSED
   - Total time: 6 hours (SLA: 24h) ✅
```

#### Workflow 2: Payment Issue (L2 Escalation)
```
1. Parent creates ticket:
   - Category: FINANCIAL
   - Subject: "I was charged twice for the same session"
   - Linked: paymentId

2. System routes to L2 (Support):
   - Priority: HIGH (financial issue)
   - Support agent investigates payment logs
   - Agent finds duplicate charge (bug)

3. Support agent responds:
   - "We found the duplicate charge. Refund processed: SAR 150"
   - Ticket status: IN_PROGRESS → RESOLVED

4. Parent confirms:
   - "Received, thank you!"
   - Ticket status: RESOLVED → CLOSED
   - Total time: 3 hours (SLA: 12h) ✅
```

#### Workflow 3: Session Dispute (Conversion to Dispute)
```
1. Parent creates ticket:
   - Category: SESSION
   - Subject: "Teacher never showed up for session"
   - Linked: bookingId

2. Admin reviews:
   - Checks teacher GPS logs (no check-in)
   - Checks chat logs (teacher didn't respond)
   - Decides: Convert to DISPUTE

3. Conversion triggered:
   - Dispute record created
   - Payment frozen
   - Teacher access revoked
   - Ticket type: SUPPORT → DISPUTE

4. Admin resolves via Dispute UI:
   - Decision: RESOLVED_STUDENT_FAVOR
   - Full refund: SAR 200
   - Ticket auto-updates: IN_PROGRESS → RESOLVED

5. Auto-close after 48h:
   - Ticket status: RESOLVED → CLOSED
   - Total time: 18 hours (SLA: 2h for CRITICAL) ⚠️ (acceptable for investigation time)
```

### B. Database Index Strategy

```sql
-- SupportTicket indexes
CREATE INDEX idx_support_tickets_created_by ON support_tickets(created_by_user_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to_id);
CREATE INDEX idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX idx_support_tickets_type_status ON support_tickets(type, status);
CREATE INDEX idx_support_tickets_linked_booking ON support_tickets(linked_booking_id);
CREATE INDEX idx_support_tickets_escalation_sla ON support_tickets(escalation_level, sla_breach);
CREATE INDEX idx_support_tickets_last_activity ON support_tickets(last_activity_at DESC);
CREATE INDEX idx_support_tickets_dispute_id ON support_tickets(dispute_id) WHERE dispute_id IS NOT NULL;

-- TicketMessage indexes
CREATE INDEX idx_ticket_messages_ticket_created ON ticket_messages(ticket_id, created_at DESC);
CREATE INDEX idx_ticket_messages_author ON ticket_messages(author_id);

-- TicketAccessControl indexes
CREATE INDEX idx_ticket_access_user ON ticket_access_controls(user_id);
CREATE UNIQUE INDEX idx_ticket_access_unique ON ticket_access_controls(ticket_id, user_id);

-- Composite index for admin inbox query
CREATE INDEX idx_admin_inbox ON support_tickets(type, status, escalation_level, created_at DESC)
  WHERE status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_SUPPORT');
```

### C. Notification Templates

#### Email: Ticket Created
```html
Subject: [Ticket #{readableId}] Your support request has been received

Dear {userName},

Thank you for contacting Sidra support. Your ticket has been created:

Ticket ID: {readableId}
Category: {category}
Subject: {subject}

Our team will respond within {slaHours} hours.

You can track your ticket here: {ticketUrl}

Best regards,
Sidra Support Team
```

#### Email: Ticket Resolved
```html
Subject: [Ticket #{readableId}] Your issue has been resolved

Dear {userName},

Good news! Your support ticket has been resolved.

Resolution: {resolutionNote}

If you have any further questions, please reply to this ticket within 48 hours.
Otherwise, the ticket will be automatically closed.

View ticket: {ticketUrl}

Best regards,
Sidra Support Team
```

---

**End of Architecture Document**
