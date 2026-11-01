import { parseOptionalNonNegativeInteger } from "../../safeInteger";

export interface NonNegativeFieldOptions {
  required?: boolean;
  requiredMessage?: string;
  invalidMessage: string;
}

/** Parse one optional non-negative field and attach failures to its draft key. */
export function parseNonNegativeField<Field extends string>(
  text: string,
  field: Field,
  errors: Partial<Record<Field, string>>,
  options: NonNegativeFieldOptions
): number | null {
  if (options.required && !text.trim()) {
    errors[field] = options.requiredMessage || "This field is required";
    return null;
  }
  const value = parseOptionalNonNegativeInteger(text);
  if (value === null) errors[field] = options.invalidMessage;
  return value;
}
