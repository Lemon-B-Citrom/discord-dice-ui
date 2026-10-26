import {
  WarhammerAttackerDamageAttempt,
  WarhammerAttackerDamageResult,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  EMBED_FIELD_VALUE_MAX,
  EMBED_TOTAL_MAX,
} from "../consts/discordEmbed";
import { formatWarhammerAttackerDamageSummaryHeader } from "./formatWarhammerAttackerDamageSummary";
import { getColor } from "./getColor";
import sanitizeDiscordUsername from "./sanitizeDiscordUsername";

export interface WarhammerAttackerDamageRequestMsgField {
  name: string;
  value: string;
}

export interface WarhammerAttackerDamageRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: WarhammerAttackerDamageRequestMsgField[];
}

const MAX_ATTEMPT_DETAIL_CHARACTERS = 280;
const DETAILS_TRUNCATED_NOTICE =
  "Roll details shortened; full breakdown available in the app.";

function getTearingLabel(
  tearing: WarhammerAttackerDamageResult["input"]["tearing"]
): string {
  switch (tearing) {
    case "tearing":
      return "Tearing";
    case "tripleTearing":
      return "Triple Tearing";
    default:
      return "";
  }
}

function chunkHitRows(rows: string[]): WarhammerAttackerDamageRequestMsgField[] {
  const fields: WarhammerAttackerDamageRequestMsgField[] = [];
  let value = "";

  rows.forEach((row) => {
    const nextValue = value ? `${value}\n${row}` : row;
    if (nextValue.length > EMBED_FIELD_VALUE_MAX) {
      fields.push({
        name: fields.length === 0 ? "Damage by hit" : "Damage",
        value,
      });
      value = row;
    } else {
      value = nextValue;
    }
  });

  if (value) {
    fields.push({
      name: fields.length === 0 ? "Damage by hit" : "Damage by hit (continued)",
      value,
    });
  }
  return fields;
}

function createSummaryFields(
  summary: WarhammerAttackerDamageSummary
): WarhammerAttackerDamageRequestMsgField[] {
  const header = formatWarhammerAttackerDamageSummaryHeader(summary);
  const parts = [
    ` ${header} `,
    ...summary.damages.map(
      (damage, index) => `${index > 0 ? ", " : ""}${damage}`
    ),
  ];
  const values: string[] = [];
  let value = "";

  parts.forEach((part) => {
    if (value.length + part.length + 2 > EMBED_FIELD_VALUE_MAX) {
      values.push(value);
      value = part.trimStart();
    } else {
      value += part;
    }
  });
  if (value) {
    values.push(value);
  }

  return values.map((summary, index) => ({
    name: index === 0 ? ":boom: Summary" : "Summary (continued)",
    value: `\`${summary}\``,
  }));
}

function appendEquationTerm(equation: string, value: number): string | null {
  const magnitude = `\`${Math.abs(value)}\``;
  const term = equation
    ? value < 0
      ? ` − \`${Math.abs(value)}\``
      : ` + ${magnitude}`
    : magnitude;
  return equation.length + term.length <= MAX_ATTEMPT_DETAIL_CHARACTERS
    ? equation + term
    : null;
}

function formatAttemptLine(
  attempt: WarhammerAttackerDamageAttempt,
  isSelected: boolean
): string {
  let equation = "";
  let termsOmitted = false;
  const append = (value: number) => {
    const nextEquation = appendEquationTerm(equation, value);
    if (nextEquation === null) {
      termsOmitted = true;
      return false;
    }
    equation = nextEquation;
    return true;
  };

  for (const die of attempt.baseRolls) {
    if (!append(die.damage)) {
      break;
    }
  }
  if (!termsOmitted) {
    for (const furyRoll of attempt.righteousFuryRolls) {
      if (!append(furyRoll)) {
        break;
      }
    }
  }

  const rolledDamage =
    attempt.baseRolls.reduce((sum, die) => sum + die.damage, 0) +
    attempt.righteousFuryRolls.reduce((sum, roll) => sum + roll, 0);
  const modifier = attempt.damage - rolledDamage;
  if (!termsOmitted && modifier !== 0) {
    const modifierTerm =
      modifier < 0 ? ` − ${Math.abs(modifier)}` : ` + ${modifier}`;
    if (
      equation.length + modifierTerm.length <=
      MAX_ATTEMPT_DETAIL_CHARACTERS
    ) {
      equation += modifierTerm;
    } else {
      termsOmitted = true;
    }
  }

  const equationText = `${equation}${termsOmitted ? " + …" : ""} = ${
    attempt.damage
  }`;
  const provenAdjustments = attempt.baseRolls
    .filter(({ roll, damage }) => roll !== damage)
    .map(({ roll, damage }) => `${roll} → ${damage}`);
  let line =
    attempt.righteousFuryRolls.length > 0 && !isSelected
      ? `**Righteous Fury!** ${equationText}`
      : equationText;

  for (const adjustment of provenAdjustments) {
    const [roll, damage] = adjustment.split(" → ");
    const suffix = `${
      line.includes("(Proven:") ? ", " : " (Proven: "
    }\`${roll}\` → \`${damage}\``;
    if (line.length + suffix.length + 1 > MAX_ATTEMPT_DETAIL_CHARACTERS) {
      line += "…";
      break;
    }
    line += suffix;
  }
  if (provenAdjustments.length > 0 && !line.endsWith("…")) {
    line += ")";
  }

  return line;
}

function appendAttemptDetails(
  fields: WarhammerAttackerDamageRequestMsgField[],
  hitBlocks: string[][],
  initialCharacterCount: number
): void {
  const rows: string[] = [];
  let detailsOmitted = false;
  const reservedFieldNameCharacters = 1024;
  const detailBudget = Math.max(
    0,
    Math.min(
      1000,
      EMBED_TOTAL_MAX -
        initialCharacterCount -
        DETAILS_TRUNCATED_NOTICE.length -
        reservedFieldNameCharacters
    )
  );
  let usedDetailCharacters = 0;

  hitBlocks.forEach((block) => {
    const [heading, detail] = block;
    if (detailsOmitted) {
      rows.push(heading);
      return;
    }

    const addedCharacters = detail.length + 1;
    if (usedDetailCharacters + addedCharacters > detailBudget) {
      rows.push(heading);
      detailsOmitted = true;
      return;
    }
    rows.push(`${heading}\n${detail}`);
    usedDetailCharacters += addedCharacters;
  });

  if (detailsOmitted) {
    rows.push(DETAILS_TRUNCATED_NOTICE);
  }

  fields.splice(0, fields.length);
  let value = "";
  const flush = () => {
    if (value) {
      fields.push({
        name: fields.length === 0 ? "Damage by hit" : "Damage",
        value,
      });
      value = "";
    }
  };

  rows.forEach((row) => {
    const nextValue = value ? `${value}\n${row}` : row;
    if (nextValue.length > EMBED_FIELD_VALUE_MAX) {
      flush();
      value = row;
    } else {
      value = nextValue;
    }
  });
  flush();
}

/** Format one completed attack as a bounded Discord embed request. */
export default function getWarhammerAttackerDamageRequestMsg(
  result: WarhammerAttackerDamageResult,
  username: string
): WarhammerAttackerDamageRequestMsg {
  const { input, damages, hitDetails } = result;
  if (
    damages.length !== input.hits ||
    hitDetails.length !== input.hits ||
    hitDetails.some(
      ({ attempts, selectedAttemptIndex }) =>
        attempts.length === 0 ||
        selectedAttemptIndex < 0 ||
        selectedAttemptIndex >= attempts.length
    )
  ) {
    throw new Error("Invalid Warhammer attack result");
  }

  const modifier =
    input.damageModifier < 0
      ? `− \`${Math.abs(input.damageModifier)}\``
      : `+ \`${input.damageModifier}\``;
  const msgTitle = `${sanitizeDiscordUsername(username)} performed an attack. \`${
    input.damageDice
  }d10\` ${modifier} x \`${input.hits}\``;
  const tearingLabel = getTearingLabel(input.tearing);
  let furySettings = "";
  if (input.rfConfirmsOn === 0) {
    furySettings = "No Righteous Fury";
  } else if (input.rfOn !== 10) {
    furySettings = `Righteous Fury on ${input.rfOn}`;
  }
  if (input.rfConfirmsOn !== 100 && input.rfConfirmsOn !== 0) {
    furySettings += `${
      input.rfOn === 10 ? "Righteous Fury " : ", "
    }confirms at ${input.rfConfirmsOn}%`;
  }
  const profile = [
    `Penetration ${input.penetration}`,
    input.felling !== 0 ? `Felling ${input.felling}` : "",
    input.devastating !== 0 ? `Devastating ${input.devastating}` : "",
    input.proven !== 0 ? `Proven ${input.proven}` : "",
    tearingLabel,
  ].filter(Boolean);
  const profileLine = profile.join(" · ");
  const description = furySettings
    ? `:crossed_swords: ${profileLine}\n:drop_of_blood: ${furySettings}`
    : `:crossed_swords: ${profileLine}`;
  const summaryFields = createSummaryFields({
    penetration: input.penetration,
    felling: input.felling,
    devastating: input.devastating,
    damages,
  });

  const hitBlocks = damages.map((damage, index) => {
    const selectedAttempt =
      hitDetails[index].attempts[hitDetails[index].selectedAttemptIndex];
    const furyCount = selectedAttempt.righteousFuryRolls.length;
    const furyLabel =
      furyCount > 0
        ? ` **Righteous Fury${furyCount > 1 ? ` x${furyCount}` : ""}!**`
        : "";
    const heading = `#${index + 1}: :arrow_right:${furyLabel} **${damage}**`;
    const orderedAttempts = hitDetails[index].attempts
      .map((attempt, attemptIndex) => ({
        attempt,
        attemptIndex,
        isSelected: attemptIndex === hitDetails[index].selectedAttemptIndex,
      }))
      .sort((left, right) => {
        if (left.isSelected !== right.isSelected) {
          return left.isSelected ? -1 : 1;
        }
        if (left.attempt.damage !== right.attempt.damage) {
          return right.attempt.damage - left.attempt.damage;
        }
        return left.attemptIndex - right.attemptIndex;
      });
    const attemptDetails = orderedAttempts.map(({ attempt, isSelected }) =>
      formatAttemptLine(attempt, isSelected)
    );
    return [heading, attemptDetails.join(" > ")];
  });
  const fields = chunkHitRows(hitBlocks.map(([heading]) => heading));

  const initialCharacterCount =
    msgTitle.length +
    description.length +
    fields.reduce(
      (count, field) => count + field.name.length + field.value.length,
      0
    ) +
    summaryFields.reduce(
      (count, field) => count + field.name.length + field.value.length,
      0
    );
  appendAttemptDetails(fields, hitBlocks, initialCharacterCount);
  fields.push(...summaryFields);

  return { msgTitle, description, color: getColor(), fields };
}
