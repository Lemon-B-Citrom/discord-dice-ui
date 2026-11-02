import { HUMANOID_CRITICAL_TABLES, VEHICLE_CRITICAL_TABLES } from "./criticalTables";
import {
  CriticalEffect,
  CriticalTable,
  CriticalTableRow,
  WarhammerCriticalRequest,
  WarhammerCriticalResult,
} from "./criticalTypes";
import {
  isCriticalDamageType,
  isHumanoidCriticalLocation,
  isVehicleCriticalLocation,
} from "./normalizeWarhammerCritical";

const allTables = HUMANOID_CRITICAL_TABLES.concat(VEHICLE_CRITICAL_TABLES);

function getTable(request: WarhammerCriticalRequest): CriticalTable {
  const validLocation =
    (request.family === "humanoid" &&
      isHumanoidCriticalLocation(request.location)) ||
    (request.family === "vehicle" &&
      isVehicleCriticalLocation(request.location));
  const validDamageType =
    (request.family === "humanoid" && isCriticalDamageType(request.damageType)) ||
    (request.family === "vehicle" && request.damageType === undefined);
  if (!validLocation || !validDamageType) {
    throw new Error("Critical effect data is unavailable for this selection");
  }

  const table = allTables.find(
    (candidate) =>
      candidate.family === request.family &&
      candidate.location === request.location &&
      candidate.damageType === request.damageType
  );
  if (!table) {
    throw new Error("Critical effect data is unavailable for this selection");
  }
  return table;
}

function getRow(
  table: CriticalTable,
  severity: number
): CriticalTableRow {
  const row = table.rows.find((candidate) => candidate.severity === severity);
  if (!row || !row.text.trim()) {
    throw new Error("Critical effect data is unavailable for this selection");
  }
  return row;
}

function asEffect(table: CriticalTable, row: CriticalTableRow): CriticalEffect {
  return {
    ...row,
    ...(table.damageType ? { damageType: table.damageType } : {}),
  };
}

export function lookupWarhammerCritical(
  request: WarhammerCriticalRequest
): WarhammerCriticalResult {
  if (
    !Number.isInteger(request.severity) ||
    request.severity < 1 ||
    request.severity > 10
  ) {
    throw new Error("Critical severity must be a whole number from 1 to 10");
  }

  const table = getTable(request);
  const effect = getRow(table, request.severity);
  const prerequisites: CriticalEffect[] = [];
  const visited = new Set<number>([request.severity]);
  let prerequisiteSeverity = effect.prerequisiteSeverity;

  while (prerequisiteSeverity !== undefined) {
    if (visited.has(prerequisiteSeverity)) {
      throw new Error("Critical effect prerequisite contains a cycle");
    }
    visited.add(prerequisiteSeverity);
    const prerequisite = getRow(table, prerequisiteSeverity);
    prerequisites.unshift(asEffect(table, prerequisite));
    prerequisiteSeverity = prerequisite.prerequisiteSeverity;
  }

  return {
    request: { ...request },
    table,
    effect: asEffect(table, effect),
    prerequisites,
  };
}
