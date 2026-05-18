/**
 * Sanctions / Designated Persons check utilities.
 *
 * Regulatory basis:
 *   - AMLA B.E. 2542 Section 7 (designated persons — targeted financial sanctions)
 *   - AMLO: List of Designated Persons (updated 8 May 2026)
 *
 * NOTE: This module provides the interface and stub for sanctions screening.
 * In production, `checkDesignatedPersons` must be integrated with a live
 * AMLO feed or a regularly-updated internal database. The current
 * implementation logs a warning and returns a "not matched" result to
 * avoid blocking operations while integration is pending.
 *
 * Integration is tracked in docs/policy-state/implementation-plan.md.
 */

export interface SanctionsCheckResult {
  matched: boolean;
  /** Names that were matched (empty if no match) */
  matchedNames: string[];
  /** ISO date of the list used for this check */
  listDate: string;
  /** Warning if the live list could not be consulted */
  warning?: string;
}

/**
 * AMLO Section 7 designated persons list date (last known update).
 * Update this constant whenever a new list is published by AMLO.
 */
export const DESIGNATED_PERSONS_LIST_DATE = "2026-05-08";

/**
 * Check one or more names against the AMLO Section 7 designated persons list.
 *
 * STUB: Returns a warning result until live AMLO feed integration is complete.
 * Replace the body of this function with a real lookup once the integration
 * contract with the AMLO data provider is established.
 *
 * @param names - Customer name(s) and counterparty name(s) to check
 * @returns SanctionsCheckResult
 */
export function checkDesignatedPersons(names: string[]): SanctionsCheckResult {
  // TODO: Replace with live AMLO Section 7 list lookup (integration pending).
  // Reference: docs/policy-state/implementation-plan.md — Story 4.
  console.warn(
    "[sanctions] checkDesignatedPersons: live AMLO Section 7 integration not yet configured. " +
      "Manual screening required against the list dated " +
      DESIGNATED_PERSONS_LIST_DATE +
      " for names: [REDACTED — PII]"
  );

  return {
    matched: false,
    matchedNames: [],
    listDate: DESIGNATED_PERSONS_LIST_DATE,
    warning:
      "Automated AMLO Section 7 screening not yet integrated. " +
      "Manual verification required against the designated persons list dated " +
      DESIGNATED_PERSONS_LIST_DATE +
      ".",
  };
}
