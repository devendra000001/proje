export const toTimeInputValue = (value) => {
  if (typeof value !== 'string') return '';

  const twelveHour = value.trim().match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (twelveHour) {
    const [, hourText, minute, meridiem] = twelveHour;
    const hour = Number(hourText);
    if (hour < 1 || hour > 12) return '';
    const hour24 = (hour % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
    return `${String(hour24).padStart(2, '0')}:${minute}`;
  }

  const twentyFourHour = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return twentyFourHour ? `${twentyFourHour[1]}:${twentyFourHour[2]}` : '';
};

export const toApiTimeValue = (value) => {
  const match = typeof value === 'string' && value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return '';

  const [, hourText, minute] = match;
  const hour24 = Number(hourText);
  const hour12 = hour24 % 12 || 12;
  const meridiem = hour24 < 12 ? 'AM' : 'PM';
  return `${String(hour12).padStart(2, '0')}:${minute} ${meridiem}`;
};
