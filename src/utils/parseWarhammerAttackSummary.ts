import { WarhammerAttackSummary } from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import { parseSafeInteger } from "./safeInteger";

export const MAX_DAMAGE_HITS = 100;
export const MAX_DAMAGE_SUMMARY_LENGTH = 4096;

export type ParseDamageSummaryResult =
  | { summary: WarhammerAttackSummary; error: null }
  | { summary: null; error: string };

export default function parseWarhammerAttackSummary(
  rawSummary: string
): ParseDamageSummaryResult {
  if (rawSummary.length > MAX_DAMAGE_SUMMARY_LENGTH) {
    return { summary: null, error: "Summary is too long (maximum 4096 characters)" };
  }

  let text = rawSummary.trim();
  if (text.startsWith("`") || text.endsWith("`")) {
    if (!(text.startsWith("`") && text.endsWith("`") && text.length >= 2)) {
      return { summary: null, error: "Summary has an incomplete code wrapper" };
    }
    text = text.slice(1, -1).trim();
  }

  const match = /^Pen\s+(\d+)\s*,\s*Fel\s+(\d+)\s*:\s*(.+)$/i.exec(text);
  if (!match) {
    return {
      summary: null,
      error: "Use the format: Pen X, Fel Y: damage, damage, ...",
    };
  }

  const penetration = parseSafeInteger(match[1]);
  const felling = parseSafeInteger(match[2]);
  const tokens = match[3].split(",").map((token) => token.trim());
  if (tokens[tokens.length - 1] === "") tokens.pop();
  if (penetration === null || felling === null) {
    return { summary: null, error: "Pen and Fel must be safe whole numbers" };
  }
  if (tokens.length > MAX_DAMAGE_HITS) {
    return { summary: null, error: `Summary cannot contain more than ${MAX_DAMAGE_HITS} hits` };
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
      felling,
      damages: damages as number[],
    },
    error: null,
  };
}
