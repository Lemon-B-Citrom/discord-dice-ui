import {
  DamageLocation,
  WarhammerDamageEntry,
  WarhammerDamageRequest,
  WarhammerDamageResult,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import { getColor } from "./getColor";

export interface WarhammerDamageRequestMsgField {
  name: string;
  value: string;
}

export interface WarhammerDamageRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: WarhammerDamageRequestMsgField[];
}

const MAX_TITLE_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 4096;
const MAX_FIELD_NAME_LENGTH = 32;
const MAX_FIELD_VALUE_LENGTH = 1024;
const MAX_FIELDS = 25;
const MAX_TOTAL_LENGTH = 5800;
const MAX_USERNAME_LENGTH = 180;
const OMITTED_NOTICE = (first: number, last: number, count: number) =>
  `Hits #${first}–#${last} (${count} hit${count === 1 ? "" : "s"}) omitted. Totals include all hits; full breakdown is available in the app.`;
const DETAILS_OMITTED_NOTICE =
  "Equations shortened; full breakdown is available in the app.";

const markdownCharacters = new Set([
  "\\",
  "`",
  "*",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "#",
  "+",
  "-",
  ".",
  "!",
  "|",
  ">",
  "~",
  "<",
  ">",
]);

function sanitizeUsername(username: string): string {
  const tokens = Array.from(username || "USERNAME_MISSING")
    .map((character) => {
      const code = character.charCodeAt(0);
      if (
        code <= 0x1f ||
        code === 0x7f ||
        code === 0x2028 ||
        code === 0x2029
      ) {
        return " ";
      }
      if (character === "@") return "@\u200b";
      return markdownCharacters.has(character) ? `\\${character}` : character;
    });
  let bounded = "";
  tokens.forEach((token) => {
    if (bounded.length + token.length <= MAX_USERNAME_LENGTH) {
      bounded += token;
    }
  });
  return bounded.trim() || "USERNAME\\_MISSING";
}

function assertSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Invalid Warhammer damage result");
  }
}

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
  entry: WarhammerDamageEntry,
  request: WarhammerDamageRequest
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
  const reducedToughness = formatReduction(
    entry.toughnessBeforeFelling,
    request.summary.felling,
    entry.effectiveToughnessBonus
  );
  const toughness = entry.fortitudeApplied
    ? `\`${request.toughnessBonus}\` × \`2\`${request.summary.felling > 0 && entry.toughnessBeforeFelling > 0
      ? ` − \`${request.summary.felling}\`${request.summary.felling > entry.toughnessBeforeFelling ? " → " : " = "}\`${entry.effectiveToughnessBonus}\``
      : ` = \`${entry.effectiveToughnessBonus}\``}`
    : reducedToughness;
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
  const magnitudeBase = entry.classification === "overkill"
    ? `Per-unit Magnitude (\`${entry.baseMagnitude}\`)`
    : entry.classification === "partial-overkill"
    ? `Halved Per-unit Magnitude (\`${entry.baseMagnitude}\`)`
    : entry.classification === "no-damage" || entry.finalDamage <= 0
    ? "Nonpositive Damage (0)"
    : "Nonzero Damage (1)";
  const magnitudeEquation = `Magnitude: **\`${entry.magnitude}\`** = ${magnitudeBase}${entry.devastatingAdded > 0 ? ` + Devastating (\`${entry.devastatingAdded}\`)` : ""}`;
  return {
    essential: `${heading}${classification ? ` ${classification}` : ""} **${entry.finalDamage}** Damage, **${entry.magnitude}** Magnitude\n${location}`,
    detail: [damageEquation, magnitudeEquation],
    isSynthetic: false,
  };
}

function makeEntryFields(rows: string[]): WarhammerDamageRequestMsgField[] {
  const fields: WarhammerDamageRequestMsgField[] = [];
  let value = "";

  rows.forEach((row) => {
    if (row.length > MAX_FIELD_VALUE_LENGTH) {
      throw new Error("Invalid Warhammer damage result");
    }
    const nextValue = value ? `${value}\n\n${row}` : row;
    if (nextValue.length > MAX_FIELD_VALUE_LENGTH) {
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
  fields: WarhammerDamageRequestMsgField[]
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
  fields: WarhammerDamageRequestMsgField[]
): boolean {
  return (
    title.length <= MAX_TITLE_LENGTH &&
    description.length <= MAX_DESCRIPTION_LENGTH &&
    fields.length <= MAX_FIELDS &&
    fields.every(
      (field) =>
        field.name.length <= MAX_FIELD_NAME_LENGTH &&
        field.value.length <= MAX_FIELD_VALUE_LENGTH
    ) &&
    totalLength(title, description, fields) <= MAX_TOTAL_LENGTH
  );
}

function getContext(result: WarhammerDamageResult): string {
  const request = result.request;
  [
    request.armor.headAP,
    request.armor.bodyAP,
    request.armor.armsAP,
    request.armor.legsAP,
  ].forEach(assertSafeInteger);
  // The saved, validated input contains only the summary grammar. Remove copy
  // wrappers and line breaks so its inline code cannot change Discord markup.
  const rawSummary = result.draft.attackSummaryString.replace(/`/g, "").replace(/\s+/g, " ").trim();
  const summary = rawSummary.length > 3500
    ? `${rawSummary.slice(0, 3500)}… (summary shortened)`
    : rawSummary;
  const hitCount = request.summary.damages.length;
  const hitBreakdown = request.mode === "horde"
    ? ` (${request.trueHits} True, ${hitCount - request.trueHits} Bonus)`
    : "";
  const lines = [
    `:dart: ${request.mode === "horde" ? "Horde" : "Single target"} x${hitCount}${hitBreakdown}: \`${summary}\``,
    `:mens: Starting at ${locationLabel(request.firstHitLocation)}`,
  ];
  if (request.mode === "horde") {
    [request.trueHits, request.magPer, request.devastating, request.woundsPer].forEach(
      assertSafeInteger
    );
  }
  return lines.join("\n");
}

function getTotalsField(result: WarhammerDamageResult): WarhammerDamageRequestMsgField {
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

/** Format one completed Damage Calculator result as a bounded Discord embed. */
export default function getWarhammerDamageRequestMsg(
  result: WarhammerDamageResult,
  username: string
): WarhammerDamageRequestMsg {
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
  const msgTitle = `${sanitizeUsername(username)} calculated damage. ${
    mode === "horde" ? "Horde" : "Single target"
  }`;
  const context = getContext(result);
  if (msgTitle.length > MAX_TITLE_LENGTH || context.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Invalid Warhammer damage result");
  }

  const formattedEntries = result.entries.map((entry) => formatHit(entry, result.request));
  const totalRealHits = realEntries.length;
  const totalsField = getTotalsField(result);
  let retainedIndices = formattedEntries.map((_, index) => index);
  const includedDetails: boolean[] = formattedEntries.map(() => false);
  let fields: WarhammerDamageRequestMsgField[] = [];
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
    if (retainedIndices.length === 0) {
      throw new Error("Unable to fit Warhammer damage webhook message");
    }

    // Keep an appended synthetic Bonus Devastating entry even if some real
    // hit rows must be omitted to satisfy Discord's single-embed budget.
    const syntheticIndex = retainedIndices.findIndex(
      (index) => formattedEntries[index].isSynthetic
    );
    if (
      syntheticIndex >= 0 &&
      syntheticIndex === retainedIndices.length - 1
    ) {
      const lastRealIndex = syntheticIndex - 1;
      if (lastRealIndex < 0) {
        throw new Error("Unable to fit Warhammer damage webhook message");
      } else {
        retainedIndices.splice(lastRealIndex, 1);
      }
    } else {
      retainedIndices.pop();
    }
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
        const syntheticIndex = retainedIndices.findIndex(
          (index) => formattedEntries[index].isSynthetic
        );
        const lastRealIndex =
          syntheticIndex === retainedIndices.length - 1
            ? syntheticIndex - 1
            : retainedIndices.length - 1;
        if (lastRealIndex < 0) {
          throw new Error("Unable to fit Warhammer damage webhook message");
        }
        retainedIndices.splice(lastRealIndex, 1);
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
