export const NON_NEGATIVE_INTEGER_ERROR =
  "Enter a non-negative safe whole number";

/** Strict integer text parser: an optional sign followed by digits only. */
export function parseSafeInteger(text: string): number | null {
  if (!/^[+-]?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Strict non-negative integer text parser used by the Damage form fields.
 * Returns `null` when the text is not a safe whole number.
 */
export function requireNonNegativeInteger(text: string): number | null {
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

/** Throw unless the value is a safe whole number, otherwise return it. */
export function requireSafeInteger(
  value: number,
  description = "Value"
): number {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${description} exceeds the safe whole-number range`);
  }
  return value;
}
