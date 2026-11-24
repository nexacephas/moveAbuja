import { getRecordTrust } from '../lib/getRecordTrust.js';

export default function RecordTrust({ record, className = '' }) {
  const trust = getRecordTrust(record);
  if (!trust) return null;

  const classes = `record-trust record-trust-${trust.status}${className ? ` ${className}` : ''}`;
  if (trust.status === 'verified') {
    return <p className={classes}>{trust.label}</p>;
  }

  return (
    <div className={classes}>
      <span className="unverified-badge">{trust.label}</span>
      {trust.sourceName && (
        <>
          <span>Source:</span>
          {trust.sourceUrl ? (
            <a
              className="trust-source"
              href={trust.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {trust.sourceName}
            </a>
          ) : (
            <span>{trust.sourceName}</span>
          )}
        </>
      )}
    </div>
  );
}
