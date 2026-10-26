import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { parseSafeInteger, requireNonNegativeInteger } from "./safeInteger";

export const MAX_DAMAGE_HITS = 100;
export const MAX_DAMAGE_SUMMARY_LENGTH = 4096;
export const SUMMARY_FORMAT_ERROR =
  "Use the format: Pen X [, Fel Y] [, Dev Z]: damage, damage, ...";

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
  for (const token of headerTokens) {
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
  if (penetration === undefined) {
    return { summary: null, error: SUMMARY_FORMAT_ERROR };
  }

  const tokens = text
    .slice(colonIndex + 1)
    .split(",")
    .map((token) => token.trim());
  if (tokens[tokens.length - 1] === "") tokens.pop();
  if (tokens.length === 0) {
    return { summary: null, error: "Summary needs at least one damage value" };
  }
  if (tokens.length > MAX_DAMAGE_HITS) {
    return {
      summary: null,
      error: `Summary cannot contain more than ${MAX_DAMAGE_HITS} hits`,
    };
  }
  if (tokens.some((token) => token.length === 0)) {
    return { summary: null, error: "Summary contains an empty damage value" };
  }
  const damages = tokens.map(parseSafeInteger);
  if (damages.some((damage) => damage === null)) {
    return { summary: null, error: "Damage values must be safe whole numbers" };
  }

  return {
    summary: {
      penetration,
      felling: headerValues.felling ?? 0,
      devastating: headerValues.devastating ?? 0,
      damages: damages as number[],
    },
    error: null,
  };
}
