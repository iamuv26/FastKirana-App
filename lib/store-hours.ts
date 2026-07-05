/**
 * Utility functions for Store Operating Hours and Holiday Checks
 */

export function isWithinOperatingHours(openHour: number, closeHour: number): boolean {
  // Get current Indian Standard Time (GMT+5:30) or local hour
  const now = new Date();
  const currentHour = now.getHours();
  
  if (openHour <= closeHour) {
    return currentHour >= openHour && currentHour < closeHour;
  } else {
    // Overnight hours (e.g. 10 PM to 4 AM)
    return currentHour >= openHour || currentHour < closeHour;
  }
}

export function getNextOpenTime(openHour: number): string {
  const ampm = openHour >= 12 ? 'PM' : 'AM';
  const displayHour = openHour % 12 === 0 ? 12 : openHour % 12;
  return `Opens at ${displayHour}:00 ${ampm}`;
}

export function isHoliday(holidays: string[]): boolean {
  if (!holidays || holidays.length === 0) return false;
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${date}`; // e.g. 2026-07-05
  
  return holidays.some(h => {
    const trimmed = h.trim();
    return trimmed === todayStr || trimmed === `${month}-${date}`; // support both full date and yearly recurring dates
  });
}
