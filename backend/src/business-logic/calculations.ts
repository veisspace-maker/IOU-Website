import { LeaveRecord, PublicHoliday, ClosedDate } from '../types/models';

/**
 * Calculate business days between two dates, excluding weekends, public holidays, and closed dates
 */
export function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[],
  closedDates: ClosedDate[]
): number {
  let businessDays = 0;
  const currentDate = new Date(startDate);
  
  // Normalize dates to midnight for comparison
  currentDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's a public holiday
      const isHoliday = holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === currentDate.getTime();
      });
      
      // Check if it's within a closed date range
      const isClosed = closedDates.some(closedDate => {
        const start = new Date(closedDate.startDate);
        const end = new Date(closedDate.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return currentDate >= start && currentDate <= end;
      });
      
      if (!isHoliday && !isClosed) {
        businessDays++;
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Check if a leave period overlaps with existing leave records
 */
export function checkLeaveOverlap(
  userId: string,
  startDate: Date,
  endDate: Date,
  existingLeave: LeaveRecord[]
): LeaveRecord[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return existingLeave.filter(leave => {
    // Skip if different user
    if (leave.userId !== userId) {
      return false;
    }
    
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(0, 0, 0, 0);
    
    // Check for overlap
    // Overlap occurs if:
    // - New leave starts during existing leave
    // - New leave ends during existing leave
    // - New leave completely encompasses existing leave
    // - Existing leave completely encompasses new leave
    return (
      (start >= leaveStart && start <= leaveEnd) ||
      (end >= leaveStart && end <= leaveEnd) ||
      (start <= leaveStart && end >= leaveEnd) ||
      (leaveStart <= start && leaveEnd >= end)
    );
  });
}
