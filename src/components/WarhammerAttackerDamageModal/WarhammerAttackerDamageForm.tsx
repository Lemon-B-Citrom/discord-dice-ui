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

type NonNegativeField =
  | "hits"
  | "damageDice"
  | "penetration"
  | "felling"
  | "devastating"
  | "proven"
  | "rfOn"
  | "rfConfirmsOn";

const FORM_ID = "warhammer-attacker-damage-form";

interface WarhammerAttackerDamageFormProps {
  onRoll: (input: WarhammerAttackerDamageInput) => void;
  calculationError?: string;
  initialInput?: WarhammerAttackerDamageInput | null;
  resetCounter?: number;
}

const toFormValues = (
  input?: WarhammerAttackerDamageInput | null
): AttackerDamageValues => ({
  hits: input ? `${input.hits}` : "",
  damageDice: input ? `${input.damageDice}` : "",
  damageModifier: input ? `${input.damageModifier}` : "",
  penetration: input ? `${input.penetration}` : "",
  felling: input ? `${input.felling}` : "",
  devastating: input ? `${input.devastating}` : "",
  proven: input ? `${input.proven}` : "",
  rfOn: input ? `${input.rfOn}` : "",
  rfConfirmsOn: input ? `${input.rfConfirmsOn}` : "",
  tearing: input ? input.tearing : "none",
});

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

  const updateValue = (field: keyof AttackerDamageValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const updateNonNegativeValue = (field: NonNegativeField, value: string) => {
    if (value === "" || Number(value) >= 0) {
      updateValue(field, value);
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

  return (
    <Form id={FORM_ID} onSubmit={handleSubmit}>
      {calculationError && (
        <Form.Text className="text-danger" role="alert">
          {calculationError}
        </Form.Text>
      )}
      {Object.keys(errors).length > 0 && (
        <Form.Text className="text-danger d-block" role="alert">
          {Object.values(errors).join(". ")}
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
            onChange={(event) =>
              updateNonNegativeValue("hits", event.target.value)
            }
          />
        </Col>
      </Form.Group>

      <hr />

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
                updateNonNegativeValue("damageDice", event.target.value)
              }
            />
            <span>d10 +</span>
            <Form.Control
              aria-label="Damage modifier"
              className={styles.compactInput}
              type="number"
              placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.damageModifier}`}
              value={values.damageModifier}
              onChange={(event) =>
                updateValue("damageModifier", event.target.value)
              }
            />
          </div>

          <fieldset className={styles.tearingOptions}>
            <legend className="sr-only">Tearing</legend>
            <Form.Check
              type="radio"
              label="No Tearing"
              name="attackerDamageTearing"
              id="attacker-damage-no-tearing"
              checked={values.tearing === "none"}
              onChange={() => updateValue("tearing", "none")}
            />
            <Form.Check
              type="radio"
              label="Tearing"
              name="attackerDamageTearing"
              id="attacker-damage-tearing"
              checked={values.tearing === "tearing"}
              onChange={() => updateValue("tearing", "tearing")}
            />
            <Form.Check
              type="radio"
              label="Triple Tearing"
              name="attackerDamageTearing"
              id="attacker-damage-triple-tearing"
              checked={values.tearing === "tripleTearing"}
              onChange={() => updateValue("tearing", "tripleTearing")}
            />
          </fieldset>
        </Col>

        <Col xs={12} md={5}>
          <Form.Group as={Row} className={styles.detailRow}>
            <Form.Label
              column
              xs="auto"
              className={styles.alignedLabel}
              htmlFor="attacker-damage-penetration"
            >
              Pen
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attacker-damage-penetration"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.penetration}`}
                value={values.penetration}
                onChange={(event) =>
                  updateNonNegativeValue("penetration", event.target.value)
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className={styles.detailRow}>
            <Form.Label
              column
              xs="auto"
              className={styles.alignedLabel}
              htmlFor="attacker-damage-felling"
            >
              Felling
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attacker-damage-felling"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.felling}`}
                value={values.felling}
                onChange={(event) =>
                  updateNonNegativeValue("felling", event.target.value)
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className={styles.detailRow}>
            <Form.Label
              column
              xs="auto"
              className={styles.alignedLabel}
              htmlFor="attacker-damage-devastating"
            >
              Devastating
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attacker-damage-devastating"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.devastating}`}
                value={values.devastating}
                onChange={(event) =>
                  updateNonNegativeValue("devastating", event.target.value)
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className={styles.detailRow}>
            <Form.Label
              column
              xs="auto"
              className={styles.alignedLabel}
              htmlFor="attacker-damage-proven"
            >
              Proven
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attacker-damage-proven"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.proven}`}
                value={values.proven}
                onChange={(event) =>
                  updateNonNegativeValue("proven", event.target.value)
                }
              />
            </Col>
          </Form.Group>
        </Col>
      </Row>

      <hr />

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
            onChange={(event) =>
              updateNonNegativeValue("rfOn", event.target.value)
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className={styles.thresholdRow}>
        <Form.Label
          column
          xs="auto"
          className={styles.alignedLabelWide}
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
              placeholder={`${WARHAMMER_ATTACKER_DAMAGE_DEFAULTS.rfConfirmsOn}`}
              value={values.rfConfirmsOn}
              onChange={(event) =>
                updateNonNegativeValue("rfConfirmsOn", event.target.value)
              }
            />
            <span>%</span>
          </div>
        </Col>
      </Form.Group>
    </Form>
  );
}

export default WarhammerAttackerDamageForm;
export { FORM_ID };
