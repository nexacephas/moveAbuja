const dayKeys = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

const weekOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function parseHours(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;

  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

function getLagosTime(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type) => parts.find((value) => value.type === type)?.value;
  const weekday = part('weekday');
  const hour = Number(part('hour'));
  const minute = Number(part('minute'));

  if (!dayKeys[weekday] || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return { day: dayKeys[weekday], minuteOfDay: hour * 60 + minute };
}

export function isOpenNow(hours, now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!hours || typeof hours !== 'object' || Number.isNaN(date.getTime())) return null;

  const parsedHours = Object.fromEntries(
    weekOrder.map((day) => [day, parseHours(hours[day])]),
  );
  if (weekOrder.every((day) => parsedHours[day] === null)) return null;

  const localTime = getLagosTime(date);
  if (!localTime) return null;

  const todayIndex = weekOrder.indexOf(localTime.day);
  const todayHours = parsedHours[localTime.day];
  if (todayHours) {
    if (todayHours.start === todayHours.end) return true;
    if (todayHours.start < todayHours.end) {
      return localTime.minuteOfDay >= todayHours.start && localTime.minuteOfDay < todayHours.end;
    }
    if (localTime.minuteOfDay >= todayHours.start) return true;
  }

  const previousDay = weekOrder[(todayIndex + weekOrder.length - 1) % weekOrder.length];
  const previousHours = parsedHours[previousDay];
  return Boolean(
    previousHours &&
      previousHours.end < previousHours.start &&
      localTime.minuteOfDay < previousHours.end,
  );
}
