import getRandom from "../../getRandom";
import {
  CriticalEffect,
  CriticalManualCheck,
  CriticalStatusRoll,
  ResolvedCriticalSection,
  ResolvedWarhammerCriticalResult,
  WarhammerCriticalResult,
} from "./criticalTypes";
import { findCriticalChecks } from "./formatCriticalText";

export type RollDie = (sides: number) => number;

const dieExpression = String.raw`\d+d\d+(?:[+−-]\d+)?`;
const statusQuantityPattern = new RegExp(
  String.raw`\b(?:(?<effect>Stunned|Blinded|Deafened|Useless)\s+for\s+(?<expression>\d+d\d+)\s+(?<unit>rounds?|hours?)|(?<fatigueExpression>\d+d\d+)\s+levels?\s+of\s+(?<fatigue>Fatigue))\b`,
  "gi"
);
const diePattern = new RegExp(dieExpression, "gi");
const deferredRollPattern = /\b(?:roll|rolling)\s+$/i;

interface RollOutcome {
  readonly dice: ReadonlyArray<number>;
  readonly result: number;
}

function getCondition(
  text: string,
  checkText: string,
  checkEnd: number,
  statusStart: number
) {
  const conditionStart = Math.max(
    checkEnd - 1,
    text.lastIndexOf(".", statusStart - 1),
    text.lastIndexOf(";", statusStart - 1)
  );
  const transition = text.slice(conditionStart + 1, statusStart).toLowerCase();
  const clauseStart = Math.max(
    text.lastIndexOf(".", statusStart - 1),
    text.lastIndexOf(";", statusStart - 1)
  );
  const clause = text.slice(clauseStart + 1, statusStart).toLowerCase();
  const qualifiers: string[] = [];
  if (/\b(?:each|any)\s+(?:character|crewmember|crew member)\b/.test(clause)) {
    qualifiers.push("Per affected character");
  }
  if (
    /\bor\s+(?:be|become|suffer|fall)\b/.test(transition) ||
    /\bif\s+(?:he|she|it|they)?\s*fails?\b/.test(transition)
  ) {
    qualifiers.push(`Only if ${checkText} fails`);
  }
  if (/\bif\s+(?:he|she|it|they)?\s*succeeds?\b/.test(transition)) {
    qualifiers.push(`Only if ${checkText} succeeds`);
  }
  if (/\bif\s+(?:(?:the\s+)?target|he|she|it|they)\s+survives\b/i.test(clause)) {
    qualifiers.push("Only if the target survives");
  }
  return qualifiers.length ? qualifiers.join("; ") : undefined;
}

function rollExpression(expression: string, rollDie: RollDie): RollOutcome {
  const match = /^(\d+)d(\d+)(?:([+−-])(\d+))?$/i.exec(expression);
  if (!match) throw new Error(`Unsupported critical dice: ${expression}`);
  const count = Number(match[1]);
  const sides = Number(match[2]);
  if (!Number.isSafeInteger(count) || count < 1 || count > 100 || sides < 2) {
    throw new Error(`Invalid critical dice: ${expression}`);
  }
  const modifier = match[4]
    ? Number(match[4]) * (match[3] === "+" ? 1 : -1)
    : 0;
  const dice = Array.from({ length: count }, () => {
    const value = rollDie(sides);
    if (!Number.isInteger(value) || value < 1 || value > sides) {
      throw new Error(`Critical die must return an integer from 1 to ${sides}`);
    }
    return value;
  });
  return {
    dice,
    result: dice.reduce((sum, value) => sum + value, modifier),
  };
}

function getStatusRolls(
  text: string,
  checks: ReadonlyArray<{ readonly text: string; readonly end: number }>,
  rollDie: RollDie
): CriticalStatusRoll[] {
  const statusRolls: CriticalStatusRoll[] = [];

  Array.from(text.matchAll(statusQuantityPattern)).forEach((match) => {
    const groups = match.groups || {};
    const expression = groups.expression || groups.fatigueExpression;
    const effect = groups.effect || groups.fatigue;
    if (!expression || !effect || match.index === undefined) return;
    const expressionStart = match.index + match[0].indexOf(expression);
    const precedingCheck = checks
      .filter((check) => check.end <= match.index!)
      .pop();
    statusRolls.push({
      start: expressionStart,
      end: expressionStart + expression.length,
      entryNumber: 0,
      expression,
      ...rollExpression(expression, rollDie),
      effect,
      unit: groups.unit || "levels",
      ...(precedingCheck
        ? {
            condition: getCondition(
              text,
              precedingCheck.text,
              precedingCheck.end,
              match.index
            ),
          }
        : {}),
    });
  });

  Array.from(text.matchAll(diePattern)).forEach((match) => {
    const start = match.index as number;
    const expression = match[0];
    const isAnnotated = statusRolls.some(
      (roll) => roll.start <= start && start < roll.end
    );
    if (isAnnotated) return;
    if (deferredRollPattern.test(text.slice(0, start))) return;
    statusRolls.push({
      start,
      end: start + expression.length,
      entryNumber: 0,
      expression,
      ...rollExpression(expression, rollDie),
    });
  });

  return statusRolls.sort((left, right) => left.start - right.start);
}

function resolveSection(
  effect: CriticalEffect,
  rollDie: RollDie
): ResolvedCriticalSection {
  const checksInText = findCriticalChecks(effect.text);
  const checks: CriticalManualCheck[] = checksInText.map(
    ({ start, end, text }) => ({ start, end, text, entryNumber: 0 })
  );
  return {
    effect,
    statusRolls: getStatusRolls(effect.text, checksInText, rollDie),
    checks,
  };
}

export function resolveWarhammerCriticalResult(
  result: WarhammerCriticalResult,
  rollDie: RollDie = getRandom
): ResolvedWarhammerCriticalResult {
  const effects = [...result.prerequisites, result.effect];
  let entryNumber = 1;
  const resolvedSections = effects.map((effect) => {
    const section = resolveSection(effect, rollDie);
    const statusRolls = section.statusRolls.map((roll) => ({
      ...roll,
      entryNumber: entryNumber++,
    }));
    const checks = section.checks.map((check) => ({
      ...check,
      entryNumber: entryNumber++,
    }));
    return { ...section, statusRolls, checks };
  });
  return {
    ...result,
    resolvedSections,
  };
}
