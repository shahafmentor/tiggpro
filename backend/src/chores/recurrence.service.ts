import { Injectable } from '@nestjs/common';
import type { RecurrencePattern } from '@tiggpro/shared';

/**
 * RecurrenceService handles date calculations for recurring chores.
 * It determines which dates a recurring chore should be assigned based on
 * the recurrence pattern (daily, weekly, monthly).
 */
@Injectable()
export class RecurrenceService {
  /**
   * Generate all occurrence dates between startDate and endDate (inclusive)
   * based on the recurrence pattern.
   *
   * @param pattern - The recurrence pattern configuration
   * @param fromDate - Start of the date range to generate (inclusive)
   * @param toDate - End of the date range to generate (inclusive)
   * @returns Array of dates when the chore should occur
   */
  generateOccurrences(
    pattern: RecurrencePattern,
    fromDate: Date,
    toDate: Date,
  ): Date[] {
    const occurrences: Date[] = [];

    // Normalize dates to start of day in local timezone
    const start = this.startOfDay(fromDate);
    const end = this.startOfDay(toDate);

    // Check if pattern has an end date that's before our range
    if (pattern.endDate) {
      const patternEnd = this.parseDate(pattern.endDate);
      if (patternEnd < start) {
        return [];
      }
      // Limit the end date to the pattern's end date if it's earlier
      if (patternEnd < end) {
        return this.generateOccurrences(pattern, fromDate, patternEnd);
      }
    }

    // Check if pattern has a start date that's after our range
    if (pattern.startDate) {
      const patternStart = this.parseDate(pattern.startDate);
      if (patternStart > end) {
        return [];
      }
      // Adjust start date to pattern's start date if it's later
      if (patternStart > start) {
        return this.generateOccurrences(pattern, patternStart, toDate);
      }
    }

    switch (pattern.type) {
      case 'daily':
        return this.generateDailyOccurrences(start, end);
      case 'weekly':
        return this.generateWeeklyOccurrences(pattern, start, end);
      case 'monthly':
        return this.generateMonthlyOccurrences(pattern, start, end);
      default:
        return occurrences;
    }
  }

  /**
   * Generate daily occurrences - every day between start and end.
   */
  private generateDailyOccurrences(start: Date, end: Date): Date[] {
    const occurrences: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      occurrences.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return occurrences;
  }

  /**
   * Generate weekly occurrences based on specified days of the week.
   * daysOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  private generateWeeklyOccurrences(
    pattern: RecurrencePattern,
    start: Date,
    end: Date,
  ): Date[] {
    const occurrences: Date[] = [];
    const daysOfWeek = pattern.daysOfWeek || [];

    if (daysOfWeek.length === 0) {
      return occurrences;
    }

    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        occurrences.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return occurrences;
  }

  /**
   * Generate monthly occurrences based on specified day of the month.
   * dayOfMonth: 1-31 (will clamp to last day if month is shorter)
   */
  private generateMonthlyOccurrences(
    pattern: RecurrencePattern,
    start: Date,
    end: Date,
  ): Date[] {
    const occurrences: Date[] = [];
    const dayOfMonth = pattern.dayOfMonth || 1;

    // Start from the month of the start date
    const current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      // Get the actual day to use (clamped to last day of month)
      const lastDayOfMonth = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0,
      ).getDate();
      const actualDay = Math.min(dayOfMonth, lastDayOfMonth);

      const occurrenceDate = new Date(
        current.getFullYear(),
        current.getMonth(),
        actualDay,
      );

      // Only include if within range
      if (occurrenceDate >= start && occurrenceDate <= end) {
        occurrences.push(occurrenceDate);
      }

      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    return occurrences;
  }

  /**
   * Get the next occurrence date after a given date.
   * Useful for finding the next due date after completion.
   */
  getNextOccurrence(pattern: RecurrencePattern, afterDate: Date): Date | null {
    // Look ahead up to 1 year
    const lookAheadEnd = new Date(afterDate);
    lookAheadEnd.setFullYear(lookAheadEnd.getFullYear() + 1);

    const nextDay = new Date(afterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const occurrences = this.generateOccurrences(pattern, nextDay, lookAheadEnd);
    return occurrences.length > 0 ? occurrences[0] : null;
  }

  /**
   * Calculate the rolling window dates for generating assignments.
   * Default is 14 days (2 weeks) ahead.
   */
  getGenerationWindow(windowDays: number = 14): { from: Date; to: Date } {
    const from = this.startOfDay(new Date());
    const to = new Date(from);
    to.setDate(to.getDate() + windowDays);
    return { from, to };
  }

  /**
   * Helper to normalize a date to start of day (midnight).
   */
  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Helper to parse an ISO date string to a Date object.
   */
  private parseDate(dateString: string): Date {
    const date = new Date(dateString);
    return this.startOfDay(date);
  }

  /**
   * Format a date to ISO date string (YYYY-MM-DD).
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
