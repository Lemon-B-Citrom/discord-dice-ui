import {
  DAMAGE_LOCATIONS,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageHit,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
  WarhammerDefenderDefenses,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import chunkEmbedRows, { EmbedField, fitsInOneEmbed } from "./embedFields";
import formatWarhammerAttackerDamageSummary from "./formatWarhammerAttackerDamageSummary";
import { getColor } from "./getColor";
import { requireSafeInteger } from "./safeInteger";
import sanitizeDiscordUsername from "./sanitizeDiscordUsername";
import { getHordeClassificationLabel } from "./warhammerDefenderDamageLabels";
import {
  formatEquationTokens,
  getDamageEquationTokens,
  getMagnitudeEquationTokens,
} from "./warhammerDamageEquation";

export type WarhammerDefenderDamageRequestMsgField = EmbedField;

export interface WarhammerDefenderDamageRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: WarhammerDefenderDamageRequestMsgField[];
}

const INVALID_RESULT = "Invalid Warhammer damage result";

const omittedNotice = (first: number, last: number, count: number) =>
  `Hits #${first}–#${last} (${count} hit${count === 1 ? "" : "s"}) omitted. Totals include all hits; full breakdown is available in the app.`;
const DETAILS_OMITTED_NOTICE =
  "Equations shortened; full breakdown is available in the app.";

const assertSafeIntegers = (values: ReadonlyArray<number>): void => {
  values.forEach((value) => requireSafeInteger(value, "Damage value"));
};

/** Every armor and Toughness number the embed can quote must be a whole number. */
function assertDefenses(defenses: WarhammerDefenderDefenses): void {
  if (defenses.mode === "advanced") {
    DAMAGE_LOCATIONS.forEach((location) => {
      assertSafeIntegers([defenses.armor[location], defenses.toughnessBonus[location]]);
    });
    return;
  }
  assertSafeIntegers([
    defenses.armor.headAP,
    defenses.armor.bodyAP,
    defenses.armor.armsAP,
    defenses.armor.legsAP,
  ]);
}

interface FormattedEntry {
  /** Headline and location, always shown. */
  essential: string;
  /** Headline, location and equations, shown while the embed has room. */
  row: string;
  hasDetail: boolean;
  isSynthetic: boolean;
}

function formatHit(
  entry: WarhammerDefenderDamageEntry,
  request: WarhammerDefenderDamageRequest
): FormattedEntry {
  if (entry.kind === "bonus-devastating") {
    assertSafeIntegers([entry.number, entry.magnitude]);
    const essential = `#${entry.number} (Bonus Devastating) :arrow_right: **${entry.magnitude} Magnitude**`;
    return { essential, row: essential, hasDetail: false, isSynthetic: true };
  }

  assertHitNumbers(entry);
  const heading = `#${entry.number}${
    entry.mode === "horde" && entry.role === "bonus" ? " (Bonus)" : ""
  }: :arrow_right:`;
  const location = `-# ${entry.location}`;
  const damageEquation = formatEquationTokens(
    getDamageEquationTokens(entry, request)
  );

  if (entry.mode === "single") {
    const essential = `${heading} **${entry.finalDamage}**\n${location}`;
    return {
      essential,
      row: `${essential}\n${damageEquation}`,
      hasDetail: true,
      isSynthetic: false,
    };
  }

  assertSafeIntegers([entry.baseMagnitude, entry.devastatingAdded, entry.magnitude]);
  const classification = getHordeClassificationLabel(entry.classification);
  const magnitudeEquation = formatEquationTokens(
    getMagnitudeEquationTokens(entry)
  );
  const essential = `${heading}${
    classification ? ` **${classification}**` : ""
  } **${entry.finalDamage}** Damage, **${entry.magnitude}** Magnitude\n${location}`;
  return {
    essential,
    row: `${essential}\n${damageEquation}\n${magnitudeEquation}`,
    hasDetail: true,
    isSynthetic: false,
  };
}

function assertHitNumbers(entry: WarhammerDefenderDamageHit): void {
  assertSafeIntegers([
    entry.index,
    entry.number,
    entry.originalDamage,
    entry.armorBeforePenetration,
    entry.effectiveArmor,
    entry.effectiveToughnessBonus,
    entry.toughnessBeforeFelling,
    entry.finalDamage,
  ]);
  if (entry.index < 0 || entry.number !== entry.index + 1) {
    throw new Error(INVALID_RESULT);
  }
}

function getContext(result: WarhammerDefenderDamageResult): string {
  const request = result.request;
  // Derive the summary from the validated request so the embed always matches
  // the numbers that are shown, independent of the raw draft text.
  const summary = formatWarhammerAttackerDamageSummary(request.summary);
  const hitCount = request.summary.damages.length;
  const hitBreakdown =
    request.mode === "horde"
      ? ` (${request.trueHits} True, ${hitCount - request.trueHits} Bonus)`
      : "";
  if (request.mode === "horde") {
    assertSafeIntegers([request.trueHits, request.magPer, request.woundsPer]);
  }
  return [
    `:dart: ${request.mode === "horde" ? "Horde" : "Single target"} x${hitCount}${hitBreakdown}: \`${summary}\``,
    `:mens: Starting at ${request.firstHitLocation}`,
  ].join("\n");
}

function getTotalsField(
  result: WarhammerDefenderDamageResult
): WarhammerDefenderDamageRequestMsgField {
  assertSafeIntegers([result.totals.damage]);
  const rows = [`Total Damage: ${result.totals.damage}`];
  if (result.request.mode === "horde") {
    const { magnitude = 0, killCount = 0, killCountUnavailable } = result.totals;
    assertSafeIntegers([magnitude]);
    rows.push(`Total Magnitude: ${magnitude}`);
    if (!killCountUnavailable) assertSafeIntegers([killCount]);
    rows.push(
      killCountUnavailable
        ? "Kill Count: Unavailable (Mag per is 0)"
        : `Kill Count: ${killCount}+`
    );
  }
  return { name: ":boom: Summary", value: rows.join("\n") };
}

/** Drop the last real hit, keeping an appended Bonus Devastating row. */
function dropTrailingRealHit(
  indices: ReadonlyArray<number>,
  formatted: ReadonlyArray<FormattedEntry>
): number[] {
  for (let position = indices.length - 1; position >= 0; position -= 1) {
    if (!formatted[indices[position]].isSynthetic) {
      return indices.filter((_, index) => index !== position);
    }
  }
  throw new Error("Unable to fit Warhammer damage webhook message");
}

/** Format one completed Defender Damage result as a bounded Discord embed. */
export default function getWarhammerDefenderDamageRequestMsg(
  result: WarhammerDefenderDamageResult,
  username: string
): WarhammerDefenderDamageRequestMsg {
  const request = result.request;
  assertDefenses(request.defenses);

  const msgTitle = `${sanitizeDiscordUsername(username)} calculated damage. ${
    request.mode === "horde" ? "Horde" : "Single target"
  }`;
  const context = getContext(result);
  const formatted = result.entries.map((entry) => formatHit(entry, request));
  const totalsField = getTotalsField(result);
  const totalRealHits = formatted.filter((entry) => !entry.isSynthetic).length;

  const descriptionFor = (indices: ReadonlyArray<number>): string => {
    const retainedRealHits = indices.filter(
      (index) => !formatted[index].isSynthetic
    ).length;
    const omittedCount = totalRealHits - retainedRealHits;
    return omittedCount
      ? `${context}\n${omittedNotice(
          retainedRealHits + 1,
          totalRealHits,
          omittedCount
        )}`
      : context;
  };

  const fieldsFor = (
    indices: ReadonlyArray<number>,
    withDetail: ReadonlyArray<boolean>,
    notice: string | null
  ): WarhammerDefenderDamageRequestMsgField[] => {
    const rows = indices.map((index) =>
      withDetail[index] ? formatted[index].row : formatted[index].essential
    );
    if (notice) rows.push(notice);
    return [
      ...chunkEmbedRows(rows, {
        firstName: "Damage by hit",
        continuationName: "\u200b",
        joiner: "\n\n",
      }),
      totalsField,
    ];
  };

  // Keep the longest leading run of hits that fits with headlines alone,
  // reserving the shortening notice in case no equation can be kept.
  let indices = formatted.map((_, index) => index);
  let description = descriptionFor(indices);
  while (
    !fitsInOneEmbed(
      msgTitle,
      description,
      fieldsFor(indices, [], DETAILS_OMITTED_NOTICE)
    )
  ) {
    indices = dropTrailingRealHit(indices, formatted);
    description = descriptionFor(indices);
  }

  // Then add equations in order. Every candidate reserves the shortening notice
  // so the final payload still fits whichever hits end up without equations.
  const withDetail = formatted.map(() => false);
  let detailsShortened = false;
  indices.forEach((index) => {
    if (!formatted[index].hasDetail) return;
    withDetail[index] = true;
    const candidate = fieldsFor(indices, withDetail, DETAILS_OMITTED_NOTICE);
    if (!fitsInOneEmbed(msgTitle, description, candidate)) {
      withDetail[index] = false;
      detailsShortened = true;
    }
  });

  return {
    msgTitle,
    description,
    color: getColor(),
    fields: fieldsFor(
      indices,
      withDetail,
      detailsShortened ? DETAILS_OMITTED_NOTICE : null
    ),
  };
}
