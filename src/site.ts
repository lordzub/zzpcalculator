export const SITE = {
  name: 'zzpreken',
  domain: 'zzpreken.nl',
  tools: [
    { href: '/rechtsvermoeden-check', short: 'Tariefcheck', title: 'Val je onder het rechtsvermoeden?' },
    { href: '/netto-inkomen-zzp', short: 'Netto inkomen', title: 'Netto inkomen zzp 2025, 2026 en 2027' },
    { href: '/zelfstandigenaftrek-2027', short: 'Zelfstandigenaftrek', title: 'Zelfstandigenaftrek 2027: wat kost het je?' },
    { href: '/uurtarief-berekenen-zzp', short: 'Uurtarief', title: 'Uurtarief berekenen als zzp\'er' },
    { href: '/bv-of-eenmanszaak', short: 'BV of eenmanszaak', title: 'BV of eenmanszaak?' },
  ],
};

/**
 * Affiliate links. Placeholders until the Daisycon programs approve the site.
 * Links never carry user inputs (AFM boundary).
 */
export const AFFILIATES = {
  verzekering: {
    name: 'ZZUPER',
    href: '#affiliate-zzuper',
    text: 'Vergelijk zzp-verzekeringen',
    pending: true,
  },
  boekhouding: {
    name: 'Moneybird',
    href: '#affiliate-moneybird',
    text: 'Boekhouden voor zzp\'ers',
    pending: true,
  },
};
