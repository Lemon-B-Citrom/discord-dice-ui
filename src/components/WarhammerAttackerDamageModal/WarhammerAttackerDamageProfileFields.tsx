import React from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import {
  AttackerDamageTearing,
  AttackerDamageValues,
} from "./WarhammerAttackerDamageTypes";
import { WARHAMMER_ATTACKER_DAMAGE_DEFAULTS } from "../../utils/normalizeWarhammerAttackerDamage";
import styles from "./WarhammerAttackerDamageForm.module.css";
import FirstHitLocationSelect from "./FirstHitLocationSelect";
import {
  AnyDamageLocation,
  VEHICLE_DAMAGE_LOCATIONS,
  VehicleDamageLocation,
} from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  isDamageLocation,
  isVehicleDamageLocation,
} from "../../utils/damageLocations";

export type AttackerDamageNumericField =
  | "hits"
  | "damageDice"
  | "penetration"
  | "felling"
  | "devastating"
  | "proven"
  | "rfOn"
  | "rfConfirmsOn";

const ATTRIBUTE_FIELDS: ReadonlyArray<{
  field: AttackerDamageNumericField;
  label: string;
}> = [
  { field: "penetration", label: "Pen" },
  { field: "felling", label: "Felling" },
  { field: "devastating", label: "Devastating" },
  { field: "proven", label: "Proven" },
];

const TEARING_OPTIONS: ReadonlyArray<{
  value: AttackerDamageTearing;
  label: string;
}> = [
  { value: "none", label: "No Tearing" },
  { value: "tearing", label: "Tearing" },
  { value: "tripleTearing", label: "Triple Tearing" },
];

interface WarhammerAttackerDamageProfileFieldsProps {
  values: AttackerDamageValues;
  onNumericChange: (field: AttackerDamageNumericField, value: string) => void;
  onModifierChange: (value: string) => void;
  onTearingChange: (tearing: AttackerDamageTearing) => void;
  onAlwaysConfirmChange: (alwaysConfirm: boolean) => void;
  onLocationChange: (location: AnyDamageLocation) => void;
  locationError?: string;
}

/** The damage profile: what is rolled, its traits, and the Fury settings. */
function WarhammerAttackerDamageProfileFields({
  values,
  onNumericChange,
  onModifierChange,
  onTearingChange,
  onAlwaysConfirmChange,
  onLocationChange,
  locationError,
}: WarhammerAttackerDamageProfileFieldsProps) {
  // Both selectors read the one stored location, so picking either one clears
  // the other without a second source of truth.
  const locationErrorId = locationError
    ? "attacker-damage-first-hit-location-error"
    : undefined;
  const humanoidLocation = isDamageLocation(values.firstHitLocation)
    ? values.firstHitLocation
    : "";
  const vehicleLocation = isVehicleDamageLocation(values.firstHitLocation)
    ? values.firstHitLocation
    : "";

  return (
    <Row className={styles.attackDetails}>
      <Col xs={12} md={7}>
        <div className={styles.damageExpression}>
          <Form.Control
            aria-label="Damage dice count"
            className={styles.compactInput}
            type="number"
            min={0}
            placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.damageDice}`}
            value={values.damageDice}
            onChange={(event) =>
              onNumericChange("damageDice", event.target.value)
            }
          />
          <span>d10 +</span>
          <Form.Control
            aria-label="Damage modifier"
            className={styles.compactInput}
            type="number"
            placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.damageModifier}`}
            value={values.damageModifier}
            onChange={(event) => onModifierChange(event.target.value)}
          />
        </div>

        <fieldset className={styles.tearingOptions}>
          <legend className="sr-only">Tearing</legend>
          {TEARING_OPTIONS.map(({ value, label }) => (
            <Form.Check
              key={value}
              type="radio"
              label={label}
              name="attackerDamageTearing"
              id={`attacker-damage-tearing-${value}`}
              checked={values.tearing === value}
              onChange={() => onTearingChange(value)}
            />
          ))}
        </fieldset>
        <fieldset className={styles.locationField}>
          <legend className={styles.locationHeading}>
            First Hit Location
          </legend>
          <Row>
            <Col xs={6} className={styles.humanoidLocationColumn}>
              <FirstHitLocationSelect
                value={humanoidLocation}
                onChange={onLocationChange}
                emptyCaption="Humanoid"
                ariaDescribedBy={locationErrorId}
              />
            </Col>
            <Col xs={6} className={styles.vehicleLocationColumn}>
              <Form.Control
                as="select"
                id="attacker-damage-vehicle-hit-location"
                aria-label="Vehicle"
                className={`${styles.locationControl}${
                  vehicleLocation ? ` ${styles.locationControlActive}` : ""
                }`}
                value={vehicleLocation}
                isInvalid={Boolean(locationError)}
                aria-describedby={locationErrorId}
                onChange={(event) =>
                  onLocationChange(
                    event.target.value as VehicleDamageLocation
                  )
                }
              >
                {!vehicleLocation && (
                  <option value="" disabled>
                    Vehicle
                  </option>
                )}
                {VEHICLE_DAMAGE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Form.Control>
            </Col>
            {locationError && (
              <Col xs={12}>
                <Form.Text
                  id={locationErrorId}
                  className="text-danger"
                  role="alert"
                >
                  {locationError}
                </Form.Text>
              </Col>
            )}
          </Row>
        </fieldset>
      </Col>

      <Col xs={12} md={5}>
        {ATTRIBUTE_FIELDS.map(({ field, label }) => (
          <Form.Group as={Row} className={styles.detailRow} key={field}>
            <Form.Label
              column
              xs="auto"
              className={styles.alignedLabel}
              htmlFor={`attacker-damage-${field}`}
            >
              {label}
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id={`attacker-damage-${field}`}
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS[field]}`}
                value={values[field]}
                onChange={(event) => onNumericChange(field, event.target.value)}
              />
            </Col>
          </Form.Group>
        ))}
      </Col>

      <Col xs={12}>
        <Form.Group as={Row} className={styles.thresholdRow}>
          <Form.Label
            column
            xs="auto"
            className={styles.alignedLabelWide}
            htmlFor="attacker-damage-rf-on"
          >
            RF on...
          </Form.Label>
          <Col xs="auto">
            <Form.Control
              id="attacker-damage-rf-on"
              className={styles.compactInput}
              type="number"
              min={0}
              placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.rfOn}`}
              value={values.rfOn}
              onChange={(event) => onNumericChange("rfOn", event.target.value)}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className={styles.thresholdRow}>
          <Form.Label
            column
            xs="auto"
            className={`${styles.alignedLabelWide}${
              values.alwaysConfirm ? ` ${styles.disabledLabel}` : ""
            }`}
            htmlFor="attacker-damage-rf-confirms-on"
          >
            Confirms on
          </Form.Label>
          <Col xs="auto">
            <div className={styles.inputWithSuffix}>
              <Form.Control
                id="attacker-damage-rf-confirms-on"
                className={styles.compactInput}
                type="number"
                min={0}
                disabled={values.alwaysConfirm}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.rfConfirmsOn}`}
                value={values.rfConfirmsOn}
                onChange={(event) =>
                  onNumericChange("rfConfirmsOn", event.target.value)
                }
              />
              <span>%</span>
            </div>
          </Col>
          <Col xs="auto">
            <Form.Check
              id="attacker-damage-always-confirm"
              type="checkbox"
              label="Always Confirm"
              checked={values.alwaysConfirm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onAlwaysConfirmChange(event.target.checked)
              }
            />
          </Col>
        </Form.Group>
      </Col>
    </Row>
  );
}

export default WarhammerAttackerDamageProfileFields;
