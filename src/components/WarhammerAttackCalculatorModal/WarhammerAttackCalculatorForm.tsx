import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import styles from "./WarhammerAttackCalculatorForm.module.css";
import normalizeWarhammerAttack, {
  WARHAMMER_ATTACK_DEFAULTS,
} from "../../utils/normalizeWarhammerAttack";
import {
  AttackCalculatorErrors,
  AttackCalculatorValues,
  WarhammerAttackInput,
} from "./WarhammerAttackCalculatorTypes";

type NonNegativeField =
  | "hits"
  | "damageDice"
  | "penetration"
  | "felling"
  | "proven"
  | "rfOn"
  | "rfConfirmsOn";

const FORM_ID = "warhammer-attack-calculator-form";

interface WarhammerAttackCalculatorFormProps {
  onRoll: (input: WarhammerAttackInput) => void;
  calculationError?: string;
  initialInput?: WarhammerAttackInput | null;
  resetCounter?: number;
}

const toFormValues = (
  input?: WarhammerAttackInput | null
): AttackCalculatorValues => ({
  hits: input ? `${input.hits}` : "",
  damageDice: input ? `${input.damageDice}` : "",
  damageModifier: input ? `${input.damageModifier}` : "",
  penetration: input ? `${input.penetration}` : "",
  felling: input ? `${input.felling}` : "",
  proven: input ? `${input.proven}` : "",
  rfOn: input ? `${input.rfOn}` : "",
  rfConfirmsOn: input ? `${input.rfConfirmsOn}` : "",
  tearing: input ? input.tearing : "none",
});

function WarhammerAttackCalculatorForm({
  onRoll,
  calculationError,
  initialInput,
  resetCounter = 0,
}: WarhammerAttackCalculatorFormProps) {
  const [values, setValues] = useState<AttackCalculatorValues>(() =>
    toFormValues(initialInput)
  );
  const [errors, setErrors] = useState<AttackCalculatorErrors>({});

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

  const updateValue = (field: keyof AttackCalculatorValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const updateNonNegativeValue = (field: NonNegativeField, value: string) => {
    if (value === "" || Number(value) >= 0) {
      updateValue(field, value);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeWarhammerAttack(values);
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
        <Form.Label column xs="auto" htmlFor="attack-calculator-hits">
          # Hits
        </Form.Label>
        <Col xs="auto">
          <Form.Control
            id="attack-calculator-hits"
            className={styles.compactInput}
            type="number"
            min={0}
            placeholder={`${WARHAMMER_ATTACK_DEFAULTS.hits}`}
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
              placeholder={`${WARHAMMER_ATTACK_DEFAULTS.damageDice}`}
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
              placeholder={`${WARHAMMER_ATTACK_DEFAULTS.damageModifier}`}
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
              name="attackCalculatorTearing"
              id="attack-calculator-no-tearing"
              checked={values.tearing === "none"}
              onChange={() => updateValue("tearing", "none")}
            />
            <Form.Check
              type="radio"
              label="Tearing"
              name="attackCalculatorTearing"
              id="attack-calculator-tearing"
              checked={values.tearing === "tearing"}
              onChange={() => updateValue("tearing", "tearing")}
            />
            <Form.Check
              type="radio"
              label="Triple Tearing"
              name="attackCalculatorTearing"
              id="attack-calculator-triple-tearing"
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
              htmlFor="attack-calculator-penetration"
            >
              Pen
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attack-calculator-penetration"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACK_DEFAULTS.penetration}`}
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
              htmlFor="attack-calculator-felling"
            >
              Felling
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attack-calculator-felling"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACK_DEFAULTS.felling}`}
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
              htmlFor="attack-calculator-proven"
            >
              Proven
            </Form.Label>
            <Col xs="auto">
              <Form.Control
                id="attack-calculator-proven"
                className={styles.compactInput}
                type="number"
                min={0}
                placeholder={`${WARHAMMER_ATTACK_DEFAULTS.proven}`}
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
          htmlFor="attack-calculator-rf-on"
        >
          RF on...
        </Form.Label>
        <Col xs="auto">
          <Form.Control
            id="attack-calculator-rf-on"
            className={styles.compactInput}
            type="number"
            min={0}
            placeholder={`${WARHAMMER_ATTACK_DEFAULTS.rfOn}`}
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
          htmlFor="attack-calculator-rf-confirms-on"
        >
          Confirms on
        </Form.Label>
        <Col xs="auto">
          <div className={styles.inputWithSuffix}>
            <Form.Control
              id="attack-calculator-rf-confirms-on"
              className={styles.compactInput}
              type="number"
              min={0}
              placeholder={`${WARHAMMER_ATTACK_DEFAULTS.rfConfirmsOn}`}
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

export default WarhammerAttackCalculatorForm;
export { FORM_ID };
