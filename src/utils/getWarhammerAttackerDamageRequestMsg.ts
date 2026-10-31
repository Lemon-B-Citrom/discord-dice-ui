import {
  WarhammerAttackerDamageAttempt,
  WarhammerAttackerDamageResult,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import { WarhammerAttackerDamageSummary } from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { EMBED_FIELD_VALUE_MAX, EMBED_TOTAL_MAX } from "../consts/discordEmbed";
import chunkEmbedRows, {
  chunkTextForEmbed,
  EmbedField,
  fitsInOneEmbed,
} from "./embedFields";
import { getWarhammerAttackerDamageSummaryFragments } from "./formatWarhammerAttackerDamageSummary";
import { getColor } from "./getColor";
import orderWarhammerAttackerDamageAttempts from "./orderWarhammerAttackerDamageAttempts";
import projectWarhammerAttackerDamageSummary from "./projectWarhammerAttackerDamageSummary";
import sanitizeDiscordUsername from "./sanitizeDiscordUsername";

export type WarhammerAttackerDamageRequestMsgField = EmbedField;

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

/** The Righteous Fury settings line, or an empty string when Fury is off. */
function getFurySettings(
  input: WarhammerAttackerDamageResult["input"]
): string {
  if (input.alwaysConfirm) {
    return input.rfOn === 10
      ? "Righteous Fury always confirms"
      : `Righteous Fury on ${input.rfOn}, always confirms`;
  }
  if (input.rfConfirmsOn === 0) return "No Righteous Fury";
  if (input.rfConfirmsOn === 100) {
    return input.rfOn === 10 ? "" : `Righteous Fury on ${input.rfOn}`;
  }
  return input.rfOn === 10
    ? `Righteous Fury confirms at ${input.rfConfirmsOn}%`
    : `Righteous Fury on ${input.rfOn}, confirms at ${input.rfConfirmsOn}%`;
}

interface EquationTerm {
  text: string;
  negative: boolean;
}

/**
 * Join the terms of one attempt, dropping the tail rather than crossing the
 * per-attempt length limit. Returns whether anything was dropped.
 */
function joinEquationTerms(terms: ReadonlyArray<EquationTerm>): {
  text: string;
  truncated: boolean;
} {
  let text = "";
  for (const term of terms) {
    const separator = text ? (term.negative ? " − " : " + ") : "";
    if (
      text.length + separator.length + term.text.length >
      MAX_ATTEMPT_DETAIL_CHARACTERS
    ) {
      return { text, truncated: true };
    }
    text += `${separator}${term.text}`;
  }
  return { text, truncated: false };
}

function formatAttemptLine(
  attempt: WarhammerAttackerDamageAttempt,
  isSelected: boolean
): string {
  const rolledDamage =
    attempt.baseRolls.reduce((sum, die) => sum + die.damage, 0) +
    attempt.righteousFuryRolls.reduce((sum, roll) => sum + roll, 0);
  const modifier = attempt.damage - rolledDamage;
  const terms: EquationTerm[] = [
    ...attempt.baseRolls.map(({ damage }) => ({
      text: `\`${damage}\``,
      negative: false,
    })),
    ...attempt.righteousFuryRolls.map((roll) => ({
      text: `\`${roll}\``,
      negative: false,
    })),
  ];
  if (modifier !== 0) {
    terms.push({ text: `${Math.abs(modifier)}`, negative: modifier < 0 });
  }

  const equation = joinEquationTerms(terms);
  const equationText = `${equation.text}${equation.truncated ? " + …" : ""} = ${
    attempt.damage
  }`;
  let line =
    attempt.righteousFuryRolls.length > 0 && !isSelected
      ? `**Righteous Fury!** ${equationText}`
      : equationText;

  const provenNotes = attempt.baseRolls.filter(
    ({ roll, damage }) => roll !== damage
  );
  let proven = "";
  for (const note of provenNotes) {
    const addition = `${proven ? ", " : ""}\`${note.roll}\` → \`${
      note.damage
    }\``;
    if (
      line.length + " (Proven: ".length + proven.length + addition.length + 1 >
      MAX_ATTEMPT_DETAIL_CHARACTERS
    ) {
      return `${line} (Proven: ${proven}…`;
    }
    proven += addition;
  }
  return proven ? `${line} (Proven: ${proven})` : line;
}

/**
 * The hit summary, kept as backticked field-sized pieces so one long list of
 * damages cannot overflow a single embed field.
 */
function createSummaryFields(
  summary: WarhammerAttackerDamageSummary
): WarhammerAttackerDamageRequestMsgField[] {
  const fragments = getWarhammerAttackerDamageSummaryFragments(summary);
  return chunkTextForEmbed(fragments, EMBED_FIELD_VALUE_MAX - 2).map(
    (value, index) => ({
      name: index === 0 ? ":boom: Summary" : "Summary (continued)",
      value: `\`${value}\``,
    })
  );
}

interface HitRow {
  /** The headline, always shown so no hit disappears from the totals. */
  heading: string;
  /** Headline plus the attempt maths, shown while the embed has room. */
  row: string;
}

function createHitRow(
  result: WarhammerAttackerDamageResult,
  index: number
): HitRow {
  const damage = result.damages[index];
  const hit = result.hitDetails[index];
  const selectedAttempt = hit.attempts[hit.selectedAttemptIndex];
  const furyCount = selectedAttempt.righteousFuryRolls.length;
  const furyLabel =
    furyCount > 0
      ? ` **Righteous Fury${furyCount > 1 ? ` x${furyCount}` : ""}!**`
      : "";
  const heading = `#${index + 1}: :arrow_right:${furyLabel} **${damage}**`;
  const details = orderWarhammerAttackerDamageAttempts(hit)
    .map(({ attempt, isSelected }) => formatAttemptLine(attempt, isSelected))
    .join(" > ");
  return { heading, row: `${heading}\n${details}` };
}

/** Format one completed attack as a bounded Discord embed request. */
export default function getWarhammerAttackerDamageRequestMsg(
  result: WarhammerAttackerDamageResult,
  username: string
): WarhammerAttackerDamageRequestMsg {
  const { input, damages } = result;
  const summary = projectWarhammerAttackerDamageSummary(result);

  const modifier =
    input.damageModifier < 0
      ? `− \`${Math.abs(input.damageModifier)}\``
      : `+ \`${input.damageModifier}\``;
  const msgTitle = `${sanitizeDiscordUsername(
    username
  )} performed an attack. \`${input.damageDice}d10\` ${modifier} x \`${
    input.hits
  }\``;
  const profile = [
    `Penetration ${input.penetration}`,
    input.felling !== 0 ? `Felling ${input.felling}` : "",
    input.devastating !== 0 ? `Devastating ${input.devastating}` : "",
    input.proven !== 0 ? `Proven ${input.proven}` : "",
    getTearingLabel(input.tearing),
  ].filter(Boolean);
  const furySettings = getFurySettings(input);
  const description = [
    `:crossed_swords: ${profile.join(" · ")} · :mens: Starting at ${
      input.firstHitLocation
    }`,
    furySettings ? `:drop_of_blood: ${furySettings}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const summaryFields = createSummaryFields(summary);
  const hitRows = damages.map((_, index) => createHitRow(result, index));

  const fieldsFor = (
    withDetail: ReadonlyArray<boolean>,
    includeNotice: boolean
  ): WarhammerAttackerDamageRequestMsgField[] => {
    const rows = hitRows.map((hit, index) =>
      withDetail[index] ? hit.row : hit.heading
    );
    if (includeNotice) rows.push(DETAILS_TRUNCATED_NOTICE);
    return [
      ...chunkEmbedRows(rows, {
        firstName: "Damage by hit",
        // Kept short: every hit headline must fit in the hard embed ceiling.
        continuationName: "Damage",
      }),
      ...summaryFields,
    ];
  };

  // Every hit headline is kept, so the hard Discord ceiling applies rather than
  // a safer local budget. Each candidate reserves the shortening notice so the
  // final payload still fits after the last rejection.
  const withDetail = hitRows.map(() => false);
  let detailsShortened = false;
  hitRows.forEach((_, index) => {
    withDetail[index] = true;
    if (
      !fitsInOneEmbed(
        msgTitle,
        description,
        fieldsFor(withDetail, true),
        EMBED_TOTAL_MAX
      )
    ) {
      withDetail[index] = false;
      detailsShortened = true;
    }
  });

  const fields = fieldsFor(withDetail, detailsShortened);
  // Never send a headline-only payload that silently loses the attack summary,
  // so an unfittable result becomes a reported failure instead.
  if (!fitsInOneEmbed(msgTitle, description, fields, EMBED_TOTAL_MAX)) {
    throw new Error("Unable to fit Warhammer attack webhook message");
  }

  return { msgTitle, description, color: getColor(), fields };
}
