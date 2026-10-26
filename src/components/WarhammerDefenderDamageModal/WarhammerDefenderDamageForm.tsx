import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import FirstHitLocationSelect from "./FirstHitLocationSelect";
import DefenderDamageNumericField from "./DefenderDamageNumericField";
import styles from "./WarhammerDefenderDamageForm.module.css";
import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";
import normalizeWarhammerDefenderDamage from "../../utils/normalizeWarhammerDefenderDamage";

export const DEFENDER_DAMAGE_FORM_ID = "warhammer-defender-damage-form";

interface WarhammerDefenderDamageFormProps {
  draft: WarhammerDefenderDamageDraft;
  errors: DefenderDamageValidationErrors;
  onChange: (field: keyof WarhammerDefenderDamageDraft, value: string) => void;
  onCalculate: (draft: WarhammerDefenderDamageDraft) => void;
  clearCounter?: number;
}

const fieldControlIds: Record<keyof WarhammerDefenderDamageDraft, string> = {
  attackSummaryString: "defender-damage-attack-summary",
  toughnessBonus: "defender-damage-toughness-bonus",
  fortitude: "defender-damage-fortitude",
  armorHead: "defender-damage-armor-head",
  armorBody: "defender-damage-armor-body",
  armorArms: "defender-damage-armor-arms",
  armorLegs: "defender-damage-armor-legs",
  firstHitLocation: "defender-damage-first-hit-location",
  trueHits: "defender-damage-true-hits",
  magPer: "defender-damage-mag-per",
  devastating: "defender-damage-devastating",
  woundsPer: "defender-damage-wounds-per",
};

function WarhammerDefenderDamageForm({
  draft,
  errors,
  onChange,
  onCalculate,
  clearCounter = 0,
}: WarhammerDefenderDamageFormProps) {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  useEffect(() => {
    setHasAttemptedSubmit(false);
  }, [clearCounter]);
  const liveErrors = hasAttemptedSubmit
    ? normalizeWarhammerDefenderDamage(draft).errors
    : {};
  const visibleErrors = { ...liveErrors, ...errors };
  const summaryErrorId = `${fieldControlIds.attackSummaryString}-error`;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    const normalized = normalizeWarhammerDefenderDamage(draft);
    if (!normalized.request) {
      const firstField = Object.keys(normalized.errors).find(
        (field) => field !== "form"
      ) as keyof WarhammerDefenderDamageDraft | undefined;
      if (firstField) {
        setTimeout(() => document.getElementById(fieldControlIds[firstField])?.focus(), 0);
      }
      return;
    }
    onCalculate(draft);
  };

  return (
    <Form
      id={DEFENDER_DAMAGE_FORM_ID}
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
          <DefenderDamageNumericField
            id="defender-damage-toughness-bonus"
            label="Toughness Bonus"
            value={draft.toughnessBonus}
            error={visibleErrors.toughnessBonus}
            onChange={(value) => onChange("toughnessBonus", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-fortitude"
            label="Fortitude #"
            value={draft.fortitude}
            error={visibleErrors.fortitude}
            onChange={(value) => onChange("fortitude", value)}
          />
          <Form.Group className={styles.locationField}>
            <Form.Label
              htmlFor="defender-damage-first-hit-location"
              className={visibleErrors.firstHitLocation ? "text-danger" : undefined}
            >
              First Hit Location
            </Form.Label>
            <FirstHitLocationSelect
              value={draft.firstHitLocation}
              onChange={(value) => onChange("firstHitLocation", value)}
              ariaDescribedBy={
                visibleErrors.firstHitLocation
                  ? "defender-damage-first-hit-location-error"
                  : undefined
              }
            />
            {visibleErrors.firstHitLocation && (
              <Form.Text
                id="defender-damage-first-hit-location-error"
                className="text-danger"
                role="alert"
              >
                {visibleErrors.firstHitLocation}
              </Form.Text>
            )}
          </Form.Group>
        </div>
        <div className={styles.armorFields}>
          <DefenderDamageNumericField
            id="defender-damage-armor-head"
            label="AP Head"
            value={draft.armorHead}
            error={visibleErrors.armorHead}
            onChange={(value) => onChange("armorHead", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-armor-body"
            label="AP Body"
            value={draft.armorBody}
            error={visibleErrors.armorBody}
            onChange={(value) => onChange("armorBody", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-armor-arms"
            label="AP Arms"
            value={draft.armorArms}
            error={visibleErrors.armorArms}
            onChange={(value) => onChange("armorArms", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-armor-legs"
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
          <DefenderDamageNumericField
            id="defender-damage-true-hits"
            label="True Hits"
            value={draft.trueHits}
            error={visibleErrors.trueHits}
            onChange={(value) => onChange("trueHits", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-devastating"
            label="Devastating"
            value={draft.devastating}
            error={visibleErrors.devastating}
            onChange={(value) => onChange("devastating", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-mag-per"
            label="Mag per"
            value={draft.magPer}
            error={visibleErrors.magPer}
            onChange={(value) => onChange("magPer", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-wounds-per"
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

export default WarhammerDefenderDamageForm;
