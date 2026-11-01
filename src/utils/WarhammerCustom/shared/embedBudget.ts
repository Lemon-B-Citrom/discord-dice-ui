import { EMBED_FIELD_VALUE_MAX } from "../../../consts/discordEmbed";
import { chunkTextForEmbed, EmbedField } from "../../embedFields";

const SUMMARY_WRAPPER_OVERHEAD = 2;

export interface SummaryFieldNames {
  firstName: string;
  continuationName: string;
}

/** Chunk whole summary tokens and account for the surrounding code marks. */
export function createSummaryFields(
  fragments: ReadonlyArray<string>,
  names: SummaryFieldNames
): EmbedField[] {
  return chunkTextForEmbed(
    fragments,
    EMBED_FIELD_VALUE_MAX - SUMMARY_WRAPPER_OVERHEAD
  ).map((value, index) => ({
    name: index === 0 ? names.firstName : names.continuationName,
    value: `\`${value}\``,
  }));
}

/** Add detail in order, rolling back any row that would exceed the embed budget. */
export function includeDetailsWhileTheyFit<T>(
  candidates: ReadonlyArray<T>,
  isEligible: (candidate: T) => boolean,
  setIncluded: (candidate: T, included: boolean) => void,
  fits: () => boolean
): boolean {
  let shortened = false;
  for (const candidate of candidates) {
    if (!isEligible(candidate)) continue;
    setIncluded(candidate, true);
    if (!fits()) {
      setIncluded(candidate, false);
      shortened = true;
    }
  }
  return shortened;
}
