import { describe, expect, it } from 'vitest';
import { getRecordTrust } from './getRecordTrust.js';

describe('getRecordTrust', () => {
  it('labels verified records with their verification date', () => {
    expect(getRecordTrust({ status: 'verified', statusDate: '2026-11-24' })).toEqual({
      status: 'verified',
      label: 'Verified on 2026-11-24',
    });
  });

  it('returns an unverified label and HTTPS source for online records', () => {
    expect(getRecordTrust({
      status: 'online',
      source: 'Publisher',
      sourceUrl: 'https://publisher.example/info',
    })).toEqual({
      status: 'online',
      label: 'Unverified',
      sourceName: 'Publisher',
      sourceUrl: 'https://publisher.example/info',
    });
  });

  it('does not expose a non-HTTPS source as a link or label sample records', () => {
    expect(getRecordTrust({
      status: 'online',
      source: 'Publisher',
      sourceUrl: 'http://publisher.example/info',
    })).toEqual({
      status: 'online',
      label: 'Unverified',
      sourceName: 'Publisher',
      sourceUrl: '',
    });
    expect(getRecordTrust({ status: 'sample' })).toBeNull();
  });
});
