import React from "react";
import Form from "react-bootstrap/Form";
import styles from "./DamageNumericField.module.css";

export interface DamageNumericFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Grays the field and stops edits while another source supplies the value. */
  disabled?: boolean;
  /** "row" keeps the label beside the input; "stacked" puts it above. */
  layout?: "row" | "stacked";
  /** Distinguishes the accessible name between the Armor and +Toughness panels. */
  ariaLabel?: string;
  /** Extra class for the wrapping group, used to dim a whole row. */
  className?: string;
}

/** One whole-number field of a damage form, with its own error message. */
function DamageNumericField({
  id,
  label,
  value,
  onChange,
  error,
  disabled = false,
  layout = "row",
  ariaLabel,
  className,
}: DamageNumericFieldProps) {
  const errorId = `${id}-error`;
  const stacked = layout === "stacked";
  const groupClassName = [stacked ? styles.stacked : styles.row, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Form.Group className={groupClassName}>
      <Form.Label htmlFor={id} className={error ? "text-danger" : undefined}>
        {label}
      </Form.Label>
      <Form.Control
        id={id}
        className={stacked ? styles.stackedInput : styles.rowInput}
        type="number"
        min={0}
        step={1}
        placeholder="0"
        value={value}
        disabled={disabled}
        isInvalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-label={ariaLabel}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === "" || Number(nextValue) >= 0) onChange(nextValue);
        }}
      />
      {error && (
        <Form.Control.Feedback id={errorId} type="invalid">
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
}

export default DamageNumericField;
