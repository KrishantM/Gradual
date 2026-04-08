import { Opportunity, OpportunityStatus } from '@/types/opportunities';

const STALENESS_THRESHOLDS_DAYS: Record<string, number> = {
  job: 60,
  internship: 60,
  club: 180,
  volunteering: 90,
  event: 7,
  scholarship: 120,
  competition: 30,
};

export function computeStatus(opp: Opportunity): OpportunityStatus {
  const now = new Date();

  const deadline = opp.deadline || opp.dates?.deadline;
  if (deadline && new Date(deadline) < now) return 'expired';

  const expiresAt = opp.expiresAt || opp.dates?.expiresAt;
  if (expiresAt && new Date(expiresAt) < now) return 'expired';

  if (opp.type === 'event' || opp.type === 'competition') {
    const endDate = opp.endDate || opp.dates?.endDate;
    const startDate = opp.startDate || opp.dates?.startDate;
    if (endDate && new Date(endDate) < now) return 'expired';
    if (startDate && !endDate && new Date(startDate) < now) return 'expired';
  }

  const thresholdDays = STALENESS_THRESHOLDS_DAYS[opp.type] || 90;
  const createdDate = new Date(opp.createdAt);
  const daysOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld > thresholdDays) return 'expired';

  return 'active';
}

export function filterFreshOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities
    .map(opp => ({ ...opp, status: computeStatus(opp) }))
    .filter(opp => opp.status === 'active');
}

export function getStaleOpportunityIds(opportunities: Opportunity[]): string[] {
  return opportunities
    .filter(opp => computeStatus(opp) === 'expired')
    .map(opp => opp.id);
}

export function computeFreshnessScore(opp: Opportunity): number {
  const created = new Date(opp.createdAt);
  const now = new Date();
  const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  if (daysOld <= 1) return 100;
  if (daysOld <= 3) return 95;
  if (daysOld <= 7) return 90;
  if (daysOld <= 14) return 80;
  if (daysOld <= 30) return 70;
  if (daysOld <= 60) return 55;
  if (daysOld <= 90) return 40;
  return Math.max(10, 100 - daysOld * 0.8);
}
