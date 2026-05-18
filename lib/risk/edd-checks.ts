/**
 * Enhanced Due Diligence (EDD) check utilities.
 *
 * Regulatory basis:
 *   - AMLA B.E. 2542 Section 16 (EDD for high-risk customers)
 *   - FATF Recommendation 19 (higher-risk countries)
 *   - AMLO Notification: FATF High Risk Jurisdictions (as of February 2026)
 *   - AMLO PEP Notification (08 December 2025), FATF Recommendation 12
 */

import { getFatfEntry, type FatfStatus } from "./fatf-jurisdictions";

export interface EddResult {
  required: boolean;
  reasons: string[];
}

export interface FatfStatusResult {
  onList: boolean;
  status: FatfStatus | null;
  /** ISO code or country name as provided */
  jurisdiction: string;
  listDate: string;
}

/**
 * Determine whether EDD is required for a given counterparty country.
 *
 * @param country - Country name or ISO 2-letter code of the counterparty
 * @returns EddResult with `required` flag and explanatory reasons
 */
export function requiresEdd(country: string): EddResult {
  const entry = getFatfEntry(country);
  if (!entry) {
    return { required: false, reasons: [] };
  }

  if (entry.status === "CALL_FOR_ACTION") {
    return {
      required: true,
      reasons: [
        `Counterparty jurisdiction "${entry.countryName}" is on the FATF Call for Action list (blacklist) as of ${entry.asOf}. EDD mandatory under AMLA B.E. 2542 Section 16 and FATF Recommendation 19.`,
      ],
    };
  }

  return {
    required: true,
    reasons: [
      `Counterparty jurisdiction "${entry.countryName}" is under FATF Increased Monitoring (grey list) as of ${entry.asOf}. EDD required under AMLA B.E. 2542 Section 16 and FATF Recommendation 19.`,
    ],
  };
}

/**
 * Return the FATF status of a jurisdiction.
 */
export function getFatfStatus(country: string): FatfStatusResult {
  const entry = getFatfEntry(country);
  return {
    onList: entry != null,
    status: entry?.status ?? null,
    jurisdiction: entry?.countryName ?? country,
    listDate: entry?.asOf ?? "",
  };
}

/**
 * Check whether any country in a list of transaction countries requires EDD.
 * Useful for evaluating all transactions on a case at once.
 *
 * @param countries - Array of country names or ISO codes
 * @returns Combined EddResult (required if any single country triggers EDD)
 */
export function requiresEddForAny(countries: string[]): EddResult {
  const combined: EddResult = { required: false, reasons: [] };
  for (const country of countries) {
    const result = requiresEdd(country);
    if (result.required) {
      combined.required = true;
      combined.reasons.push(...result.reasons);
    }
  }
  return combined;
}
