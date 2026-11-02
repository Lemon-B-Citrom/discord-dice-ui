import { requireNonNegativeInteger } from "../../safeInteger";
import {
  CriticalDamageType,
  CriticalFamily,
  CriticalLocation,
  CriticalNormalization,
  CriticalSeverity,
  HumanoidCriticalLocation,
  VehicleCriticalLocation,
  WarhammerCriticalRequest,
} from "./criticalTypes";

export const CRITICAL_DAMAGE_REQUIRED_ERROR =
  "Input critical damage before selecting a location";
export const CRITICAL_DATA_UNAVAILABLE_ERROR =
  "Critical effect data is unavailable for this selection";

export function parseCriticalSeverity(rawDamage: unknown): number | null {
  if (typeof rawDamage !== "string") return null;
  const parsedDamage = requireNonNegativeInteger(rawDamage.trim());
  return parsedDamage !== null && parsedDamage >= 1 && parsedDamage <= 10
    ? parsedDamage
    : null;
}

const HUMANOID_LOCATIONS: ReadonlyArray<HumanoidCriticalLocation> = [
  "head",
  "body",
  "arm",
  "leg",
];
const VEHICLE_LOCATIONS: ReadonlyArray<VehicleCriticalLocation> = [
  "motiveSystem",
  "hull",
  "weapon",
  "turret",
];
const DAMAGE_TYPES: ReadonlyArray<CriticalDamageType> = [
  "Energy",
  "Explosive",
  "Impact",
  "Rending",
];

export function isHumanoidCriticalLocation(
  location: unknown
): location is HumanoidCriticalLocation {
  return HUMANOID_LOCATIONS.indexOf(location as HumanoidCriticalLocation) >= 0;
}

export function isVehicleCriticalLocation(
  location: unknown
): location is VehicleCriticalLocation {
  return VEHICLE_LOCATIONS.indexOf(location as VehicleCriticalLocation) >= 0;
}

export function isCriticalDamageType(
  damageType: unknown
): damageType is CriticalDamageType {
  return DAMAGE_TYPES.indexOf(damageType as CriticalDamageType) >= 0;
}

export function normalizeWarhammerCritical(
  rawDamage: string,
  family: CriticalFamily,
  location: CriticalLocation,
  damageType?: CriticalDamageType
): CriticalNormalization {
  const parsedDamage = parseCriticalSeverity(rawDamage);
  if (parsedDamage === null) {
    return { request: null, errors: { damage: CRITICAL_DAMAGE_REQUIRED_ERROR } };
  }

  const locationMatchesFamily =
    (family === "humanoid" && isHumanoidCriticalLocation(location)) ||
    (family === "vehicle" && isVehicleCriticalLocation(location));
  const typeMatchesFamily =
    (family === "humanoid" && isCriticalDamageType(damageType)) ||
    (family === "vehicle" && damageType === undefined);
  if (!locationMatchesFamily || !typeMatchesFamily) {
    return { request: null, errors: { form: CRITICAL_DATA_UNAVAILABLE_ERROR } };
  }

  return {
    request: {
      severity: parsedDamage as CriticalSeverity,
      family,
      location,
      ...(damageType ? { damageType } : {}),
    } as WarhammerCriticalRequest,
    errors: {},
  };
}
