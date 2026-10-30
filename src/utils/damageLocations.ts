import {
  ArmorSlot,
  DamageLocation,
  VehicleDamageLocation,
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
 * `DAMAGE_LOCATIONS` order is left alone because validation depends on it.
 */
export const DAMAGE_LOCATION_READING_ORDER: ReadonlyArray<DamageLocation> =
  DAMAGE_LOCATION_ROWS.reduce<DamageLocation[]>(
    (order, row) => order.concat(row),
    []
  );

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

export const DAMAGE_LOCATION_WIRE_TOKENS: Record<DamageLocation, string> = {
  Head: "@head",
  Body: "@body",
  "Left Arm": "@larm",
  "Right Arm": "@rarm",
  "Left Leg": "@lleg",
  "Right Leg": "@rleg",
};

export const DAMAGE_LOCATION_BY_WIRE_TOKEN: Record<string, DamageLocation> =
  Object.keys(DAMAGE_LOCATION_WIRE_TOKENS).reduce<
    Record<string, DamageLocation>
  >((tokens, location) => {
    const typedLocation = location as DamageLocation;
    tokens[DAMAGE_LOCATION_WIRE_TOKENS[typedLocation]] = typedLocation;
    return tokens;
  }, {});

export const VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS: Record<VehicleDamageLocation, string> = {
  "Motive Systems": "@motv",
  Hull: "@hull",
  Weapons: "@wpns",
  Turret: "@turr",
};

export const VEHICLE_DAMAGE_LOCATION_BY_WIRE_TOKEN: Record<string, VehicleDamageLocation> =
  Object.keys(VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS).reduce<Record<string, VehicleDamageLocation>>(
    (tokens, location) => {
      const typedLocation = location as VehicleDamageLocation;
      tokens[VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS[typedLocation]] = typedLocation;
      return tokens;
    },
    {}
  );

export const VEHICLE_DAMAGE_LOCATIONS: ReadonlyArray<VehicleDamageLocation> = [
  "Motive Systems", "Hull", "Weapons", "Turret",
];

export const isVehicleDamageLocation = (
  location: DamageLocation | VehicleDamageLocation
): location is VehicleDamageLocation =>
  VEHICLE_DAMAGE_LOCATIONS.indexOf(location as VehicleDamageLocation) >= 0;

/** The armor slot that covers each body part in simple defense mode. */
export const ARMOR_SLOT_BY_LOCATION: Record<DamageLocation, ArmorSlot> = {
  Head: "headAP",
  Body: "bodyAP",
  "Left Arm": "armsAP",
  "Right Arm": "armsAP",
  "Left Leg": "legsAP",
  "Right Leg": "legsAP",
};

/**
 * Hit locations in the order successive hits move through them, per starting
 * location. Every cycle is the same length, so the hit index alone decides the
 * location.
 */
export const HIT_LOCATION_CYCLES: Record<
  DamageLocation,
  ReadonlyArray<DamageLocation>
> = {
  Head: ["Head", "Right Arm", "Body", "Left Arm", "Body", "Head"],
  "Right Arm": ["Right Arm", "Body", "Head", "Left Arm", "Body", "Head"],
  "Left Arm": ["Left Arm", "Body", "Head", "Right Arm", "Body", "Head"],
  Body: ["Body", "Left Leg", "Right Arm", "Body", "Right Leg", "Left Arm"],
  "Right Leg": ["Right Leg", "Body", "Left Leg", "Body", "Right Leg", "Body"],
  "Left Leg": ["Left Leg", "Body", "Right Leg", "Body", "Left Leg", "Body"],
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
    return DAMAGE_LOCATION_READING_ORDER[
      DAMAGE_LOCATION_READING_ORDER.length - 1
    ];
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
