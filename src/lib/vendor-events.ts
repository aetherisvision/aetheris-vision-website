export type VendorEvent = {
  id: string
  name: string
  startsOn: string
  endsOn: string
  location: string
  organizer: string
  fit: string
  registration: string
  registrationDeadline?: string
  sourceUrl: string
  verifiedOn: string
  tribalSpecific: boolean
}

/**
 * Initial verified event inventory. Opportunity Radar will replace this seed
 * with its authenticated feed; keeping the shape here gives the private CRM a
 * useful, reviewable surface before automated ingestion is enabled.
 */
export const VENDOR_EVENTS: VendorEvent[] = [
  {
    id: 'npi-2026',
    name: 'NPI 2026 Annual Conference Partner Exhibit Event',
    startsOn: '2026-10-04',
    endsOn: '2026-10-07',
    location: 'Frisco, Texas',
    organizer: 'National Procurement Institute',
    fit: 'Public procurement directors and senior decision makers; exhibitor and partner route.',
    registration: 'Partner options advertised',
    sourceUrl: 'https://npi.memberclicks.net/conference-partners',
    verifiedOn: '2026-09-10',
    tribalSpecific: false,
  },
  {
    id: 'aises-2026',
    name: '2026 AISES National Conference',
    startsOn: '2026-10-15',
    endsOn: '2026-10-17',
    location: 'Albuquerque, New Mexico',
    organizer: 'AISES',
    fit: 'Native STEM professionals and organizations; strongest fit is attendance or a technical partnership.',
    registration: 'Conference and vendor information published',
    sourceUrl: 'https://2026.aises.org/exhibitors/artisan-marketplace',
    verifiedOn: '2026-09-10',
    tribalSpecific: true,
  },
  {
    id: 'ncai-2026',
    name: 'NCAI 83rd Annual Convention & Marketplace',
    startsOn: '2026-10-18',
    endsOn: '2026-10-22',
    location: 'Palm Springs, California',
    organizer: 'National Congress of American Indians',
    fit: 'National tribal leaders and marketplace; high-value relationship event for broad tribal outreach.',
    registration: 'Registration open',
    registrationDeadline: '2026-09-15',
    sourceUrl: 'https://www.ncai.org/event/83rd-annual-convention-and-marketplace',
    verifiedOn: '2026-09-10',
    tribalSpecific: true,
  },
  {
    id: 'ok-transit-2026',
    name: 'Oklahoma Transit Association Annual Conference & Expo',
    startsOn: '2026-10-19',
    endsOn: '2026-10-21',
    location: 'Ardmore Convention Center, Ardmore, Oklahoma',
    organizer: 'Oklahoma Transit Association',
    fit: 'Oklahoma public and tribal transportation organizations; relevant for data, web, CRM, or decision support.',
    registration: 'Vendor registration advertised',
    registrationDeadline: '2026-10-05',
    sourceUrl: 'https://www.oktransit.org/vendor',
    verifiedOn: '2026-09-10',
    tribalSpecific: true,
  },
  {
    id: 'otfc-fall-2026',
    name: 'Oklahoma Tribal Finance Consortium Fall Conference',
    startsOn: '2026-10-25',
    endsOn: '2026-10-27',
    location: 'First Americans Museum, Oklahoma City, Oklahoma',
    organizer: 'Oklahoma Tribal Finance Consortium',
    fit: 'Oklahoma tribal finance leaders and corporate sponsors; strong relationship-development fit.',
    registration: 'Registration and sponsor routes advertised',
    sourceUrl: 'https://oktribalfinance.org/',
    verifiedOn: '2026-09-10',
    tribalSpecific: true,
  },
]
