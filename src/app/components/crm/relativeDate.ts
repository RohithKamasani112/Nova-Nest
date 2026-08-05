// Relative-date formatting for the leads table — "Today", "Tomorrow", "2
// days ago", falling back to an absolute short date beyond that range. The
// full absolute value always belongs in a tooltip alongside this.
export function formatRelativeDate(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);
  const overdue = date.getTime() < now.getTime();

  let text: string;
  if (diffDays === 0) text = 'Today';
  else if (diffDays === 1) text = 'Tomorrow';
  else if (diffDays === -1) text = '1 day ago';
  else if (diffDays < 0 && diffDays >= -6) text = `${Math.abs(diffDays)} days ago`;
  else if (diffDays > 0 && diffDays <= 6) text = `In ${diffDays} days`;
  else text = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return { text, overdue };
}

export function formatAbsoluteDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
