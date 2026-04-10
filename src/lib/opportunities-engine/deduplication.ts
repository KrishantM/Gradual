import { Opportunity } from '@/types/opportunities';

function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 1.0;

  const wordsA = new Set(na.split(' '));
  const wordsB = new Set(nb.split(' '));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function generateDedupeKey(opp: Opportunity): string {
  const title = normalizeText(opp.title);
  const org = normalizeText(opp.organization);
  const type = opp.type;
  return `${type}::${org}::${title}`;
}

function opportunityStrength(opp: Opportunity): number {
  let strength = 0;
  if (opp.description && opp.description.length > 50) strength += 2;
  if (opp.tags && opp.tags.length > 0) strength += 1;
  if (opp.deadline || opp.dates?.deadline) strength += 1;
  if (opp.salaryMin || opp.compensation?.salaryMin) strength += 1;
  if (opp.requirements && opp.requirements.length > 0) strength += 1;
  if (opp.validation?.trustScore) strength += opp.validation.trustScore / 50;
  if (opp.source === 'adzuna') strength += 1;
  if (opp.source === 'curated') strength += 0.5;
  return strength;
}

export function deduplicateOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const groups = new Map<string, Opportunity[]>();

  for (const opp of opportunities) {
    const key = generateDedupeKey(opp);
    const existing = groups.get(key);
    if (existing) {
      existing.push(opp);
    } else {
      groups.set(key, [opp]);
    }
  }

  const deduplicated: Opportunity[] = [];
  const processedKeys = new Set<string>();

  for (const [key, group] of groups) {
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);

    group.sort((a, b) => opportunityStrength(b) - opportunityStrength(a));
    deduplicated.push(group[0]);
  }

  const urlGroups = new Map<string, Opportunity[]>();
  for (const opp of deduplicated) {
    if (opp.sourceUrl || opp.url) {
      const url = opp.sourceUrl || opp.url;
      try {
        const normalized = new URL(url).href.replace(/\/$/, '').toLowerCase();
        const existing = urlGroups.get(normalized);
        if (existing) {
          existing.push(opp);
        } else {
          urlGroups.set(normalized, [opp]);
        }
      } catch {
        urlGroups.set(opp.id, [opp]);
      }
    } else {
      urlGroups.set(opp.id, [opp]);
    }
  }

  const finalResults: Opportunity[] = [];
  for (const group of urlGroups.values()) {
    group.sort((a, b) => opportunityStrength(b) - opportunityStrength(a));
    finalResults.push(group[0]);
  }

  const crossChecked: Opportunity[] = [];
  for (let i = 0; i < finalResults.length; i++) {
    let isDuplicate = false;
    for (let j = 0; j < crossChecked.length; j++) {
      if (
        finalResults[i].type === crossChecked[j].type &&
        normalizeText(finalResults[i].organization) === normalizeText(crossChecked[j].organization) &&
        titleSimilarity(finalResults[i].title, crossChecked[j].title) > 0.75
      ) {
        if (opportunityStrength(finalResults[i]) > opportunityStrength(crossChecked[j])) {
          crossChecked[j] = finalResults[i];
        }
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      crossChecked.push(finalResults[i]);
    }
  }

  return crossChecked;
}
