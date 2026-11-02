import { EMBED_TOTAL_MAX } from "../../../consts/discordEmbed";
import { getColor } from "../../getColor";
import { fitsInOneEmbed } from "../../embedFields";
import sanitizeDiscordUsername from "../../sanitizeDiscordUsername";
import {
  getCriticalLocationLabel,
  getCriticalPresentation,
  getCriticalStatusRollEffectLabel,
} from "./criticalPresentation";
import { formatCriticalTextForDiscord } from "./formatCriticalText";
import { ResolvedWarhammerCriticalResult } from "./criticalTypes";

export interface WarhammerCriticalRequestMsg {
  readonly msgTitle?: string;
  readonly description: string;
  readonly color: number;
  readonly fields: ReadonlyArray<{ readonly name: string; readonly value: string }>;
}

export function getWarhammerCriticalRequestMsg(
  result: ResolvedWarhammerCriticalResult,
  username: string
): WarhammerCriticalRequestMsg {
  const presentation = getCriticalPresentation(result);
  const { request } = result;
  const locationAndType = `${getCriticalLocationLabel(request.location)}${
    request.family === "humanoid" ? `, ${request.damageType}` : ""
  }`;
  const criticalText = presentation.sections
    .map((section) => {
      const logEntries = [
        ...section.statusRolls.map(
          (roll) =>
            `#${roll.entryNumber}: :arrow_right: **${roll.expression} = ${roll.result}**${getCriticalStatusRollEffectLabel(roll) ? ` — **${getCriticalStatusRollEffectLabel(roll)}**` : ""}${roll.condition ? ` (${roll.condition})` : ""}`
        ),
        ...section.checks.map(
          (check) =>
            `#${check.entryNumber}: \`${check.text}\`${check.condition ? ` (${check.condition})` : ""}`
        ),
      ];
      return [
        formatCriticalTextForDiscord(section.text),
        ...(logEntries.length > 0
          ? ["", "**Rolls and Checks**", ...logEntries]
          : []),
      ].join("\n");
    })
    .join("\n\n");
  const description = [
    `**${sanitizeDiscordUsername(username)} rolled a critical effect**`,
    `:skull_crossbones: ${locationAndType} – ${request.severity}`,
    "",
    criticalText,
  ].join("\n");
  const fields: Array<{ name: string; value: string }> = [];

  if (!fitsInOneEmbed("", description, fields, EMBED_TOTAL_MAX)) {
    throw new Error("Unable to fit critical effect in a Discord embed");
  }

  return { description, color: getColor(), fields };
}
