import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { ALLOWED_EVENTS, AnalyticsEvent, EventProperties } from '@sidra/shared';

/**
 * Server-side PostHog service for tracking backend events
 * Used for: payment webhooks, session completion, support tickets, etc.
 */
@Injectable()
export class PostHogService implements OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY;
    if (apiKey) {
      this.client = new PostHog(apiKey, {
        host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 20, // Batch events before sending
        flushInterval: 10000, // Flush every 10 seconds
      });
      this.logger.log('PostHog server-side analytics initialized');
    } else {
      this.logger.warn(
        'POSTHOG_API_KEY not set, server-side analytics disabled',
      );
    }
  }

  /**
   * Track a server-side event (type-safe)
   */
  capture<E extends AnalyticsEvent>(
    distinctId: string,
    event: E,
    properties?: E extends keyof EventProperties
      ? EventProperties[E]
      : Record<string, unknown>,
  ): void {
    if (!this.client) return;

    // Validate against shared allowlist
    if (!ALLOWED_EVENTS.has(event)) {
      this.logger.debug(`Event "${event}" not in allowlist, skipping`);
      return;
    }

    this.client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        environment: process.env.NODE_ENV,
      },
    });
  }

  /**
   * Identify user with properties (server-side)
   */
  identify(distinctId: string, properties: Record<string, unknown>): void {
    if (!this.client) return;

    this.client.identify({
      distinctId,
      properties,
    });
  }

  /**
   * Set group for organization/school
   */
  groupIdentify(
    groupType: string,
    groupKey: string,
    properties?: Record<string, unknown>,
  ): void {
    if (!this.client || !groupKey) return;

    this.client.groupIdentify({
      groupType,
      groupKey,
      properties,
    });
  }

  /**
   * Capture event with group context
   */
  captureWithGroup(
    distinctId: string,
    event: AnalyticsEvent,
    properties: Record<string, unknown>,
    groups: { organization?: string },
  ): void {
    if (!this.client) return;
    if (!ALLOWED_EVENTS.has(event)) return;

    this.client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        environment: process.env.NODE_ENV,
      },
      groups,
    });
  }

  /**
   * Flush pending events and shutdown client
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.shutdown();
      this.logger.log('PostHog client shutdown complete');
    }
  }
}
