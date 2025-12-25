/**
 * Demo Policy Constants
 * 
 * Controls demo anti-abuse limits.
 * Architecture allows future migration to DB-based admin configuration.
 */

export const DEMO_POLICY = {
    /**
     * Maximum demos per owner (Parent or Student) per month
     * COMPLETED + CANCELLED both count toward this limit
     */
    maxDemosPerOwnerPerMonth: 3,

    /**
     * Minimum hours before demo start that reschedule is allowed
     */
    demoRescheduleWindowHours: 6,

    /**
     * Maximum times a demo can be rescheduled (per session)
     */
    demoMaxReschedules: 1,
} as const;

export type DemoPolicy = typeof DEMO_POLICY;
