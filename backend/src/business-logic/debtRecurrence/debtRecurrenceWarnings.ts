export function dayOfMonthWarnings(dayOfMonth: number): string[] {
  if (dayOfMonth > 28) {
    return [
      'Days after the 28th are clamped in short months (for example February), so the charge lands on the last day of that month instead of the 29th–31st.',
    ];
  }
  return [];
}
