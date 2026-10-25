import React, { useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import styles from "./WarhammerAttackCalculatorForm.module.css";

type TearingOption = "none" | "tearing" | "tripleTearing";

interface AttackCalculatorValues {
  hits: string;
  damageDice: string;
  damageModifier: string;
  penetration: string;
  felling: string;
  proven: string;
  rfOn: string;
  rfConfirmsOn: string;
  tearing: TearingOption;
}

function WarhammerAttackCalculatorForm() {
  const [values, setValues] = useState<AttackCalculatorValues>({
    hits: "",
    damageDice: "",
    damageModifier: "",
    penetration: "",
    felling: "",
    proven: "",
    rfOn: "",
    rfConfirmsOn: "",
    tearing: "none",
  });

  const updateValue = (field: keyof AttackCalculatorValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  return (
    <Form onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
      <Form.Group as={Row} className={styles.hitsRow}>
        <Form.Label column xs="auto" htmlFor="attack-calculator-hits">
          # Hits
        </Form.Label>
        <Col xs="auto">
          <Form.Control
            id="attack-calculator-hits"
            className={styles.compactInput}
            type="number"
            placeholder="1"
            value={values.hits}
            onChange={(event) => updateValue("hits", event.target.value)}
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
              placeholder="1"
              value={values.damageDice}
              onChange={(event) => updateValue("damageDice", event.target.value)}
            />
            <span>d10 +</span>
            <Form.Control
              aria-label="Damage modifier"
              className={styles.compactInput}
              type="number"
              placeholder="0"
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
                placeholder="0"
                value={values.penetration}
                onChange={(event) =>
                  updateValue("penetration", event.target.value)
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
                placeholder="0"
                value={values.felling}
                onChange={(event) => updateValue("felling", event.target.value)}
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
                placeholder="0"
                value={values.proven}
                onChange={(event) => updateValue("proven", event.target.value)}
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
            placeholder="10"
            value={values.rfOn}
            onChange={(event) => updateValue("rfOn", event.target.value)}
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
              placeholder="0"
              value={values.rfConfirmsOn}
              onChange={(event) => updateValue("rfConfirmsOn", event.target.value)}
            />
            <span>%</span>
          </div>
        </Col>
      </Form.Group>
    </Form>
  );
}

export default WarhammerAttackCalculatorForm;
