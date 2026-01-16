export class SessionUtil {
  /**
   * Checks if a session is currently active (happening now).
   * Active means strict scheduled time: startTime <= now <= endTime
   */
  static isSessionActive(
    startTime: Date | string,
    endTime: Date | string,
    now: Date = new Date(),
  ): boolean {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  }

  /**
   * Checks if a session is joinable (active OR shortly before start).
   * Joinable means: startTime - buffer <= now <= endTime
   * @param bufferMinutes Default 10 minutes
   */
  static isSessionJoinable(
    startTime: Date | string,
    endTime: Date | string,
    now: Date = new Date(),
    bufferMinutes = 10,
  ): boolean {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const joinTime = new Date(start.getTime() - bufferMinutes * 60 * 1000);
    return now >= joinTime && now <= end;
  }

  /**
   * Checks if a session is "late" (started more than X minutes ago).
   * Useful for showing different UI states (e.g. "Running Late" badge).
   * @param bufferMinutes Default 5 minutes
   */
  static isSessionLate(
    startTime: Date | string,
    now: Date = new Date(),
    bufferMinutes = 5,
  ): boolean {
    const start = new Date(startTime);
    const lateThreshold = new Date(start.getTime() + bufferMinutes * 60 * 1000);
    return now > lateThreshold;
  }
}
