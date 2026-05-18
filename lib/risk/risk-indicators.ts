/**
 * Risk indicator derivation utilities.
 *
 * These helpers derive standardised risk indicator strings from case data,
 * which can be surfaced in the UI and included in STR filings.
 *
 * Regulatory basis:
 *   - FATF Recommendation 19: Higher-risk jurisdictions (EDD trigger)
 *   - FATF Recommendation 12 / AMLO PEP Notification (08 Dec 2025)
 *   - AMLA B.E. 2542 Section 16 (EDD)
 */

import { getFatfEntry } from "./fatf-jurisdictions";

/**
 * Return a risk indicator string if the given country is on the FATF
 * high-risk or increased-monitoring list, otherwise `null`.
 */
export function getJurisdictionRiskIndicator(country: string): string | null {
  const entry = getFatfEntry(country);
  if (!entry) return null;

  if (entry.status === "CALL_FOR_ACTION") {
    return `FATF Call for Action — high-risk jurisdiction: ${entry.countryName} (as of ${entry.asOf})`;
  }
  return `FATF Increased Monitoring — jurisdiction: ${entry.countryName} (as of ${entry.asOf})`;
}

/**
 * Derive jurisdiction-based risk indicators from a list of transaction countries.
 * Deduplicates by country name.
 */
export function getJurisdictionRiskIndicators(countries: string[]): string[] {
  const seen = new Set<string>();
  const indicators: string[] = [];

  for (const country of countries) {
    const indicator = getJurisdictionRiskIndicator(country);
    if (indicator && !seen.has(country.toLowerCase())) {
      seen.add(country.toLowerCase());
      indicators.push(indicator);
    }
  }

  return indicators;
}

/**
 * Return the PEP risk indicator string if `isPep` is true.
 *
 * PEP determination is the responsibility of the caller (CDD process).
 * Based on AMLO PEP Notification (08 December 2025) and FATF Recommendation 12.
 */
export function getPepRiskIndicator(isPep: boolean): string | null {
  if (!isPep) return null;
  return "Politically Exposed Person (PEP) — EDD required (AMLO PEP Notification, 08 Dec 2025)";
}

/**
 * Collect all policy-derived risk indicators for a case.
 *
 * @param params.transactionCountries - Countries from case transactions
 * @param params.isPep - Whether the customer is identified as a PEP
 */
export function getPolicyRiskIndicators(params: {
  transactionCountries: string[];
  isPep: boolean;
}): string[] {
  const indicators: string[] = [];

  indicators.push(...getJurisdictionRiskIndicators(params.transactionCountries));

  const pepIndicator = getPepRiskIndicator(params.isPep);
  if (pepIndicator) indicators.push(pepIndicator);

  return indicators;
}
