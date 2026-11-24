export function getRecordTrust(record) {
  if (!record || typeof record !== 'object') return null;

  if (record.status === 'verified') {
    return {
      status: 'verified',
      label: `Verified on ${record.statusDate || 'date unavailable'}`,
    };
  }

  if (record.status !== 'online') return null;

  const sourceName = typeof record.source === 'string' ? record.source.trim() : '';
  let sourceUrl = '';
  if (typeof record.sourceUrl === 'string' && record.sourceUrl.trim()) {
    try {
      const url = new URL(record.sourceUrl);
      if (url.protocol === 'https:') sourceUrl = url.href;
    } catch {
      sourceUrl = '';
    }
  }

  return { status: 'online', label: 'Unverified', sourceName, sourceUrl };
}
