import {
  WarhammerAttackAttempt,
  WarhammerAttackResult,
} from "../components/WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";
import { getColor } from "./getColor";

export interface WarhammerAttackRequestMsgField {
  name: string;
  value: string;
}

export interface WarhammerAttackRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: WarhammerAttackRequestMsgField[];
}

const MAX_EMBED_TOTAL_CHARACTERS = 6000;
const MAX_EMBED_FIELD_VALUE_CHARACTERS = 1024;
const MAX_ATTEMPT_DETAIL_CHARACTERS = 280;
const DETAILS_TRUNCATED_NOTICE =
  "Roll details shortened; full breakdown available in the app.";
const MARKDOWN_CHARACTERS = new Set([
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
]);

function formatUsername(username: string): string {
  const sanitized = Array.from(username)
    .map((character) => {
      const codePoint = character.charCodeAt(0);
      if (
        codePoint <= 0x1f ||
        codePoint === 0x7f ||
        codePoint === 0x2028 ||
        codePoint === 0x2029
      ) {
        return " ";
      }
      if (character === "@") {
        return "@\u200b";
      }
      return MARKDOWN_CHARACTERS.has(character) ? `\\${character}` : character;
    })
    .join("")
    .trim();
  return Array.from(sanitized || "USERNAME_MISSING")
    .slice(0, 180)
    .join("");
}

function getTearingLabel(
  tearing: WarhammerAttackResult["input"]["tearing"]
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

function chunkHitRows(rows: string[]): WarhammerAttackRequestMsgField[] {
  const fields: WarhammerAttackRequestMsgField[] = [];
  let value = "";

  rows.forEach((row) => {
    const nextValue = value ? `${value}\n${row}` : row;
    if (nextValue.length > MAX_EMBED_FIELD_VALUE_CHARACTERS) {
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
  penetration: number,
  felling: number,
  damages: number[]
): WarhammerAttackRequestMsgField[] {
  const parts = [
    ` Pen ${penetration}, Fel ${felling}: `,
    ...damages.map((damage, index) => `${index > 0 ? ", " : ""}${damage}`),
  ];
  const values: string[] = [];
  let value = "";

  parts.forEach((part) => {
    if (value.length + part.length + 2 > MAX_EMBED_FIELD_VALUE_CHARACTERS) {
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
  attempt: WarhammerAttackAttempt,
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
  fields: WarhammerAttackRequestMsgField[],
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
      MAX_EMBED_TOTAL_CHARACTERS -
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
    if (nextValue.length > MAX_EMBED_FIELD_VALUE_CHARACTERS) {
      flush();
      value = row;
    } else {
      value = nextValue;
    }
  });
  flush();
}

/** Format one completed attack as a bounded Discord embed request. */
export default function getWarhammerAttackRequestMsg(
  result: WarhammerAttackResult,
  username: string
): WarhammerAttackRequestMsg {
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
  const msgTitle = `${formatUsername(username)} performed an attack. \`${
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
    input.proven !== 0 ? `Proven ${input.proven}` : "",
    tearingLabel,
  ].filter(Boolean);
  const profileLine = profile.join(" · ");
  const description = furySettings
    ? `:crossed_swords: ${profileLine}\n:drop_of_blood: ${furySettings}`
    : `:crossed_swords: ${profileLine}`;
  const summaryFields = createSummaryFields(
    input.penetration,
    input.felling,
    damages
  );

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
