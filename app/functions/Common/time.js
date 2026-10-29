// "08:00", "10:00" -> "8–10 AM", "11:00", "13:00" -> "11 AM–1 PM"
export const formatTimeRange = (beginTime, endTime) => {
  const [beginHour, beginMinute] = beginTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const getPeriod = (hour) => (hour >= 12 ? "PM" : "AM");

  const formatClock = (hour, minute) => {
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return minute === 0
      ? `${hour12}`
      : `${hour12}:${String(minute).padStart(2, "0")}`;
  };

  const begin = formatClock(beginHour, beginMinute);
  const end = formatClock(endHour, endMinute);
  const beginPeriod = getPeriod(beginHour);
  const endPeriod = getPeriod(endHour);

  // the period is only repeated when the class goes from morning to afternoon
  if (beginPeriod === endPeriod) {
    return `${begin}–${end} ${endPeriod}`;
  }
  return `${begin} ${beginPeriod}–${end} ${endPeriod}`;
};
