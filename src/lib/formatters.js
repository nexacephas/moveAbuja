const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatFareRange(fare) {
  if (
    !fare ||
    !Number.isFinite(fare.min) ||
    !Number.isFinite(fare.max)
  ) {
    return 'Fare unavailable';
  }

  return `${nairaFormatter.format(fare.min)} - ${nairaFormatter.format(fare.max)}`;
}

export function formatUpdatedAt(dateValue, now = new Date()) {
  const updatedAt = new Date(`${dateValue}T00:00:00`);
  if (!dateValue || Number.isNaN(updatedAt.getTime())) {
    return 'Update date unavailable';
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((today.getTime() - updatedAt.getTime()) / 86400000));
  if (days === 0) return 'Updated today';
  return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`;
}
