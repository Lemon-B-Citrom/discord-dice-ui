import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import AdvancedDefenseControl, {
  ADVANCED_DEFENSE_BUTTON_ID,
  ADVANCED_DEFENSE_TOGGLE_ID,
} from "./AdvancedDefenseControl";
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
  onChange: (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => void;
  onCalculate: (draft: WarhammerDefenderDamageDraft) => void;
  onOpenAdvanced?: () => void;
  clearCounter?: number;
}

// Advanced fields live in the editor, so an error there focuses the button that
// opens it rather than an input that is not on screen.
const fieldControlIds: Record<keyof WarhammerDefenderDamageDraft, string> = {
  attackSummaryString: "defender-damage-attack-summary",
  toughnessBonus: "defender-damage-toughness-bonus",
  fortitude: "defender-damage-fortitude",
  armorHead: "defender-damage-armor-head",
  armorBody: "defender-damage-armor-body",
  armorArms: "defender-damage-armor-arms",
  armorLegs: "defender-damage-armor-legs",
  firstHitLocation: "defender-damage-first-hit-location",
  bonusHits: "defender-damage-bonus-hits",
  magPer: "defender-damage-mag-per",
  woundsPer: "defender-damage-wounds-per",
  hordeEnabled: "defender-damage-horde-enabled",
  advancedEnabled: ADVANCED_DEFENSE_TOGGLE_ID,
  advancedArmorHead: ADVANCED_DEFENSE_BUTTON_ID,
  advancedArmorBody: ADVANCED_DEFENSE_BUTTON_ID,
  advancedArmorLeftArm: ADVANCED_DEFENSE_BUTTON_ID,
  advancedArmorRightArm: ADVANCED_DEFENSE_BUTTON_ID,
  advancedArmorLeftLeg: ADVANCED_DEFENSE_BUTTON_ID,
  advancedArmorRightLeg: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessHead: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessBody: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessLeftArm: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessRightArm: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessLeftLeg: ADVANCED_DEFENSE_BUTTON_ID,
  advancedToughnessRightLeg: ADVANCED_DEFENSE_BUTTON_ID,
};

function WarhammerDefenderDamageForm({
  draft,
  errors,
  onChange,
  onCalculate,
  onOpenAdvanced = () => undefined,
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
          <div
            className={
              draft.advancedEnabled ? styles.armorFieldsDisabled : undefined
            }
          >
            <DefenderDamageNumericField
              id="defender-damage-armor-head"
              label="AP Head"
              value={draft.armorHead}
              error={visibleErrors.armorHead}
              disabled={draft.advancedEnabled}
              onChange={(value) => onChange("armorHead", value)}
            />
            <DefenderDamageNumericField
              id="defender-damage-armor-body"
              label="AP Body"
              value={draft.armorBody}
              error={visibleErrors.armorBody}
              disabled={draft.advancedEnabled}
              onChange={(value) => onChange("armorBody", value)}
            />
            <DefenderDamageNumericField
              id="defender-damage-armor-arms"
              label="AP Arms"
              value={draft.armorArms}
              error={visibleErrors.armorArms}
              disabled={draft.advancedEnabled}
              onChange={(value) => onChange("armorArms", value)}
            />
            <DefenderDamageNumericField
              id="defender-damage-armor-legs"
              label="AP Legs"
              value={draft.armorLegs}
              error={visibleErrors.armorLegs}
              disabled={draft.advancedEnabled}
              onChange={(value) => onChange("armorLegs", value)}
            />
          </div>
          <AdvancedDefenseControl
            draft={draft}
            errors={visibleErrors}
            onChange={onChange}
            onOpen={onOpenAdvanced}
          />
        </div>
      </div>

      <hr />

      <fieldset className={styles.hordeOptions}>
        <legend>Horde Options</legend>
        <div className={styles.hordeGrid}>
          <Form.Group className={styles.hordeEnable}>
            <Form.Check
              id={fieldControlIds.hordeEnabled}
              type="checkbox"
              className={styles.hordeCheck}
              label="Enable"
              checked={draft.hordeEnabled}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onChange("hordeEnabled", event.target.checked)
              }
            />
          </Form.Group>
          <DefenderDamageNumericField
            id="defender-damage-wounds-per"
            label="Wounds per"
            value={draft.woundsPer}
            error={visibleErrors.woundsPer}
            disabled={!draft.hordeEnabled}
            className={draft.hordeEnabled ? undefined : styles.hordeFieldDisabled}
            onChange={(value) => onChange("woundsPer", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-bonus-hits"
            label="Bonus Hits"
            value={draft.bonusHits}
            error={visibleErrors.bonusHits}
            disabled={!draft.hordeEnabled}
            className={draft.hordeEnabled ? undefined : styles.hordeFieldDisabled}
            onChange={(value) => onChange("bonusHits", value)}
          />
          <DefenderDamageNumericField
            id="defender-damage-mag-per"
            label="Mag per"
            value={draft.magPer}
            error={visibleErrors.magPer}
            disabled={!draft.hordeEnabled}
            className={draft.hordeEnabled ? undefined : styles.hordeFieldDisabled}
            onChange={(value) => onChange("magPer", value)}
          />
        </div>
      </fieldset>
    </Form>
  );
}

export default WarhammerDefenderDamageForm;
