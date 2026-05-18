/**
 * FATF High-Risk Jurisdictions
 *
 * Source: AMLO Thailand — "High Risk Jurisdictions subject to a Call for Action
 *         and Jurisdictions under Increased Monitoring (As of February 2026)"
 * Published: 16 February 2026
 * Regulatory basis: AMLA B.E. 2542 Section 16; FATF Recommendations R.10, R.19
 *
 * Banks must apply Enhanced Due Diligence (EDD) for transactions with
 * counterparties in any jurisdiction listed below.
 *
 * IMPORTANT: This list must be reviewed and updated each time AMLO publishes
 * a new FATF jurisdiction update (typically after each FATF plenary).
 */

export type FatfStatus = "CALL_FOR_ACTION" | "INCREASED_MONITORING";

export interface FatfJurisdiction {
  countryName: string;
  /** ISO 3166-1 alpha-2 or alpha-3 code where applicable */
  isoCode?: string;
  status: FatfStatus;
  /** Date this entry was added/confirmed at the FATF plenary */
  asOf: string;
}

/**
 * FATF list as of February 2026 FATF plenary.
 * Last updated: 2026-02-16 (AMLO Thailand publication).
 */
export const FATF_JURISDICTIONS: readonly FatfJurisdiction[] = [
  // ── Call for Action (blacklist) ────────────────────────────────
  { countryName: "Iran", isoCode: "IR", status: "CALL_FOR_ACTION", asOf: "2026-02-16" },
  { countryName: "North Korea", isoCode: "KP", status: "CALL_FOR_ACTION", asOf: "2026-02-16" },
  { countryName: "Myanmar", isoCode: "MM", status: "CALL_FOR_ACTION", asOf: "2026-02-16" },

  // ── Increased Monitoring (grey list) ──────────────────────────
  { countryName: "Algeria", isoCode: "DZ", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Angola", isoCode: "AO", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Bulgaria", isoCode: "BG", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Burkina Faso", isoCode: "BF", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Cameroon", isoCode: "CM", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Côte d'Ivoire", isoCode: "CI", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Croatia", isoCode: "HR", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Democratic Republic of Congo", isoCode: "CD", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Haiti", isoCode: "HT", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Kenya", isoCode: "KE", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Lao PDR", isoCode: "LA", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Lebanon", isoCode: "LB", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Mali", isoCode: "ML", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Monaco", isoCode: "MC", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Mozambique", isoCode: "MZ", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Namibia", isoCode: "NA", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Nigeria", isoCode: "NG", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Philippines", isoCode: "PH", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "South Africa", isoCode: "ZA", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "South Sudan", isoCode: "SS", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Syria", isoCode: "SY", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Tanzania", isoCode: "TZ", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Venezuela", isoCode: "VE", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Vietnam", isoCode: "VN", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
  { countryName: "Yemen", isoCode: "YE", status: "INCREASED_MONITORING", asOf: "2026-02-16" },
] as const;

/** Pre-built lookup map (country name, case-insensitive) → FatfJurisdiction */
const FATF_BY_NAME: Map<string, FatfJurisdiction> = new Map(
  FATF_JURISDICTIONS.map((j) => [j.countryName.toLowerCase(), j])
);

/** Pre-built lookup map (ISO code, upper-case) → FatfJurisdiction */
const FATF_BY_ISO: Map<string, FatfJurisdiction> = new Map(
  FATF_JURISDICTIONS.filter((j) => j.isoCode != null).map((j) => [j.isoCode!.toUpperCase(), j])
);

/**
 * Look up a jurisdiction by country name or ISO 2-letter code.
 * Returns the entry if found on the FATF list, otherwise `undefined`.
 */
export function getFatfEntry(countryOrCode: string): FatfJurisdiction | undefined {
  const normalised = countryOrCode.trim();
  // Try ISO code first (2–3 chars)
  if (normalised.length <= 3) {
    const byIso = FATF_BY_ISO.get(normalised.toUpperCase());
    if (byIso) return byIso;
  }
  return FATF_BY_NAME.get(normalised.toLowerCase());
}

/** Date of the currently loaded FATF list */
export const FATF_LIST_DATE = "2026-02-16";
