
import { SessionUtil } from '../apps/api/src/common/utils/session.util';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

console.log('--- Verifying Active Session Logic (SessionUtil) ---');

const now = new Date('2024-01-01T12:00:00Z');

// Scenario 1: Active Session (Running right now)
// 11:00 -> 13:00. Now is 12:00.
assert(
    SessionUtil.isSessionActive(new Date('2024-01-01T11:00:00Z'), new Date('2024-01-01T13:00:00Z'), now) === true,
    'Session running during current time should be ACTIVE'
);

// Scenario 2: Finished Session
// 10:00 -> 11:00. Now is 12:00.
assert(
    SessionUtil.isSessionActive(new Date('2024-01-01T10:00:00Z'), new Date('2024-01-01T11:00:00Z'), now) === false,
    'Past session should NOT be active'
);

// Scenario 3: Future Session (Starts later)
// 13:00 -> 14:00. Now is 12:00.
assert(
    SessionUtil.isSessionActive(new Date('2024-01-01T13:00:00Z'), new Date('2024-01-01T14:00:00Z'), now) === false,
    'Future session should NOT be active'
);

// Scenario 4: Joinable Session (Starts in 5 min)
// 12:05 -> 13:05. Now is 12:00. Default buffer 10m.
assert(
    SessionUtil.isSessionJoinable(new Date('2024-01-01T12:05:00Z'), new Date('2024-01-01T13:05:00Z'), now) === true,
    'Session starting in 5 mins should be JOINABLE'
);

// Scenario 5: Not Joinable (Starts in 15 min)
// 12:15 -> 13:15. Now is 12:00. Buffer 10m.
assert(
    SessionUtil.isSessionJoinable(new Date('2024-01-01T12:15:00Z'), new Date('2024-01-01T13:15:00Z'), now) === false,
    'Session starting in 15 mins should NOT be joinable yet'
);

// Scenario 6: Late Session (Started 6 mins ago)
// 11:54 -> 12:54. Now is 12:00. Buffer 5m.
assert(
    SessionUtil.isSessionLate(new Date('2024-01-01T11:54:00Z'), now) === true,
    'Session started 6 mins ago should be LATE (> 5 min buffer)'
);

// Scenario 7: Not Late (Future)
assert(
    SessionUtil.isSessionLate(new Date('2024-01-01T12:05:00Z'), now) === false,
    'Future session is NOT late'
);

console.log('--- All Tests Passed ---');
