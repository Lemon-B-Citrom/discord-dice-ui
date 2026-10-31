import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { parseSafeInteger, requireNonNegativeInteger } from "./safeInteger";
import { getDamageLocationByWireToken } from "./damageLocations";

export const MAX_DAMAGE_HITS = 100;
export const MAX_DAMAGE_SUMMARY_LENGTH = 4096;
export const SUMMARY_FORMAT_ERROR =
  "Summary needs a first hit location; add one humanoid token (@head, @body, @larm, @rarm, @lleg, @rleg) or vehicle token (@motv, @hull, @wpns, @turr) before the colon. Use Pen X [, Fel Y] [, Dev Z]: damage damage ...";
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

/**
 * Parse one attack summary. `Pen` is required; `Fel` and `Dev` are optional and
 * may appear in any order, so a missing trait means zero.
 */
export default function parseWarhammerAttackerDamageSummary(
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
    const key = HEADER_KEYS[match[1].toLowerCase()];
    if (!key) {
      return { summary: null, error: SUMMARY_FORMAT_ERROR };
    }
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
