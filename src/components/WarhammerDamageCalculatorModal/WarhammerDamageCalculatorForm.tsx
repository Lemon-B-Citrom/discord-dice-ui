import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import FirstHitLocationSelect from "./FirstHitLocationSelect";
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

interface NumericFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function NumericField({ id, label, value, onChange, error }: NumericFieldProps) {
  const errorId = `${id}-error`;
  return (
    <Form.Group className={styles.numericField}>
      <Form.Label htmlFor={id} className={error ? "text-danger" : undefined}>
        {label}
      </Form.Label>
      <Form.Control
        id={id}
        className={styles.numericInput}
        type="number"
        min={0}
        step={1}
        placeholder="0"
        value={value}
        isInvalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === "" || Number(nextValue) >= 0) onChange(nextValue);
        }}
      />
      {error && <Form.Control.Feedback id={errorId} type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
}

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
  const updateValue = (field: keyof WarhammerDamageDraft, value: string) => {
    onChange(field, value);
  };

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
          htmlFor="damage-calculator-attack-summary"
          className={visibleErrors.attackSummaryString ? "text-danger" : undefined}
        >
          Input
        </Form.Label>
        <Form.Control
          id="damage-calculator-attack-summary"
          type="text"
          placeholder="Attack summary string"
          value={draft.attackSummaryString}
          isInvalid={Boolean(visibleErrors.attackSummaryString)}
          aria-invalid={Boolean(visibleErrors.attackSummaryString)}
          aria-describedby={
            visibleErrors.attackSummaryString
              ? "damage-calculator-attack-summary-error"
              : undefined
          }
          onChange={(event) =>
            updateValue("attackSummaryString", event.target.value)
          }
        />
        {visibleErrors.attackSummaryString && (
          <Form.Control.Feedback
            id="damage-calculator-attack-summary-error"
            type="invalid"
          >
            {visibleErrors.attackSummaryString}
          </Form.Control.Feedback>
        )}
      </Form.Group>

      <div className={styles.defenseGrid}>
        <div className={styles.defensePrimary}>
          <NumericField
            id="damage-calculator-toughness-bonus"
            label="Toughness Bonus"
            value={draft.toughnessBonus}
            error={visibleErrors.toughnessBonus}
            onChange={(value) => updateValue("toughnessBonus", value)}
          />
          <NumericField
            id="damage-calculator-fortitude"
            label="Fortitude #"
            value={draft.fortitude}
            error={visibleErrors.fortitude}
            onChange={(value) => updateValue("fortitude", value)}
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
              onChange={(value) => updateValue("firstHitLocation", value)}
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
          <NumericField
            id="damage-calculator-armor-head"
            label="AP Head"
            value={draft.armorHead}
            error={visibleErrors.armorHead}
            onChange={(value) => updateValue("armorHead", value)}
          />
          <NumericField
            id="damage-calculator-armor-body"
            label="AP Body"
            value={draft.armorBody}
            error={visibleErrors.armorBody}
            onChange={(value) => updateValue("armorBody", value)}
          />
          <NumericField
            id="damage-calculator-armor-arms"
            label="AP Arms"
            value={draft.armorArms}
            error={visibleErrors.armorArms}
            onChange={(value) => updateValue("armorArms", value)}
          />
          <NumericField
            id="damage-calculator-armor-legs"
            label="AP Legs"
            value={draft.armorLegs}
            error={visibleErrors.armorLegs}
            onChange={(value) => updateValue("armorLegs", value)}
          />
        </div>
      </div>

      <hr />

      <fieldset className={styles.hordeOptions}>
        <legend>Horde Options</legend>
        <div className={styles.hordeGrid}>
          <NumericField
            id="damage-calculator-true-hits"
            label="True Hits"
            value={draft.trueHits}
            error={visibleErrors.trueHits}
            onChange={(value) => updateValue("trueHits", value)}
          />
          <NumericField
            id="damage-calculator-devastating"
            label="Devastating"
            value={draft.devastating}
            error={visibleErrors.devastating}
            onChange={(value) => updateValue("devastating", value)}
          />
          <NumericField
            id="damage-calculator-mag-per"
            label="Mag per"
            value={draft.magPer}
            error={visibleErrors.magPer}
            onChange={(value) => updateValue("magPer", value)}
          />
          <NumericField
            id="damage-calculator-wounds-per"
            label="Wounds per"
            value={draft.woundsPer}
            error={visibleErrors.woundsPer}
            onChange={(value) => updateValue("woundsPer", value)}
          />
        </div>
      </fieldset>
    </Form>
  );
}

export default WarhammerDamageCalculatorForm;
