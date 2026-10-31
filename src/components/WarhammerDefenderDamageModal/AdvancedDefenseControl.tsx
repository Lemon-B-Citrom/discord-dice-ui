import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { ADVANCED_DEFENSE_FIELD_KEYS } from "../../utils/advancedDefenses";
import styles from "./WarhammerDefenderDamageForm.module.css";
import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";

export const ADVANCED_DEFENSE_TOGGLE_ID = "defender-damage-advanced-toggle";
export const ADVANCED_DEFENSE_BUTTON_ID = "defender-damage-advanced";

/** True when any advanced override needs attention, so the row can say so. */
export function hasAdvancedDefenseError(
  errors: DefenderDamageValidationErrors
): boolean {
  return ADVANCED_DEFENSE_FIELD_KEYS.some((field) => Boolean(errors[field]));
}

interface AdvancedDefenseControlProps {
  draft: WarhammerDefenderDamageDraft;
  errors: DefenderDamageValidationErrors;
  onChange: (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => void;
  onOpen: () => void;
}

function AdvancedDefenseControl({
  draft,
  errors,
  onChange,
  onOpen,
}: AdvancedDefenseControlProps) {
  const hasError = hasAdvancedDefenseError(errors);
  // The overrides are inert until the box is ticked, so the editor stays shut.
  const canEdit = draft.advancedEnabled;
  return (
    <>
      <div className={styles.advancedRow}>
        <Form.Check
          id={ADVANCED_DEFENSE_TOGGLE_ID}
          type="checkbox"
          className={styles.advancedCheck}
          aria-label="Advanced"
          checked={draft.advancedEnabled}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onChange("advancedEnabled", event.target.checked)
          }
        />
        <Button
          id={ADVANCED_DEFENSE_BUTTON_ID}
          type="button"
          variant={hasError && canEdit ? "outline-danger" : "outline-secondary"}
          className={styles.advancedButton}
          disabled={!canEdit}
          onClick={onOpen}
        >
          Advanced
        </Button>
      </div>
      {hasError && (
        <Form.Text
          className={`text-danger ${styles.advancedError}`}
          role="alert"
        >
          Check the Advanced armor and Toughness values
        </Form.Text>
      )}
    </>
  );
}

export default AdvancedDefenseControl;
