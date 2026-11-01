import { DamageLocation } from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  DAMAGE_LOCATION_READING_ORDER,
  DAMAGE_LOCATION_ROWS,
} from "../../utils/WarhammerCustom/shared/damageLocations";

export type MenuMoveKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End";

const findRow = (location: DamageLocation) =>
  DAMAGE_LOCATION_ROWS.find((row) => row.indexOf(location) !== -1);

/** Move through the location diagram by row and column. */
export function getAdjacentLocation(
  location: DamageLocation,
  key: MenuMoveKey
): DamageLocation | null {
  if (key === "Home") return DAMAGE_LOCATION_READING_ORDER[0];
  if (key === "End") {
    return DAMAGE_LOCATION_READING_ORDER[
      DAMAGE_LOCATION_READING_ORDER.length - 1
    ];
  }

  const row = findRow(location);
  if (!row) return null;
  const rowIndex = DAMAGE_LOCATION_ROWS.indexOf(row);
  const position = row.indexOf(location);

  if (key === "ArrowLeft") return position > 0 ? row[position - 1] : null;
  if (key === "ArrowRight") {
    return position < row.length - 1 ? row[position + 1] : null;
  }

  const nextRow =
    DAMAGE_LOCATION_ROWS[key === "ArrowDown" ? rowIndex + 1 : rowIndex - 1];
  return nextRow ? nextRow[Math.min(position, nextRow.length - 1)] : null;
}
