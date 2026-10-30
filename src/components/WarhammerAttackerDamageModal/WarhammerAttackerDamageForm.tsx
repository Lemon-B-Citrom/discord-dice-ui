import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import styles from "./WarhammerAttackerDamageForm.module.css";
import normalizeWarhammerAttackerDamage, {
  WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
} from "../../utils/normalizeWarhammerAttackerDamage";
import {
  AttackerDamageErrors,
  AttackerDamageValues,
  WarhammerAttackerDamageInput,
} from "./WarhammerAttackerDamageTypes";
import WarhammerAttackerDamageProfileFields, {
  AttackerDamageNumericField,
} from "./WarhammerAttackerDamageProfileFields";

const FORM_ID = "warhammer-attacker-damage-form";

interface WarhammerAttackerDamageFormProps {
  onRoll: (input: WarhammerAttackerDamageInput) => void;
  calculationError?: string;
  initialInput?: WarhammerAttackerDamageInput | null;
  resetCounter?: number;
}

const EMPTY_VALUES: AttackerDamageValues = {
  hits: "",
  damageDice: "",
  damageModifier: "",
  penetration: "",
  felling: "",
  devastating: "",
  proven: "",
  rfOn: "",
  rfConfirmsOn: "",
  alwaysConfirm: false,
  tearing: "none",
  firstHitLocation: "",
};

const toFormValues = (
  input?: WarhammerAttackerDamageInput | null
): AttackerDamageValues =>
  input
    ? {
        hits: `${input.hits}`,
        damageDice: `${input.damageDice}`,
        damageModifier: `${input.damageModifier}`,
        penetration: `${input.penetration}`,
        felling: `${input.felling}`,
        devastating: `${input.devastating}`,
        proven: `${input.proven}`,
        rfOn: `${input.rfOn}`,
        rfConfirmsOn: `${input.rfConfirmsOn}`,
        alwaysConfirm: input.alwaysConfirm,
        tearing: input.tearing,
        firstHitLocation: input.firstHitLocation || "",
      }
    : EMPTY_VALUES;

function WarhammerAttackerDamageForm({
  onRoll,
  calculationError,
  initialInput,
  resetCounter = 0,
}: WarhammerAttackerDamageFormProps) {
  const [values, setValues] = useState<AttackerDamageValues>(() =>
    toFormValues(initialInput)
  );
  const [errors, setErrors] = useState<AttackerDamageErrors>({});

  useEffect(() => {
    if (initialInput) {
      setValues(toFormValues(initialInput));
    }
  }, [initialInput]);

  useEffect(() => {
    if (resetCounter > 0) {
      setValues(toFormValues());
      setErrors({});
    }
  }, [resetCounter]);

  function updateField<K extends keyof AttackerDamageValues>(
    field: K,
    value: AttackerDamageValues[K]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  const updateNonNegativeValue = (
    field: AttackerDamageNumericField,
    value: string
  ) => {
    if (value === "" || Number(value) >= 0) {
      updateField(field, value);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeWarhammerAttackerDamage(values);
    setErrors(normalized.errors);
    if (normalized.input) {
      onRoll(normalized.input);
    }
  };

  const alertMessage = calculationError || Object.values(errors)[0];

  return (
    <Form id={FORM_ID} onSubmit={handleSubmit}>
      {alertMessage && (
        <Form.Text className="text-danger d-block" role="alert">
          {alertMessage}
        </Form.Text>
      )}
      <Form.Group as={Row} className={styles.hitsRow}>
        <Form.Label column xs="auto" htmlFor="attacker-damage-hits">
          # Hits
        </Form.Label>
        <Col xs="auto">
          <Form.Control
            id="attacker-damage-hits"
            className={styles.compactInput}
            type="number"
            min={0}
            placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.hits}`}
            value={values.hits}
            isInvalid={Boolean(errors.hits)}
            onChange={(event) =>
              updateNonNegativeValue("hits", event.target.value)
            }
          />
        </Col>
      </Form.Group>

      <hr />

      <WarhammerAttackerDamageProfileFields
        values={values}
        onNumericChange={updateNonNegativeValue}
        onModifierChange={(value) => updateField("damageModifier", value)}
        onTearingChange={(tearing) => updateField("tearing", tearing)}
        onLocationChange={(location) =>
          updateField("firstHitLocation", location)
        }
        locationError={errors.firstHitLocation}
        onAlwaysConfirmChange={(alwaysConfirm) =>
          updateField("alwaysConfirm", alwaysConfirm)
        }
      />
    </Form>
  );
}

export default WarhammerAttackerDamageForm;
export { FORM_ID };
