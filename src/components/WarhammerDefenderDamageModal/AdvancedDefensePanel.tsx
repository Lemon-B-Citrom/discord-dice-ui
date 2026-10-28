import React from "react";
import { ADVANCED_DEFENSE_BY_LOCATION } from "../../utils/advancedDefenses";
import { DAMAGE_LOCATION_ROWS } from "../../utils/damageLocations";
import DamageNumericField from "../DamageNumericField/DamageNumericField";
import styles from "./AdvancedDefenseModal.module.css";
import {
  DefenderDamageValidationErrors,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";

export type AdvancedDefensePanelKind = "armor" | "toughness";

interface AdvancedDefensePanelProps {
  kind: AdvancedDefensePanelKind;
  heading: string;
  description: string;
  draft: WarhammerDefenderDamageDraft;
  errors: DefenderDamageValidationErrors;
  onChange: (
    field: keyof WarhammerDefenderDamageDraft,
    value: string | boolean
  ) => void;
}

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

function AdvancedDefensePanel({
  kind,
  heading,
  description,
  draft,
  errors,
  onChange,
}: AdvancedDefensePanelProps) {
  return (
    <fieldset className={styles.panel}>
      <legend className={styles.panelHeading}>{heading}</legend>
      <p className={styles.panelNote}>{description}</p>
      <div className={styles.bodyDiagram}>
        {DAMAGE_LOCATION_ROWS.map((row) => (
          <div className={styles.bodyRow} key={row.join("-")}>
            {row.map((location) => {
              const field = ADVANCED_DEFENSE_BY_LOCATION[location];
              const key =
                kind === "armor" ? field.armorField : field.toughnessField;
              return (
                <div className={styles.cell} key={key}>
                  <DamageNumericField
                    id={`defender-advanced-${kind}-${slug(field.location)}`}
                    label={field.label}
                    ariaLabel={`${heading} ${field.label}`}
                    layout="stacked"
                    value={draft[key]}
                    error={errors[key]}
                    onChange={(value) => onChange(key, value)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default AdvancedDefensePanel;
