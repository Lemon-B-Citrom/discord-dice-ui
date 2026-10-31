import { WarhammerAttackerDamageResult } from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { WarhammerAttackerDamageSummary } from "../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  parseSafeInteger,
  requireNonNegativeInteger,
  requireSafeInteger,
} from "../safeInteger";
import {
  getDamageLocationByWireToken,
  getDamageLocationWireToken,
} from "./damageLocations";

export const MAX_DAMAGE_HITS = 100;
export const MAX_DAMAGE_SUMMARY_LENGTH = 4096;
export const SUMMARY_FORMAT_ERROR =
  "You must provide a damage summary.\nExample: Pen 3, @head: 23 21";
export const DAMAGE_VALUE_ERROR =
  "Damage values must be safe whole numbers, optionally followed by a parenthesised pre-Fury base such as 25(10)";
export const FURY_BASE_ERROR =
  "Righteous Fury base damage cannot exceed the total damage";

export type ParseDamageSummaryResult =
  | { summary: WarhammerAttackerDamageSummary; error: null }
  | { summary: null; error: string };

type SummaryHeaderKey = "penetration" | "felling" | "devastating";

const HEADER_KEYS: Record<string, SummaryHeaderKey> = {
  pen: "penetration",
  penetration: "penetration",
  fel: "felling",
  felling: "felling",
  dev: "devastating",
  devastating: "devastating",
};

const HEADER_LABELS: Record<SummaryHeaderKey, string> = {
  penetration: "Pen",
  felling: "Fel",
  devastating: "Dev",
};

// One header entry: a key word, whitespace, and a non-negative whole number.
const HEADER_TOKEN = /^([A-Za-z]+)\s+(\d+)$/;

// One hit: a signed total, optionally followed by a parenthesised signed base.
// No whitespace is allowed inside a hit, so `25 (10)` is two invalid tokens.
const DAMAGE_TOKEN = /^([+-]?\d+)(?:\(([+-]?\d+)\))?$/;

// Summary parsing.

/**
 * Parse one attack summary. `Pen` is required; `Fel` and `Dev` are optional and
 * may appear in any order, so a missing trait means zero.
 */
export function parseWarhammerAttackerDamageSummary(
  rawSummary: string
): ParseDamageSummaryResult {
  if (rawSummary.length > MAX_DAMAGE_SUMMARY_LENGTH) {
    return {
      summary: null,
      error: `Summary is too long (maximum ${MAX_DAMAGE_SUMMARY_LENGTH} characters)`,
    };
  }

  let text = rawSummary.trim();
  if (text.startsWith("`") || text.endsWith("`")) {
    if (!(text.startsWith("`") && text.endsWith("`") && text.length >= 2)) {
      return { summary: null, error: "Summary has an incomplete code wrapper" };
    }
    text = text.slice(1, -1).trim();
  }

  const colonIndex = text.indexOf(":");
  if (colonIndex === -1) {
    return { summary: null, error: SUMMARY_FORMAT_ERROR };
  }

  const headerText = text.slice(0, colonIndex).trim();
  const headerTokens = headerText.split(",").map((token) => token.trim());
  if (headerTokens.some((token) => token.length === 0)) {
    return { summary: null, error: SUMMARY_FORMAT_ERROR };
  }

  const headerValues: Partial<Record<SummaryHeaderKey, number>> = {};
  let firstHitLocation:
    | WarhammerAttackerDamageSummary["firstHitLocation"]
    | null = null;
  for (const token of headerTokens) {
    if (token.charAt(0) === "@") {
      const location = getDamageLocationByWireToken(token.toLowerCase());
      if (!location || firstHitLocation) {
        return {
          summary: null,
          error: "Summary needs exactly one valid first hit location",
        };
      }
      firstHitLocation = location;
      continue;
    }
    const match = HEADER_TOKEN.exec(token);
    if (!match) {
      return { summary: null, error: SUMMARY_FORMAT_ERROR };
    }
    const alias = match[1].toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(HEADER_KEYS, alias)) {
      return { summary: null, error: SUMMARY_FORMAT_ERROR };
    }
    const key = HEADER_KEYS[alias];
    if (headerValues[key] !== undefined) {
      return {
        summary: null,
        error: `Summary repeats the ${HEADER_LABELS[key]} value`,
      };
    }
    const value = requireNonNegativeInteger(match[2]);
    if (value === null) {
      return {
        summary: null,
        error: `${HEADER_LABELS[key]} must be a safe whole number`,
      };
    }
    headerValues[key] = value;
  }

  const penetration = headerValues.penetration;
  if (penetration === undefined || !firstHitLocation) {
    return { summary: null, error: SUMMARY_FORMAT_ERROR };
  }

  const segments = text
    .slice(colonIndex + 1)
    .split(",")
    .map((token) => token.trim());
  if (segments[segments.length - 1] === "") segments.pop();
  if (segments.length === 0) {
    return { summary: null, error: "Summary needs at least one damage value" };
  }
  if (segments.some((token) => token.length === 0)) {
    return { summary: null, error: "Summary contains an empty damage value" };
  }
  const tokens = segments.reduce<string[]>(
    (all, segment) => all.concat(segment.split(/\s+/)),
    []
  );
  if (tokens.length > MAX_DAMAGE_HITS) {
    return {
      summary: null,
      error: `Summary cannot contain more than ${MAX_DAMAGE_HITS} hits`,
    };
  }
  const damages: number[] = [];
  const baseDamages: number[] = [];
  let hasBaseAnnotations = false;
  for (const token of tokens) {
    const match = DAMAGE_TOKEN.exec(token);
    if (!match) return { summary: null, error: DAMAGE_VALUE_ERROR };
    const annotated = match[2] !== undefined;
    const total = parseSafeInteger(match[1]);
    const base = annotated ? parseSafeInteger(match[2]) : total;
    if (total === null || base === null) {
      return { summary: null, error: DAMAGE_VALUE_ERROR };
    }
    // Two individually safe values can still disagree safely, so check the
    // difference itself rather than trusting either operand.
    const furyExtra = total - base;
    if (!Number.isSafeInteger(furyExtra)) {
      return { summary: null, error: DAMAGE_VALUE_ERROR };
    }
    if (furyExtra < 0) return { summary: null, error: FURY_BASE_ERROR };
    hasBaseAnnotations = hasBaseAnnotations || annotated;
    damages.push(total);
    baseDamages.push(base);
  }

  return {
    summary: {
      penetration,
      felling: headerValues.felling ?? 0,
      devastating: headerValues.devastating ?? 0,
      firstHitLocation,
      damages,
      ...(hasBaseAnnotations ? { baseDamages } : {}),
    },
    error: null,
  };
}

// Summary formatting.

/**
 * Build the canonical header for an attack summary. Zero-valued optional traits
 * are omitted so a summary never states a trait the attack does not have; the
 * parser treats an absent Felling or Devastating as zero.
 */
function formatWarhammerAttackerDamageSummaryHeader(
  summary: WarhammerAttackerDamageSummary
): string {
  const parts = [`Pen ${summary.penetration}`];
  if (summary.felling !== 0) {
    parts.push(`Fel ${summary.felling}`);
  }
  if (summary.devastating !== 0) {
    parts.push(`Dev ${summary.devastating}`);
  }
  const locationToken = getDamageLocationWireToken(summary.firstHitLocation);
  if (!locationToken) throw new Error("Invalid first hit location");
  parts.push(locationToken);
  return `${parts.join(", ")}:`;
}

/**
 * One hit as a single summary token: the total alone, or `25(10)` when a
 * confirmed Fury raised it, where the parenthesised value is the pre-Fury base.
 * Callers must keep a token whole when they chunk the summary.
 */
function formatWarhammerAttackerDamageHit(
  damage: number,
  baseDamage?: number
): string {
  const total = requireSafeInteger(damage, "Damage value");
  if (baseDamage === undefined) return `${total}`;
  const base = requireSafeInteger(baseDamage, "Base damage");
  const furyExtra = requireSafeInteger(total - base, "Righteous Fury extra");
  if (furyExtra < 0) {
    throw new Error("Righteous Fury base cannot exceed total damage");
  }
  return furyExtra === 0 ? `${total}` : `${total}(${base})`;
}

/** Keep each hit token whole while callers pack summaries into embed fields. */
export function getWarhammerAttackerDamageSummaryFragments(
  summary: WarhammerAttackerDamageSummary
): ReadonlyArray<string> {
  if (
    summary.baseDamages &&
    summary.baseDamages.length !== summary.damages.length
  ) {
    throw new Error("Invalid Righteous Fury base damage metadata");
  }
  return [
    `${formatWarhammerAttackerDamageSummaryHeader(summary)} `,
    ...summary.damages.map(
      (damage, index) =>
        `${index > 0 ? " " : ""}${formatWarhammerAttackerDamageHit(
          damage,
          summary.baseDamages?.[index]
        )}`
    ),
  ];
}

/**
 * Single producer for the attack summary line, shared by the Attack results
 * modal, the Attack Discord embed, and the Defender embed echo.
 */
export function formatWarhammerAttackerDamageSummary(
  summary: WarhammerAttackerDamageSummary
): string {
  return getWarhammerAttackerDamageSummaryFragments(summary).join("");
}

// Completed attack projection.

/** Project a completed attack through the single validated summary path. */
export function projectWarhammerAttackerDamageSummary(
  result: WarhammerAttackerDamageResult
): WarhammerAttackerDamageSummary {
  const { input, damages, hitDetails } = result;
  if (damages.length !== input.hits || hitDetails.length !== input.hits) {
    throw new Error("Invalid Warhammer attack result");
  }
  const baseDamages = hitDetails.map((hit, index) => {
    const selected = hit.attempts[hit.selectedAttemptIndex];
    if (
      hit.attempts.length === 0 ||
      hit.selectedAttemptIndex < 0 ||
      hit.selectedAttemptIndex >= hit.attempts.length ||
      !selected ||
      selected.damage !== damages[index]
    ) {
      throw new Error("Invalid Warhammer attack result");
    }
    const fury = selected.righteousFuryRolls.reduce(
      (sum, roll) => requireSafeInteger(sum + roll, "Righteous Fury total"),
      0
    );
    return requireSafeInteger(selected.damage - fury, "Base damage");
  });
  return {
    penetration: input.penetration,
    felling: input.felling,
    devastating: input.devastating,
    firstHitLocation: input.firstHitLocation,
    damages: damages.map((damage) =>
      requireSafeInteger(damage, "Damage value")
    ),
    baseDamages,
  };
}
