import {
  EMBED_DESCRIPTION_MAX,
  EMBED_FIELD_MAX,
  EMBED_FIELD_NAME_MAX,
  EMBED_FIELD_VALUE_MAX,
  EMBED_TITLE_MAX,
  EMBED_TOTAL_BUDGET,
} from "../consts/discordEmbed";

export interface EmbedField {
  name: string;
  value: string;
}

export interface ChunkEmbedRowsOptions {
  firstName: string;
  continuationName: string;
  /** Separator between rows that share one field. */
  joiner?: string;
}

/**
 * Pack rows into as few embed fields as the value limit allows. Rows are never
 * split, so a row that is itself too long becomes its own over-long field
 * rather than being silently truncated.
 */
export default function chunkEmbedRows(
  rows: ReadonlyArray<string>,
  { firstName, continuationName, joiner = "\n" }: ChunkEmbedRowsOptions
): EmbedField[] {
  const fields: EmbedField[] = [];
  let value = "";

  const flush = () => {
    if (!value) return;
    fields.push({
      name: fields.length === 0 ? firstName : continuationName,
      value,
    });
    value = "";
  };

  rows.forEach((row) => {
    const nextValue = value ? `${value}${joiner}${row}` : row;
    if (value && nextValue.length > EMBED_FIELD_VALUE_MAX) {
      flush();
      value = row;
    } else {
      value = nextValue;
    }
  });
  flush();
  return fields;
}

/**
 * Join text fragments into strings no longer than `maxLength`, never splitting a
 * fragment. Used for comma-separated lists that must span several embed fields.
 */
export function chunkTextForEmbed(
  fragments: ReadonlyArray<string>,
  maxLength = EMBED_FIELD_VALUE_MAX
): string[] {
  const chunks: string[] = [];
  let value = "";

  fragments.forEach((fragment) => {
    if (value && value.length + fragment.length > maxLength) {
      chunks.push(value);
      value = fragment.trimStart();
    } else {
      value += fragment;
    }
  });
  if (value) chunks.push(value);
  return chunks;
}

/**
 * True when the whole payload fits one Discord embed. Callers that must keep
 * every row pass `EMBED_TOTAL_MAX` instead of the safer local budget.
 */
export function fitsInOneEmbed(
  title: string,
  description: string,
  fields: ReadonlyArray<EmbedField>,
  totalBudget = EMBED_TOTAL_BUDGET
): boolean {
  const total =
    title.length +
    description.length +
    fields.reduce(
      (length, field) => length + field.name.length + field.value.length,
      0
    );
  return (
    title.length <= EMBED_TITLE_MAX &&
    description.length <= EMBED_DESCRIPTION_MAX &&
    fields.length <= EMBED_FIELD_MAX &&
    fields.every(
      (field) =>
        field.name.length <= EMBED_FIELD_NAME_MAX &&
        field.value.length <= EMBED_FIELD_VALUE_MAX
    ) &&
    total <= totalBudget
  );
}
