import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseLocalDate, formatDateForDB, isDatePast, isDateToday, getTodayString } from './dateUtils';

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD without timezone shift', () => {
    const date = parseLocalDate('2026-01-31');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January = 0
    expect(date.getDate()).toBe(31);
  });

  it('strips time component from ISO string', () => {
    const date = parseLocalDate('2026-06-15T12:00:00.000Z');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June = 5
    expect(date.getDate()).toBe(15);
  });

  it('returns a Date for empty string', () => {
    const date = parseLocalDate('');
    expect(date).toBeInstanceOf(Date);
  });
});

describe('formatDateForDB', () => {
  it('formats single-digit month and day with zero-padding', () => {
    const date = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatDateForDB(date)).toBe('2026-01-05');
  });

  it('formats double-digit month and day correctly', () => {
    const date = new Date(2026, 11, 31); // Dec 31, 2026
    expect(formatDateForDB(date)).toBe('2026-12-31');
  });
});

describe('isDatePast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 25)); // April 25, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for a date in the past', () => {
    expect(isDatePast('2026-04-24')).toBe(true);
  });

  it('returns false for today', () => {
    expect(isDatePast('2026-04-25')).toBe(false);
  });

  it('returns false for a future date', () => {
    expect(isDatePast('2026-04-26')).toBe(false);
  });
});

describe('isDateToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 25)); // April 25, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for today', () => {
    expect(isDateToday('2026-04-25')).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isDateToday('2026-04-24')).toBe(false);
  });

  it('returns false for tomorrow', () => {
    expect(isDateToday('2026-04-26')).toBe(false);
  });
});

describe('getTodayString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 25)); // April 25, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today as YYYY-MM-DD', () => {
    expect(getTodayString()).toBe('2026-04-25');
  });
});
