/** The number of distinct uint32 values: every raw draw lands in [0, UINT32_RANGE). */
const UINT32_RANGE = 2 ** 32;

/** One uniform uint32, from WebCrypto where it exists and Math.random otherwise. */
const randomUint32 = (): number => {
  const cryptoSource = (globalThis as { crypto?: Crypto }).crypto;

  if (cryptoSource && typeof cryptoSource.getRandomValues === "function") {
    return cryptoSource.getRandomValues(new Uint32Array(1))[0];
  }

  // jsdom, old browsers, and non-secure contexts can lack WebCrypto.
  return Math.floor(Math.random() * UINT32_RANGE);
};

/**
 * A uniformly distributed integer in [minValue, maxValue], both inclusive.
 */
export default function getRandom(
  maxValue: number,
  minValue: number = 1
): number {
  const min = Math.ceil(minValue);
  const max = Math.floor(maxValue);
  const range = max - min + 1;

  if (range <= 1) {
    return min;
  }

  // Rejecting the uneven tail keeps every value in [min, max] equally likely.
  const rejectLimit = Math.floor(UINT32_RANGE / range) * range;
  let value = randomUint32();

  while (value >= rejectLimit) {
    value = randomUint32();
  }

  return min + (value % range);
}
