import {
  DamageLocation,
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderDamageResult,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  EMBED_DESCRIPTION_MAX,
  EMBED_FIELD_MAX,
  EMBED_FIELD_NAME_MAX,
  EMBED_FIELD_VALUE_MAX,
  EMBED_TITLE_MAX,
  EMBED_TOTAL_BUDGET,
} from "../consts/discordEmbed";
import formatWarhammerAttackerDamageSummary from "./formatWarhammerAttackerDamageSummary";
import { getColor } from "./getColor";
import { requireSafeInteger } from "./safeInteger";
import sanitizeDiscordUsername from "./sanitizeDiscordUsername";
import {
  getWarhammerMagnitudeBasis,
  getWarhammerToughnessTerm,
} from "./warhammerDefenderDamageLabels";

export interface WarhammerDefenderDamageRequestMsgField {
  name: string;
  value: string;
}

export interface WarhammerDefenderDamageRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: WarhammerDefenderDamageRequestMsgField[];
}

const OMITTED_NOTICE = (first: number, last: number, count: number) =>
  `Hits #${first}–#${last} (${count} hit${count === 1 ? "" : "s"}) omitted. Totals include all hits; full breakdown is available in the app.`;
const DETAILS_OMITTED_NOTICE =
  "Equations shortened; full breakdown is available in the app.";

const assertSafeInteger = (value: number): number =>
  requireSafeInteger(value, "Damage value");

function locationLabel(location: DamageLocation): string {
  switch (location) {
    case "Head":
    case "Body":
    case "Left Arm":
    case "Right Arm":
    case "Left Leg":
    case "Right Leg":
      return location;
    default:
      throw new Error("Invalid Warhammer damage result");
  }
}

interface FormattedEntry {
  essential: string;
  detail?: string[];
  isSynthetic: boolean;
}

function formatReduction(original: number, reduction: number, effective: number): string {
  if (effective >= original) return `\`${effective}\``;
  const subtraction = `\`${original}\` − \`${reduction}\``;
  return `${subtraction}${reduction > original ? " → " : " = "}\`${effective}\``;
}

function formatHit(
  entry: WarhammerDefenderDamageEntry,
  request: WarhammerDefenderDamageRequest
): FormattedEntry {
  if (entry.kind === "bonus-devastating") {
    assertSafeInteger(entry.number);
    assertSafeInteger(entry.magnitude);
    return {
      essential: `#${entry.number} (Bonus Devastating) :arrow_right: **${entry.magnitude} Magnitude**`,
      isSynthetic: true,
    };
  }

  [
    entry.index,
    entry.number,
    entry.originalDamage,
    entry.armorBeforePenetration,
    entry.effectiveArmor,
    entry.effectiveToughnessBonus,
    entry.toughnessBeforeFelling,
    entry.finalDamage,
  ].forEach(assertSafeInteger);
  if (entry.index < 0 || entry.number !== entry.index + 1) {
    throw new Error("Invalid Warhammer damage result");
  }

  const armor = entry.showArmorTerm
    ? ` − Armor (${formatReduction(entry.armorBeforePenetration, request.summary.penetration, entry.effectiveArmor)})`
    : "";
  const toughnessTerm = getWarhammerToughnessTerm(entry, request);
  const toughness = toughnessTerm.fortitudeApplied
    ? `\`${request.toughnessBonus}\` × \`2\`${toughnessTerm.reduced
      ? ` − \`${toughnessTerm.felling}\`${toughnessTerm.overridden ? " → " : " = "}\`${toughnessTerm.effective}\``
      : ` = \`${toughnessTerm.effective}\``}`
    : formatReduction(
        toughnessTerm.beforeFelling,
        toughnessTerm.felling,
        toughnessTerm.effective
      );
  const damageExpression = `\`${entry.originalDamage}\`${armor} − Toughness (${toughness})`;
  const damageEquation = `${entry.mode === "horde" ? "Damage: " : ""}**\`${entry.finalDamage}\`** = ${damageExpression}`;
  const heading = `#${entry.number}${entry.mode === "horde" && entry.role === "bonus" ? " (Bonus)" : ""}: :arrow_right:`;
  const location = `-# ${locationLabel(entry.location)}`;

  if (entry.mode === "single") {
    return {
      essential: `${heading} **${entry.finalDamage}**\n${location}`,
      detail: [damageEquation],
      isSynthetic: false,
    };
  }

  [entry.baseMagnitude, entry.devastatingAdded, entry.magnitude].forEach(
    assertSafeInteger
  );
  const classification = (() => {
    switch (entry.classification) {
      case "overkill":
        return "**Overkill!**";
      case "partial-overkill":
        return "**Partial Overkill!**";
      case "ordinary":
      case "no-damage":
      case "bonus":
        return "";
      default:
        throw new Error("Invalid Warhammer damage result");
    }
  })();
  const magnitudeBasis = getWarhammerMagnitudeBasis(entry);
  const showsMagnitudeOperand =
    entry.classification === "overkill" ||
    entry.classification === "partial-overkill";
  const magnitudeBase = `${magnitudeBasis.label}${
    showsMagnitudeOperand ? ` (\`${magnitudeBasis.operand}\`)` : ""
  }`;
  const magnitudeEquation = `Magnitude: **\`${entry.magnitude}\`** = ${magnitudeBase}${entry.devastatingAdded > 0 ? ` + Devastating (\`${entry.devastatingAdded}\`)` : ""}`;
  return {
    essential: `${heading}${classification ? ` ${classification}` : ""} **${entry.finalDamage}** Damage, **${entry.magnitude}** Magnitude\n${location}`,
    detail: [damageEquation, magnitudeEquation],
    isSynthetic: false,
  };
}

function makeEntryFields(rows: string[]): WarhammerDefenderDamageRequestMsgField[] {
  const fields: WarhammerDefenderDamageRequestMsgField[] = [];
  let value = "";

  rows.forEach((row) => {
    if (row.length > EMBED_FIELD_VALUE_MAX) {
      throw new Error("Invalid Warhammer damage result");
    }
    const nextValue = value ? `${value}\n\n${row}` : row;
    if (nextValue.length > EMBED_FIELD_VALUE_MAX) {
      fields.push({
        name: fields.length === 0 ? "Damage by hit" : "\u200b",
        value,
      });
      value = row;
    } else {
      value = nextValue;
    }
  });

  if (value) {
    fields.push({
      name: fields.length === 0 ? "Damage by hit" : "\u200b",
      value,
    });
  }
  return fields;
}

function totalLength(
  title: string,
  description: string,
  fields: WarhammerDefenderDamageRequestMsgField[]
): number {
  return (
    title.length +
    description.length +
    fields.reduce((total, field) => total + field.name.length + field.value.length, 0)
  );
}

function checkPayload(
  title: string,
  description: string,
  fields: WarhammerDefenderDamageRequestMsgField[]
): boolean {
  return (
    title.length <= EMBED_TITLE_MAX &&
    description.length <= EMBED_DESCRIPTION_MAX &&
    fields.length <= EMBED_FIELD_MAX &&
    fields.every(
      (field) =>
        field.name.length <= EMBED_FIELD_NAME_MAX &&
        field.value.length <= EMBED_FIELD_VALUE_MAX
    ) &&
    totalLength(title, description, fields) <= EMBED_TOTAL_BUDGET
  );
}

function getContext(result: WarhammerDefenderDamageResult): string {
  const request = result.request;
  [
    request.armor.headAP,
    request.armor.bodyAP,
    request.armor.armsAP,
    request.armor.legsAP,
  ].forEach(assertSafeInteger);
  // Derive the summary from the validated request so the embed always matches
  // the numbers that are shown, independent of the raw draft text.
  const summary = formatWarhammerAttackerDamageSummary(request.summary);
  const hitCount = request.summary.damages.length;
  const hitBreakdown = request.mode === "horde"
    ? ` (${request.trueHits} True, ${hitCount - request.trueHits} Bonus)`
    : "";
  const lines = [
    `:dart: ${request.mode === "horde" ? "Horde" : "Single target"} x${hitCount}${hitBreakdown}: \`${summary}\``,
    `:mens: Starting at ${locationLabel(request.firstHitLocation)}`,
  ];
  if (request.mode === "horde") {
    [request.trueHits, request.magPer, request.woundsPer].forEach(assertSafeInteger);
  }
  return lines.join("\n");
}

function getTotalsField(result: WarhammerDefenderDamageResult): WarhammerDefenderDamageRequestMsgField {
  assertSafeInteger(result.totals.damage);
  const rows = [`Total Damage: ${result.totals.damage}`];
  if (result.request.mode === "horde") {
    assertSafeInteger(result.totals.magnitude as number);
    rows.push(`Total Magnitude: ${result.totals.magnitude}`);
    if (!result.totals.killCountUnavailable) {
      assertSafeInteger(result.totals.killCount as number);
    }
    rows.push(
      result.totals.killCountUnavailable
        ? "Kill Count: Unavailable (Mag per is 0)"
        : `Kill Count: ${result.totals.killCount}+`
    );
  }
  return { name: ":boom: Summary", value: rows.join("\n") };
}

/** Validate a saved result before any of it is formatted for Discord. */
function assertValidWarhammerDefenderDamageResult(
  result: WarhammerDefenderDamageResult
): void {
  if (
    !result ||
    !result.request ||
    !Array.isArray(result.entries) ||
    result.entries.length > 101 ||
    !result.totals
  ) {
    throw new Error("Invalid Warhammer damage result");
  }

  assertSafeInteger(result.request.summary.penetration);
  assertSafeInteger(result.request.summary.felling);
  assertSafeInteger(result.request.summary.devastating);
  assertSafeInteger(result.request.toughnessBonus);
  assertSafeInteger(result.request.fortitude);
  if (!Array.isArray(result.request.summary.damages)) {
    throw new Error("Invalid Warhammer damage result");
  }
  result.request.summary.damages.forEach(assertSafeInteger);
  if (result.entries.length < result.request.summary.damages.length) {
    throw new Error("Invalid Warhammer damage result");
  }

  const mode = result.request.mode;
  if (mode !== "single" && mode !== "horde") {
    throw new Error("Invalid Warhammer damage result");
  }
  const expectedHitCount = result.request.summary.damages.length;
  const realEntries = result.entries.filter((entry) => entry.kind === "hit");
  const syntheticEntries = result.entries.filter(
    (entry) => entry.kind === "bonus-devastating"
  );
  if (
    realEntries.length !== expectedHitCount ||
    syntheticEntries.length > 1 ||
    result.entries.length !== expectedHitCount + syntheticEntries.length ||
    (syntheticEntries.length > 0 && mode !== "horde") ||
    result.entries.some((entry, index) => {
      if (entry.kind === "bonus-devastating") {
        return (
          index !== result.entries.length - 1 ||
          entry.number !== expectedHitCount + 1
        );
      }
      const hitIndex = realEntries.indexOf(entry);
      return (
        entry.mode !== mode ||
        entry.index !== hitIndex ||
        entry.originalDamage !== result.request.summary.damages[hitIndex]
      );
    })
  ) {
    throw new Error("Invalid Warhammer damage result");
  }
}

/**
 * Remove the last remaining real hit row while preserving an appended synthetic
 * Bonus Devastating row. Shared by both packing sites so the rule cannot drift.
 */
function dropLastRealEntry(
  retainedIndices: number[],
  formattedEntries: FormattedEntry[]
): void {
  const syntheticIndex = retainedIndices.findIndex(
    (index) => formattedEntries[index].isSynthetic
  );
  const trailingSynthetic =
    syntheticIndex >= 0 && syntheticIndex === retainedIndices.length - 1;
  const lastRealIndex = trailingSynthetic
    ? syntheticIndex - 1
    : retainedIndices.length - 1;
  if (lastRealIndex < 0) {
    throw new Error("Unable to fit Warhammer damage webhook message");
  }
  retainedIndices.splice(lastRealIndex, 1);
}

/** Format one completed Defender Damage result as a bounded Discord embed. */
export default function getWarhammerDefenderDamageRequestMsg(
  result: WarhammerDefenderDamageResult,
  username: string
): WarhammerDefenderDamageRequestMsg {
  assertValidWarhammerDefenderDamageResult(result);

  const mode = result.request.mode;
  const msgTitle = `${sanitizeDiscordUsername(username)} calculated damage. ${
    mode === "horde" ? "Horde" : "Single target"
  }`;
  const context = getContext(result);
  if (
    msgTitle.length > EMBED_TITLE_MAX ||
    context.length > EMBED_DESCRIPTION_MAX
  ) {
    throw new Error("Invalid Warhammer damage result");
  }

  const formattedEntries = result.entries.map((entry) => formatHit(entry, result.request));
  const totalRealHits = result.entries.filter(
    (entry) => entry.kind === "hit"
  ).length;
  const totalsField = getTotalsField(result);
  let retainedIndices = formattedEntries.map((_, index) => index);
  const includedDetails: boolean[] = formattedEntries.map(() => false);
  let fields: WarhammerDefenderDamageRequestMsgField[] = [];
  let description = context;

  const updateOmissionDescription = () => {
    const retainedRealHits = retainedIndices.filter(
      (index) => !formattedEntries[index].isSynthetic
    ).length;
    const omittedCount = totalRealHits - retainedRealHits;
    description = omittedCount
      ? `${context}\n${OMITTED_NOTICE(
          retainedRealHits + 1,
          totalRealHits,
          omittedCount
        )}`
      : context;
  };

  const createFields = () =>
    makeEntryFields(
      retainedIndices.map((index) => {
        const entry = formattedEntries[index];
        return includedDetails[index] && entry.detail
          ? `${entry.essential}\n${entry.detail.join("\n")}`
          : entry.essential;
      })
    );

  while (true) {
    fields = [...createFields(), totalsField];
    updateOmissionDescription();

    if (checkPayload(msgTitle, description, fields)) break;
    dropLastRealEntry(retainedIndices, formattedEntries);
  }

  // Optional equations are packed only after the maximum ordered prefix of
  // essential hit outcomes has been retained.
  let detailsShortened = false;
  retainedIndices.forEach((index) => {
    const entry = formattedEntries[index];
    if (!entry.detail) return;
    includedDetails[index] = true;
    const candidateFields = [...createFields(), totalsField];
    if (!checkPayload(msgTitle, description, candidateFields)) {
      includedDetails[index] = false;
      detailsShortened = true;
    } else {
      fields = candidateFields;
    }
  });

  if (detailsShortened) {
    description += `${description ? "\n" : ""}${DETAILS_OMITTED_NOTICE}`;
    while (
      !checkPayload(msgTitle, description, [...createFields(), totalsField])
    ) {
      const lastDetailed = retainedIndices
        .slice()
        .reverse()
        .find((index) => includedDetails[index]);
      if (lastDetailed === undefined) {
        dropLastRealEntry(retainedIndices, formattedEntries);
        updateOmissionDescription();
        fields = [...createFields(), totalsField];
        continue;
      }
      includedDetails[lastDetailed] = false;
    }
    fields = [...createFields(), totalsField];
  }

  return { msgTitle, description, color: getColor(), fields };
}
