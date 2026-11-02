import {
  CriticalLocation,
  CriticalManualCheck,
  CriticalStatusRoll,
  ResolvedWarhammerCriticalResult,
} from "./criticalTypes";

const locationLabels: { [location in CriticalLocation]: string } = {
  head: "Head",
  body: "Body",
  arm: "Arm",
  leg: "Leg",
  motiveSystem: "Motive System",
  hull: "Hull",
  weapon: "Weapon",
  turret: "Turret",
};

export function getCriticalLocationLabel(location: CriticalLocation): string {
  return locationLabels[location];
}

export interface CriticalPresentationSection {
  readonly heading: string;
  readonly text: string;
  readonly source: string;
  readonly isPrerequisite: boolean;
  readonly statusRolls: ReadonlyArray<CriticalStatusRoll>;
  readonly checks: ReadonlyArray<CriticalManualCheck>;
}

export interface CriticalPresentation {
  readonly title: string;
  readonly context: string;
  readonly sections: ReadonlyArray<CriticalPresentationSection>;
}

export function getCriticalStatusRollEffectLabel(
  roll: CriticalStatusRoll
): string | undefined {
  return roll.effect
    ? `${roll.effect}${roll.unit ? ` (${roll.unit})` : ""}`
    : undefined;
}

export function getCriticalPresentation(
  result: ResolvedWarhammerCriticalResult
): CriticalPresentation {
  const { request, effect, prerequisites } = result;
  const location = locationLabels[request.location];
  const damageType = request.damageType;
  const context = [
    `Critical Damage ${request.severity === 10 ? "10+" : request.severity}`,
    `${request.family === "humanoid" ? "Humanoid" : "Vehicle"} ${location}`,
    ...(damageType ? [`${damageType} damage type`] : []),
    `Source: ${effect.source}`,
  ].join(" · ");

  return {
    title: "Criticals",
    context,
    sections: result.resolvedSections.map((resolvedSection, index) => {
      const originalText = resolvedSection.effect.text;
      const text = [...resolvedSection.statusRolls]
        .sort((left, right) => right.start - left.start)
        .reduce(
          (current, roll) =>
            `${current.slice(0, roll.start)}${roll.result} (${roll.expression})${current.slice(roll.end)}`,
          originalText
        );
      const sectionEffect = resolvedSection.effect;
      return {
        heading:
          request.family === "humanoid"
            ? `${location}, ${damageType} – ${sectionEffect.rowLabel}`
            : `${location} – ${sectionEffect.rowLabel}`,
        text,
        source: sectionEffect.source,
        isPrerequisite: index < prerequisites.length,
        statusRolls: resolvedSection.statusRolls,
        checks: resolvedSection.checks,
      };
    }),
  };
}
