export type AuditAction =
    | 'SETTINGS_UPDATE'
    | 'USER_BAN'
    | 'USER_UNBAN'
    | 'USER_VERIFY'
    | 'USER_REJECT'
    | 'DISPUTE_RESOLVE'
    | 'DISPUTE_DISMISS'
    | 'PAYOUT_PROCESS'
    | 'BOOKING_CANCEL'
    | 'REFUND_PROCESS';
