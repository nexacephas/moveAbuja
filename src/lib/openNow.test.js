import { describe, expect, it } from 'vitest';
import { isOpenNow } from './openNow.js';

const weekdayHours = {
  mon: '09:00-17:00',
  tue: '09:00-17:00',
  wed: '09:00-17:00',
  thu: '09:00-17:00',
  fri: '09:00-17:00',
  sat: null,
  sun: null,
};

describe('isOpenNow', () => {
  it('uses the Africa/Lagos timezone when checking opening hours', () => {
    const now = new Date('2026-11-24T08:30:00.000Z');

    expect(isOpenNow(weekdayHours, now)).toBe(true);
  });

  it('returns closed on a day with no opening hours', () => {
    const now = new Date('2026-11-29T10:00:00.000Z');

    expect(isOpenNow(weekdayHours, now)).toBe(false);
  });

  it('keeps an overnight opening from the previous day open after midnight', () => {
    const hours = { mon: '22:00-02:00', tue: null };
    const now = new Date('2026-11-23T23:30:00.000Z');

    expect(isOpenNow(hours, now)).toBe(true);
  });

  it('does not treat the early part of an overnight schedule as open before it starts', () => {
    const hours = { mon: '22:00-02:00' };
    const now = new Date('2026-11-23T20:00:00.000Z');

    expect(isOpenNow(hours, now)).toBe(false);
  });

  it('returns unknown when no usable hours are provided', () => {
    expect(isOpenNow({}, new Date('2026-11-24T08:30:00.000Z'))).toBeNull();
    expect(isOpenNow(null, new Date('2026-11-24T08:30:00.000Z'))).toBeNull();
  });
});
