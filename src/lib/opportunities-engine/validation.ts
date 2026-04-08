import { Opportunity, OpportunityValidation } from '@/types/opportunities';

const TRUSTED_DOMAINS = new Set([
  'adzuna.co.nz', 'adzuna.com',
  'seek.co.nz', 'seek.com.au',
  'indeed.co.nz', 'indeed.com',
  'linkedin.com',
  'trademe.co.nz',
  'devpost.com',
  'eventbrite.co.nz', 'eventbrite.com',
  'meetup.com',
  'seekvolunteer.co.nz', 'volunteeringnz.org.nz',
  'dogoodjobs.co.nz',
  'auckland.ac.nz', 'waikato.ac.nz', 'victoria.ac.nz',
  'canterbury.ac.nz', 'otago.ac.nz', 'massey.ac.nz',
  'aut.ac.nz', 'lincoln.ac.nz', 'unitec.ac.nz',
  'studyspy.ac.nz', 'careers.govt.nz',
  'scholarshipsnz.co.nz',
  'givme.co.nz',
  'enactus.org',
  'mlh.io',
  'github.com',
  'startupweekend.org',
  'habitat.org.nz',
  'redcross.org.nz',
  'sva.org.nz',
  'techweek.co.nz',
  'gradnewzealand.nz',
  'studentjob.co.nz',
  'google.com', 'microsoft.com',
  'autsa.org.nz', 'ausa.org.nz',
  'unyouth.org.nz',
  'youthline.co.nz',
  'wgtn.ac.nz',
  'doc.govt.nz',
  'volunteersouth.org.nz',
  'uoacaseclub.co.nz',
  'aihackathon.nz',
  'enz.govt.nz',
  'eventfinda.co.nz',
  'scoop.co.nz',
  'wilnz.nz',
  'wdcc.co.nz',
  'aura.org.nz',
  'linktr.ee',
  'scanz.co.nz',
  'fsae.co.nz',
  'makeuoa.nz',
  'deloitte.com', 'pwc.co.nz', 'ey.com', 'kpmg.com',
  'recruitment.macquarie.com', 'jobs.smartrecruiters.com',
  'eagle.co.nz', 'fphcare.com', 'careers.fonterra.com',
  'careers.airnewzealand.co.nz', 'xero.com',
  'anz.co.nz', 'beca.com', 'fletcherbuilding.com',
  'datacom.com', 'mercury.co.nz', 'aurecongroup.com',
  'spark.co.nz', 'careers.bnz.co.nz', 'asb.co.nz',
  'wsp.com', 'tonkintaylor.co.nz',
  'minterellison.co.nz', 'russellmcveagh.com',
  'gradnewzealand.nz', 'prosple.com',
  'conservationvolunteers.co.nz', 'visitzealandia.com',
  'aucklandcitymission.org.nz', 'kidscan.org.nz',
  'blindlowvision.org.nz', 'spca.nz', 'wellingtonspca.org.nz',
  'surflifesaving.org.nz', 'forestandbird.org.nz',
  'refugeecouncil.org.nz', 'stjohn.org.nz',
  'recreate.org.nz', 'treesthatcount.co.nz',
  'coastguard.nz', 'kaipatiki.org.nz', 'predatorfreenz.org',
  'events.humanitix.com', 'humanitix.com',
  'aiesec.org.nz', 'sesociety.nz', 'nzgdc.com',
  'shesharp.co.nz', 'creativetechfest.nz',
  'imaginecup.microsoft.com', 'developers.google.com',
  'aws.amazon.com', 'youthhack.nz', 'nzsscc.org',
  'chiasma.org.nz', 'youngenterprise.org.nz', 'devs.org.nz',
  'janestreet.com',
  'callaghaninnovation.govt.nz', 'engineeringnz.org',
  'nzma.org.nz', 'nzlawfoundation.org.nz',
  'toddfoundation.org.nz', 'tpk.govt.nz',
  'buildyourfuture.withgoogle.com', 'vodafone.co.nz',
  'gwnz.org.nz', 'fulbright.org.nz',
  'hopp.bio', 'beacons.ai', 'lnk.bio', 'linkin.bio',
  'autc.org.nz', 'aucklandrpg.nz', 'uniband.nz',
  'volunteeringsolutions.com',
  'dressforsuccess.org',
]);

const SUSPICIOUS_PATTERNS = [
  /\b(casino|gambling|bet|lottery|crypto\s*mine|adult)\b/i,
  /\b(get\s+rich\s+quick|make\s+money\s+fast|work\s+from\s+home\s+\$)\b/i,
  /\b(mlm|pyramid|ponzi)\b/i,
];

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isDomainTrusted(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;
  for (const trusted of TRUSTED_DOMAINS) {
    if (domain === trusted || domain.endsWith('.' + trusted)) return true;
  }
  return false;
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function hasSuspiciousContent(opp: Opportunity): string[] {
  const flags: string[] = [];
  const text = `${opp.title} ${opp.description} ${opp.organization}`.toLowerCase();
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(`suspicious_content: ${pattern.source}`);
    }
  }
  return flags;
}

function isExpired(opp: Opportunity): boolean {
  const now = new Date();
  if (opp.deadline && new Date(opp.deadline) < now) return true;
  if (opp.expiresAt && new Date(opp.expiresAt) < now) return true;
  if (opp.dates?.deadline && new Date(opp.dates.deadline) < now) return true;
  if (opp.dates?.expiresAt && new Date(opp.dates.expiresAt) < now) return true;
  return false;
}

function hasMinimumContent(opp: Opportunity): boolean {
  if (!opp.title || opp.title.trim().length < 5) return false;
  if (!opp.description || opp.description.trim().length < 20) return false;
  if (!opp.organization || opp.organization.trim().length < 2) return false;
  if (!opp.url || opp.url === '#') return false;
  return true;
}

export function validateOpportunity(opp: Opportunity): {
  isValid: boolean;
  validation: OpportunityValidation;
} {
  const flags: string[] = [];
  let trustScore = 50;

  if (!hasMinimumContent(opp)) {
    return {
      isValid: false,
      validation: {
        isVerified: false,
        trustScore: 0,
        flags: ['insufficient_content'],
        lastChecked: new Date().toISOString(),
      },
    };
  }

  if (isExpired(opp)) {
    return {
      isValid: false,
      validation: {
        isVerified: false,
        trustScore: 0,
        flags: ['expired'],
        lastChecked: new Date().toISOString(),
      },
    };
  }

  if (!isHttps(opp.url)) {
    flags.push('no_https');
    trustScore -= 20;
  }

  if (isDomainTrusted(opp.url)) {
    trustScore += 30;
  } else {
    trustScore -= 10;
    flags.push('untrusted_domain');
  }

  const suspiciousFlags = hasSuspiciousContent(opp);
  if (suspiciousFlags.length > 0) {
    flags.push(...suspiciousFlags);
    trustScore -= 30 * suspiciousFlags.length;
  }

  if (opp.source === 'adzuna' || opp.source === 'devpost') {
    trustScore += 15;
  }

  if (opp.source === 'curated') {
    trustScore += 20;
  }

  trustScore = Math.max(0, Math.min(100, trustScore));

  const isValid = trustScore >= 20 && suspiciousFlags.length === 0;

  return {
    isValid,
    validation: {
      isVerified: trustScore >= 70,
      verifiedAt: trustScore >= 70 ? new Date().toISOString() : undefined,
      trustScore,
      flags: flags.length > 0 ? flags : undefined,
      lastChecked: new Date().toISOString(),
    },
  };
}

export function validateBatch(opportunities: Opportunity[]): {
  valid: Opportunity[];
  rejected: { opportunity: Opportunity; reason: string[] }[];
} {
  const valid: Opportunity[] = [];
  const rejected: { opportunity: Opportunity; reason: string[] }[] = [];

  for (const opp of opportunities) {
    const result = validateOpportunity(opp);
    if (result.isValid) {
      valid.push({ ...opp, validation: result.validation });
    } else {
      rejected.push({
        opportunity: opp,
        reason: result.validation.flags || ['unknown'],
      });
    }
  }

  return { valid, rejected };
}
