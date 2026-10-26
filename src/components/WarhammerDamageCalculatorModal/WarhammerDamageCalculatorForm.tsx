import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import FirstHitLocationSelect from "./FirstHitLocationSelect";
import DamageCalculatorNumericField from "./DamageCalculatorNumericField";
import styles from "./WarhammerDamageCalculatorForm.module.css";
import {
  DamageValidationErrors,
  WarhammerDamageDraft,
} from "./WarhammerDamageCalculatorTypes";
import normalizeWarhammerDamage from "../../utils/normalizeWarhammerDamage";

export const DAMAGE_CALCULATOR_FORM_ID = "warhammer-damage-calculator-form";

interface WarhammerDamageCalculatorFormProps {
  draft: WarhammerDamageDraft;
  errors: DamageValidationErrors;
  onChange: (field: keyof WarhammerDamageDraft, value: string) => void;
  onCalculate: (draft: WarhammerDamageDraft) => void;
  clearCounter?: number;
}

const fieldControlIds: Record<keyof WarhammerDamageDraft, string> = {
  attackSummaryString: "damage-calculator-attack-summary",
  toughnessBonus: "damage-calculator-toughness-bonus",
  fortitude: "damage-calculator-fortitude",
  armorHead: "damage-calculator-armor-head",
  armorBody: "damage-calculator-armor-body",
  armorArms: "damage-calculator-armor-arms",
  armorLegs: "damage-calculator-armor-legs",
  firstHitLocation: "damage-calculator-first-hit-location",
  trueHits: "damage-calculator-true-hits",
  magPer: "damage-calculator-mag-per",
  devastating: "damage-calculator-devastating",
  woundsPer: "damage-calculator-wounds-per",
};

function WarhammerDamageCalculatorForm({
  draft,
  errors,
  onChange,
  onCalculate,
  clearCounter = 0,
}: WarhammerDamageCalculatorFormProps) {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  useEffect(() => {
    setHasAttemptedSubmit(false);
  }, [clearCounter]);
  const liveErrors = hasAttemptedSubmit
    ? normalizeWarhammerDamage(draft).errors
    : {};
  const visibleErrors = { ...liveErrors, ...errors };
  const summaryErrorId = `${fieldControlIds.attackSummaryString}-error`;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    const normalized = normalizeWarhammerDamage(draft);
    if (!normalized.request) {
      const firstField = Object.keys(normalized.errors).find(
        (field) => field !== "form"
      ) as keyof WarhammerDamageDraft | undefined;
      if (firstField) {
        setTimeout(() => document.getElementById(fieldControlIds[firstField])?.focus(), 0);
      }
      return;
    }
    onCalculate(draft);
  };

  return (
    <Form
      id={DAMAGE_CALCULATOR_FORM_ID}
      className={styles.form}
      onSubmit={submit}
    >
      {visibleErrors.form && (
        <Form.Text className="text-danger d-block" role="alert">
          {visibleErrors.form}
        </Form.Text>
      )}
      <Form.Group className={styles.summaryField}>
        <Form.Label
          htmlFor={fieldControlIds.attackSummaryString}
          className={visibleErrors.attackSummaryString ? "text-danger" : undefined}
        >
          Input
        </Form.Label>
        <Form.Control
          id={fieldControlIds.attackSummaryString}
          type="text"
          placeholder="Attack summary string"
          value={draft.attackSummaryString}
          isInvalid={Boolean(visibleErrors.attackSummaryString)}
          aria-invalid={Boolean(visibleErrors.attackSummaryString)}
          aria-describedby={
            visibleErrors.attackSummaryString ? summaryErrorId : undefined
          }
          onChange={(event) =>
            onChange("attackSummaryString", event.target.value)
          }
        />
        {visibleErrors.attackSummaryString && (
          <Form.Control.Feedback id={summaryErrorId} type="invalid">
            {visibleErrors.attackSummaryString}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <div className={styles.defenseGrid}>
        <div className={styles.defensePrimary}>
          <DamageCalculatorNumericField
            id="damage-calculator-toughness-bonus"
            label="Toughness Bonus"
            value={draft.toughnessBonus}
            error={visibleErrors.toughnessBonus}
            onChange={(value) => onChange("toughnessBonus", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-fortitude"
            label="Fortitude #"
            value={draft.fortitude}
            error={visibleErrors.fortitude}
            onChange={(value) => onChange("fortitude", value)}
          />
          <Form.Group className={styles.locationField}>
            <Form.Label
              htmlFor="damage-calculator-first-hit-location"
              className={visibleErrors.firstHitLocation ? "text-danger" : undefined}
            >
              First Hit Location
            </Form.Label>
            <FirstHitLocationSelect
              value={draft.firstHitLocation}
              onChange={(value) => onChange("firstHitLocation", value)}
              ariaDescribedBy={
                visibleErrors.firstHitLocation
                  ? "damage-calculator-first-hit-location-error"
                  : undefined
              }
            />
            {visibleErrors.firstHitLocation && (
              <Form.Text
                id="damage-calculator-first-hit-location-error"
                className="text-danger"
                role="alert"
              >
                {visibleErrors.firstHitLocation}
              </Form.Text>
            )}
          </Form.Group>
        </div>
        <div className={styles.armorFields}>
          <DamageCalculatorNumericField
            id="damage-calculator-armor-head"
            label="AP Head"
            value={draft.armorHead}
            error={visibleErrors.armorHead}
            onChange={(value) => onChange("armorHead", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-armor-body"
            label="AP Body"
            value={draft.armorBody}
            error={visibleErrors.armorBody}
            onChange={(value) => onChange("armorBody", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-armor-arms"
            label="AP Arms"
            value={draft.armorArms}
            error={visibleErrors.armorArms}
            onChange={(value) => onChange("armorArms", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-armor-legs"
            label="AP Legs"
            value={draft.armorLegs}
            error={visibleErrors.armorLegs}
            onChange={(value) => onChange("armorLegs", value)}
          />
        </div>
      </div>

      <hr />

      <fieldset className={styles.hordeOptions}>
        <legend>Horde Options</legend>
        <div className={styles.hordeGrid}>
          <DamageCalculatorNumericField
            id="damage-calculator-true-hits"
            label="True Hits"
            value={draft.trueHits}
            error={visibleErrors.trueHits}
            onChange={(value) => onChange("trueHits", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-devastating"
            label="Devastating"
            value={draft.devastating}
            error={visibleErrors.devastating}
            onChange={(value) => onChange("devastating", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-mag-per"
            label="Mag per"
            value={draft.magPer}
            error={visibleErrors.magPer}
            onChange={(value) => onChange("magPer", value)}
          />
          <DamageCalculatorNumericField
            id="damage-calculator-wounds-per"
            label="Wounds per"
            value={draft.woundsPer}
            error={visibleErrors.woundsPer}
            onChange={(value) => onChange("woundsPer", value)}
          />
        </div>
      </fieldset>
    </Form>
  );
}

export default WarhammerDamageCalculatorForm;
