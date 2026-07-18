/**
 * Calculate due date based on a starting date and offset offset days (positive or negative).
 */
export const calculateDueDate = (startDate: Date | string, offsetDays?: number | null): Date => {
  const date = new Date(startDate);
  if (offsetDays === undefined || offsetDays === null) {
    return date;
  }
  date.setDate(date.getDate() + offsetDays);
  return date;
};

export default {
  calculateDueDate,
};
