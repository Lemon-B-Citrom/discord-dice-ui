export type CriticalTextFormat = "bold" | "code";

export interface CriticalTextSegment {
  readonly text: string;
  readonly format?: CriticalTextFormat;
}

const checkPattern =
  String.raw`\b(?:Very\s+(?:Easy|Difficult|Hard)|Near\s+Impossible|Easy|Routine|Ordinary|Challenging|Difficult|Hard|Impossible|Difficulty)\s+\([+−-]\d+\)\s+[A-Za-z]+(?:\s+[A-Za-z]+){0,2}\s+tests?\b`;
const criticalChecksPattern = new RegExp(checkPattern, "gi");
const statusEffectPattern =
  String.raw`(?:Blood Loss|Lost (?:Hand|Arm|Leg|Foot|Eye)|Weapon/Turret Locked|Vehicle Destroyed|Weapon Destroyed|Motive Systems (?:Impaired|Crippled|Destroyed)|Out of Control|On Fire|Blinded|Deafened|Stunned|Prone|Unconscious|Useless|Jammed|Fatigue)`;
const durationPattern =
  String.raw`(?:turns?|rounds?|hours?|minutes?|days?|weeks?|months?|years?|permanent(?:ly)?)`;
const quantifiedEffectPattern =
  String.raw`\b\d+\s+(?:levels?|points?)\s+of\s+${statusEffectPattern}\b`;
const quantifiedDurationPattern = String.raw`\b\d+\s+${durationPattern}\b`;
const emphasisPattern =
  String.raw`\b\d+d\d+(?:[+−-]\d+)?\b|\b${statusEffectPattern}\b|\b${durationPattern}\b`;
const tokenPattern = new RegExp(
  `(${checkPattern}|${quantifiedEffectPattern}|${quantifiedDurationPattern}|${emphasisPattern})`,
  "gi"
);
const checkTokenPattern = new RegExp(`^(?:${checkPattern})$`, "i");
const emphasisTokenPattern = new RegExp(`^(?:${emphasisPattern})$`, "i");
const quantifiedEffectTokenPattern = new RegExp(
  `^(\\d+)(\\s+(?:levels?|points?)\\s+of\\s+)(${statusEffectPattern})$`,
  "i"
);
const quantifiedDurationTokenPattern = new RegExp(
  `^(\\d+)(\\s+)(${durationPattern})$`,
  "i"
);

export interface CriticalCheckMatch {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export function findCriticalChecks(text: string): CriticalCheckMatch[] {
  return Array.from(text.matchAll(criticalChecksPattern)).map((match) => {
    const start = match.index as number;
    return { text: match[0], start, end: start + match[0].length };
  });
}

export function getCriticalTextSegments(text: string): CriticalTextSegment[] {
  return text.split(tokenPattern).reduce<CriticalTextSegment[]>(
    (segments, part) => {
      if (checkTokenPattern.test(part)) {
        segments.push({ text: part, format: "code" });
        return segments;
      }

      const quantifiedEffect = quantifiedEffectTokenPattern.exec(part);
      if (quantifiedEffect) {
        segments.push(
          { text: quantifiedEffect[1], format: "bold" },
          { text: quantifiedEffect[2] },
          { text: quantifiedEffect[3], format: "bold" }
        );
        return segments;
      }

      const quantifiedDuration = quantifiedDurationTokenPattern.exec(part);
      if (quantifiedDuration) {
        segments.push(
          { text: quantifiedDuration[1], format: "bold" },
          { text: quantifiedDuration[2] },
          { text: quantifiedDuration[3], format: "bold" }
        );
        return segments;
      }

      segments.push({
        text: part,
        ...(emphasisTokenPattern.test(part) ? { format: "bold" as const } : {}),
      });
      return segments;
    },
    []
  );
}

export function formatCriticalTextForDiscord(text: string): string {
  return getCriticalTextSegments(text)
    .map(({ text: part, format }) =>
      format === "code" ? `\`${part}\`` : format === "bold" ? `**${part}**` : part
    )
    .join("");
}
