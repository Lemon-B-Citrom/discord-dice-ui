import {
  AnyDamageLocation,
  ArmorSlot,
  DAMAGE_LOCATIONS,
  DamageLocation,
  VEHICLE_DAMAGE_LOCATIONS,
  VEHICLE_FACINGS,
  VehicleDamageLocation,
  VehicleFacing,
} from "../../../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

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
const damageLocationReadingOrder: DamageLocation[] = [];
DAMAGE_LOCATION_ROWS.forEach((row) => {
  row.forEach((location) => damageLocationReadingOrder.push(location));
});
export const DAMAGE_LOCATION_READING_ORDER: ReadonlyArray<DamageLocation> =
  damageLocationReadingOrder;

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

/** Invert a forward location-to-token map into a token-to-location map. */
const invertTokens = <Location extends string>(
  tokens: Record<Location, string>
): Record<string, Location> =>
  (Object.keys(tokens) as Location[]).reduce<Record<string, Location>>(
    (inverted, location) => {
      inverted[tokens[location]] = location;
      return inverted;
    },
    {}
  );

export const DAMAGE_LOCATION_BY_WIRE_TOKEN: Record<string, DamageLocation> =
  invertTokens(DAMAGE_LOCATION_WIRE_TOKENS);

export const VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS: Record<
  VehicleDamageLocation,
  string
> = {
  "Motive Systems": "@motv",
  Hull: "@hull",
  Weapons: "@wpns",
  Turret: "@turr",
};

export const VEHICLE_DAMAGE_LOCATION_BY_WIRE_TOKEN: Record<
  string,
  VehicleDamageLocation
> = invertTokens(VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS);

/** The canonical wire token for a location, or `undefined` for a stranger. */
export const getDamageLocationWireToken = (
  location: AnyDamageLocation
): string | undefined =>
  DAMAGE_LOCATION_WIRE_TOKENS[location as DamageLocation] ||
  VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS[location as VehicleDamageLocation];

/** The location a wire token stands for, or `undefined` for a stranger. */
export const getDamageLocationByWireToken = (
  token: string
): AnyDamageLocation | undefined =>
  DAMAGE_LOCATION_BY_WIRE_TOKEN[token] ||
  VEHICLE_DAMAGE_LOCATION_BY_WIRE_TOKEN[token];

export const isDamageLocation = (
  location: string
): location is DamageLocation =>
  (DAMAGE_LOCATIONS as ReadonlyArray<string>).indexOf(location) >= 0;

export const isVehicleDamageLocation = (
  location: string
): location is VehicleDamageLocation =>
  (VEHICLE_DAMAGE_LOCATIONS as ReadonlyArray<string>).indexOf(location) >= 0;

export const isVehicleFacing = (facing: string): facing is VehicleFacing =>
  (VEHICLE_FACINGS as ReadonlyArray<string>).indexOf(facing) >= 0;

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

/** Resolve each successive humanoid hit through the starting location's cycle. */
export function getWarhammerDefenderDamageHitLocation(
  firstLocation: DamageLocation,
  hitIndex: number
): DamageLocation {
  const cycle = HIT_LOCATION_CYCLES[firstLocation];
  return cycle[hitIndex % cycle.length];
}
