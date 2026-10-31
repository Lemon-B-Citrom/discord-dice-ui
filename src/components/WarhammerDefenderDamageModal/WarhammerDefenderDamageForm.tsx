import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import AdvancedDefenseControl, {
  ADVANCED_DEFENSE_BUTTON_ID,
  ADVANCED_DEFENSE_TOGGLE_ID,
} from "./AdvancedDefenseControl";
import DamageNumericField from "../DamageNumericField/DamageNumericField";
import styles from "./WarhammerDefenderDamageForm.module.css";
import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";
import normalizeWarhammerDefenderDamage from "../../utils/normalizeWarhammerDefenderDamage";
import parseWarhammerAttackerDamageSummary from "../../utils/parseWarhammerAttackerDamageSummary";
import { isVehicleDamageLocation } from "../../utils/damageLocations";
import { VEHICLE_FACINGS } from "./WarhammerDefenderDamageTypes";

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
  armorFront: "defender-damage-armor-front",
  armorSide: "defender-damage-armor-side",
  armorRear: "defender-damage-armor-rear",
  facing: "defender-damage-facing",
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

const ARMOR_FIELDS: ReadonlyArray<{
  field: "armorHead" | "armorBody" | "armorArms" | "armorLegs";
  label: string;
}> = [
  { field: "armorHead", label: "AP Head" },
  { field: "armorBody", label: "AP Body" },
  { field: "armorArms", label: "AP Arms" },
  { field: "armorLegs", label: "AP Legs" },
];

const VEHICLE_ARMOR_FIELDS: ReadonlyArray<{
  field: "armorFront" | "armorSide" | "armorRear";
  label: string;
}> = [
  { field: "armorFront", label: "AP Front" },
  { field: "armorSide", label: "AP Side" },
  { field: "armorRear", label: "AP Rear" },
];

const HORDE_FIELDS: ReadonlyArray<{
  field: "woundsPer" | "bonusHits" | "magPer";
  label: string;
}> = [
  { field: "woundsPer", label: "Wounds per" },
  { field: "bonusHits", label: "Bonus Hits" },
  { field: "magPer", label: "Mag per" },
];

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
  const facingErrorId = `${fieldControlIds.facing}-error`;
  const parsedSummary = parseWarhammerAttackerDamageSummary(
    draft.attackSummaryString
  );
  // An untouched form defaults to humanoid defenses. Once text is entered, only
  // a successfully parsed summary selects which defense panel to show.
  const showDefenses =
    !draft.attackSummaryString.trim() || Boolean(parsedSummary.summary);
  const isVehicle =
    Boolean(parsedSummary.summary) &&
    isVehicleDamageLocation(parsedSummary.summary?.firstHitLocation || "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    const normalized = normalizeWarhammerDefenderDamage(draft);
    if (!normalized.request) {
      const firstField = Object.keys(normalized.errors).find(
        (field) => field !== "form"
      ) as keyof WarhammerDefenderDamageDraft | undefined;
      if (firstField) {
        setTimeout(
          () => document.getElementById(fieldControlIds[firstField])?.focus(),
          0
        );
      }
      return;
    }
    onCalculate(draft);
  };

  return (
    <Form
      id={DEFENDER_DAMAGE_FORM_ID}
      className={styles.form}
      onSubmit={handleSubmit}
    >
      {visibleErrors.form && (
        <Form.Text className="text-danger d-block" role="alert">
          {visibleErrors.form}
        </Form.Text>
      )}
      <Form.Group className={styles.summaryField}>
        <Form.Label
          htmlFor={fieldControlIds.attackSummaryString}
          className={
            visibleErrors.attackSummaryString ? "text-danger" : undefined
          }
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
          {showDefenses && isVehicle && (
            <Form.Group>
              <Form.Label htmlFor={fieldControlIds.facing}>Facing</Form.Label>
              <Form.Control
                as="select"
                id={fieldControlIds.facing}
                value={draft.facing}
                isInvalid={Boolean(visibleErrors.facing)}
                aria-describedby={
                  visibleErrors.facing ? facingErrorId : undefined
                }
                onChange={(event) => onChange("facing", event.target.value)}
              >
                <option value="">Choose…</option>
                {VEHICLE_FACINGS.map((facing) => (
                  <option key={facing} value={facing}>
                    {facing}
                  </option>
                ))}
              </Form.Control>
              {visibleErrors.facing && (
                <Form.Control.Feedback id={facingErrorId} type="invalid">
                  {visibleErrors.facing}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          )}
          {!isVehicle && (
            <>
              <DamageNumericField
                id={fieldControlIds.toughnessBonus}
                label="Toughness Bonus"
                value={draft.toughnessBonus}
                error={visibleErrors.toughnessBonus}
                onChange={(value) => onChange("toughnessBonus", value)}
              />
              <DamageNumericField
                id={fieldControlIds.fortitude}
                label="Fortitude #"
                value={draft.fortitude}
                error={visibleErrors.fortitude}
                onChange={(value) => onChange("fortitude", value)}
              />
            </>
          )}
        </div>
        {showDefenses && (
          <div className={styles.armorFields}>
            {isVehicle ? (
              <>
                {VEHICLE_ARMOR_FIELDS.map(({ field, label }) => (
                  <DamageNumericField
                    key={field}
                    id={fieldControlIds[field]}
                    label={label}
                    value={draft[field]}
                    error={visibleErrors[field]}
                    onChange={(value) => onChange(field, value)}
                  />
                ))}
              </>
            ) : (
              <>
                <div
                  className={
                    draft.advancedEnabled
                      ? styles.armorFieldsDisabled
                      : undefined
                  }
                >
                  {ARMOR_FIELDS.map(({ field, label }) => (
                    <DamageNumericField
                      key={field}
                      id={fieldControlIds[field]}
                      label={label}
                      value={draft[field]}
                      error={visibleErrors[field]}
                      disabled={draft.advancedEnabled}
                      onChange={(value) => onChange(field, value)}
                    />
                  ))}
                </div>
                <AdvancedDefenseControl
                  draft={draft}
                  errors={visibleErrors}
                  onChange={onChange}
                  onOpen={onOpenAdvanced}
                />
              </>
            )}
          </div>
        )}
      </div>

      <hr />

      {!isVehicle && (
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
            {HORDE_FIELDS.map(({ field, label }) => (
              <DamageNumericField
                key={field}
                id={fieldControlIds[field]}
                label={label}
                value={draft[field]}
                error={visibleErrors[field]}
                disabled={!draft.hordeEnabled}
                className={
                  draft.hordeEnabled ? undefined : styles.hordeFieldDisabled
                }
                onChange={(value) => onChange(field, value)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </Form>
  );
}

export default WarhammerDefenderDamageForm;
