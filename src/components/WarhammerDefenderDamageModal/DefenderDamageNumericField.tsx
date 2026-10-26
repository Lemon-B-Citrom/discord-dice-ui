import React from "react";
import Form from "react-bootstrap/Form";
import styles from "./WarhammerDefenderDamageForm.module.css";

export interface DefenderDamageNumericFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function DefenderDamageNumericField({
  id,
  label,
  value,
  onChange,
  error,
}: DefenderDamageNumericFieldProps) {
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
      {error && (
        <Form.Control.Feedback id={errorId} type="invalid">
          {error}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
}

export default DefenderDamageNumericField;
