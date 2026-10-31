import {
  WarhammerDefenderDamageHit,
  WarhammerDefenderDamageRequest,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderVehicleDamageHit,
  WarhammerHumanoidDamageHit,
  WarhammerHumanoidDamageRequest,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  getWarhammerMagnitudeBasis,
  getWarhammerToughnessTerm,
} from "./warhammerDefenderDamageLabels";

/**
 * One piece of a damage equation. Renderers decide how a code value looks, so
 * the results modal and the Discord embed share these tokens instead of each
 * rebuilding the same conditionals.
 */
export type EquationToken =
  | { kind: "text"; text: string }
  | { kind: "code"; value: number }
  | { kind: "strongCode"; value: number };

const text = (value: string): EquationToken => ({ kind: "text", text: value });
const code = (value: number): EquationToken => ({ kind: "code", value });
const strongCode = (value: number): EquationToken => ({
  kind: "strongCode",
  value,
});

const subtraction = (
  felling: number,
  fellingExceedsBase: boolean,
  effective: number
): EquationToken[] => [
  text(" − "),
  code(felling),
  text(fellingExceedsBase ? " → " : " = "),
  code(effective),
];

const armorTokens = (
  entry: WarhammerHumanoidDamageHit,
  request: WarhammerHumanoidDamageRequest
): EquationToken[] => {
  if (!entry.showArmorTerm) return [];
  const { armorBeforePenetration, effectiveArmor } = entry;
  if (effectiveArmor >= armorBeforePenetration) return [code(effectiveArmor)];
  return [
    code(armorBeforePenetration),
    text(" − "),
    code(request.summary.penetration),
    text(request.summary.penetration > armorBeforePenetration ? " → " : " = "),
    code(effectiveArmor),
  ];
};

const toughnessTokens = (
  entry: WarhammerHumanoidDamageHit,
  request: WarhammerHumanoidDamageRequest
): EquationToken[] => {
  const term = getWarhammerToughnessTerm(entry, request);
  const { fortitudeApplied, advanced, beforeFelling, felling, effective } =
    term;
  const reduced = term.reduced
    ? subtraction(felling, term.fellingExceedsBase, effective)
    : [text(" = "), code(effective)];

  if (fortitudeApplied) {
    // A per-location add-on joins the Toughness Bonus inside the ×2 operand.
    const base =
      advanced > 0
        ? [
            text("("),
            code(request.toughnessBonus),
            text(" + "),
            code(advanced),
            text(")"),
          ]
        : [code(request.toughnessBonus)];
    return [...base, text(" × "), code(2), ...reduced];
  }

  if (advanced > 0) {
    return [
      code(request.toughnessBonus),
      text(" + "),
      code(advanced),
      ...reduced,
    ];
  }

  return term.reduced
    ? [
        code(beforeFelling),
        ...subtraction(felling, term.fellingExceedsBase, effective),
      ]
    : [code(effective)];
};

/**
 * `**16** = Base \`11\` − AP (\`10\`) + RF \`15\`` for a hit whose base penetrated,
 * and `**1** = Base \`10\` − AP (\`20\`) → \`0\` (RF suppressed) → \`1\`` for one whose
 * base was absorbed: a suppressed Fury cannot open the armor, but still chips
 * one damage. Vehicle hits subtract no Toughness, so none is shown.
 */
const vehicleDamageTokens = (
  entry: WarhammerDefenderVehicleDamageHit
): EquationToken[] => {
  const baseApplied = Math.max(0, entry.baseDamage - entry.effectiveArmor);
  const tokens = [
    strongCode(entry.finalDamage),
    text(" = Base "),
    code(entry.baseDamage),
    text(" − AP ("),
    code(entry.effectiveArmor),
    text(")"),
  ];
  if (baseApplied === 0) tokens.push(text(" → "), code(baseApplied));

  if (entry.righteousFuryExtra === 0) return tokens;
  if (entry.rfApplied) {
    return [...tokens, text(" + RF "), code(entry.righteousFuryExtra)];
  }
  return [...tokens, text(" (RF suppressed) → "), code(entry.finalDamage)];
};

/** `**9** = \`10\` − Armor (\`4\` − \`3\` = \`1\`) − Toughness (\`3\` − \`5\` → \`0\`)` */
export function getDamageEquationTokens(
  entry: WarhammerDefenderDamageHit,
  request: WarhammerDefenderDamageRequest
): EquationToken[] {
  if (entry.targetFamily === "vehicle") {
    if (request.targetFamily !== "vehicle")
      throw new Error("Damage entry and request targets do not match");
    return vehicleDamageTokens(entry);
  }
  if (request.targetFamily !== "humanoid")
    throw new Error("Damage entry and request targets do not match");
  const armor = armorTokens(entry, request);
  return [
    ...(entry.mode === "horde" ? [text("Damage: ")] : []),
    strongCode(entry.finalDamage),
    text(" = "),
    code(entry.originalDamage),
    ...(armor.length > 0 ? [text(" − Armor ("), ...armor, text(")")] : []),
    text(" − Toughness ("),
    ...toughnessTokens(entry, request),
    text(")"),
  ];
}

/** `Magnitude: **7** = Per-unit Magnitude (\`6\`) + Devastating (\`1\`)` */
export function getMagnitudeEquationTokens(
  hit: WarhammerDefenderHordeDamageHit
): EquationToken[] {
  const basis = getWarhammerMagnitudeBasis(hit);
  const showsOperand =
    hit.classification === "overkill" ||
    hit.classification === "partial-overkill";
  return [
    text("Magnitude: "),
    strongCode(hit.magnitude),
    text(" = "),
    text(basis.label),
    ...(showsOperand ? [text(" ("), code(basis.operand), text(")")] : []),
    ...(hit.devastatingAdded > 0
      ? [text(" + Devastating ("), code(hit.devastatingAdded), text(")")]
      : []),
  ];
}

/** Discord markdown for a whole equation. */
export function formatEquationTokens(
  tokens: ReadonlyArray<EquationToken>
): string {
  return tokens
    .map((token) => {
      if (token.kind === "text") return token.text;
      if (token.kind === "code") return `\`${token.value}\``;
      return `**\`${token.value}\`**`;
    })
    .join("");
}
