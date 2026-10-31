let idCounter = 0;

export default function getUniqueId(prefix: string): string {
  idCounter += 1;

  return `${prefix}-${idCounter}`;
}
