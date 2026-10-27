import {
  DAMAGE_LOCATIONS,
  DamageLocation,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

/**
 * The body diagram as rows, each horizontally centred: one head, the
 * arm/body/arm line, then the centred pair of legs. Reading order and visual
 * order agree, so DOM order stays the accessible order.
 */
export const DAMAGE_LOCATION_ROWS: ReadonlyArray<
  ReadonlyArray<DamageLocation>
> = [["Head"], ["Left Arm", "Body", "Right Arm"], ["Left Leg", "Right Leg"]];

/**
 * The same locations flattened: the order the rows are read in. The canonical
 * `DAMAGE_LOCATIONS` order is left alone because validation and hit sequencing
 * depend on it.
 */
export const DAMAGE_LOCATION_READING_ORDER: ReadonlyArray<DamageLocation> = DAMAGE_LOCATION_ROWS.reduce<
  DamageLocation[]
>((order, row) => order.concat(row), []);

/**
 * Captions short enough for one line in a fixed-width diagram cell. The full
 * location name is still used as the accessible name and as the stored value.
 */
export const DAMAGE_LOCATION_SHORT_LABELS: Record<DamageLocation, string> = {
  Head: "Head",
  Body: "Body",
  "Left Arm": "L. Arm",
  "Right Arm": "R. Arm",
  "Left Leg": "L. Leg",
  "Right Leg": "R. Leg",
};

export type MenuMoveKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End";

const findRow = (location: DamageLocation) =>
  DAMAGE_LOCATION_ROWS.find((row) => row.indexOf(location) !== -1);

/**
 * Move through the diagram by geometry rather than by flat index, so `Down` from
 * `Head` lands on `Left Arm` and `Down` from a leg stays on the last row.
 * Returns `null` when the move would leave the diagram or the row.
 */
export function getAdjacentLocation(
  location: DamageLocation,
  key: MenuMoveKey
): DamageLocation | null {
  if (key === "Home") return DAMAGE_LOCATION_READING_ORDER[0];
  if (key === "End") {
    return DAMAGE_LOCATION_READING_ORDER[DAMAGE_LOCATION_READING_ORDER.length - 1];
  }

  const row = findRow(location);
  if (!row) return null;
  const rowIndex = DAMAGE_LOCATION_ROWS.indexOf(row);
  const position = row.indexOf(location);

  if (key === "ArrowLeft") {
    return position > 0 ? row[position - 1] : null;
  }
  if (key === "ArrowRight") {
    return position < row.length - 1 ? row[position + 1] : null;
  }

  const nextRowIndex = key === "ArrowDown" ? rowIndex + 1 : rowIndex - 1;
  const nextRow = DAMAGE_LOCATION_ROWS[nextRowIndex];
  if (!nextRow) return null;
  return nextRow[Math.min(position, nextRow.length - 1)];
}

/** Every location appears in the diagram exactly once. */
export function isCompleteLocationDiagram(): boolean {
  if (DAMAGE_LOCATION_READING_ORDER.length !== DAMAGE_LOCATIONS.length) {
    return false;
  }
  return DAMAGE_LOCATIONS.every(
    (location) => DAMAGE_LOCATION_READING_ORDER.indexOf(location) !== -1
  );
}
