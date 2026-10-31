import getRandom from "./getRandom";

test("returns integers inside the requested range", () => {
  for (let i = 0; i < 1000; i++) {
    const value = getRandom(6);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(6);
  }
});

test("honours a negative or non-unit minimum", () => {
  for (let i = 0; i < 1000; i++) {
    const value = getRandom(5, -5);
    expect(value).toBeGreaterThanOrEqual(-5);
    expect(value).toBeLessThanOrEqual(5);
  }
});

test("returns the single value of a one-wide range", () => {
  expect(getRandom(7, 7)).toBe(7);
});

test("falls back to the minimum instead of throwing when max < min", () => {
  expect(getRandom(0)).toBe(1);
});

test("reaches every face of a d6", () => {
  const seen = new Set<number>();

  for (let i = 0; i < 600; i++) {
    seen.add(getRandom(6));
  }

  expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
});

test("falls back to Math.random when WebCrypto is unavailable", () => {
  const cryptoSource = (globalThis as { crypto?: Crypto }).crypto;
  jest.spyOn(Math, "random").mockReturnValue(0.5);

  try {
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
    });

    // Math.random() === 0.5 -> 2147483648, which passes the rejection check
    // for a range of 10 and maps to 2147483648 % 10 + 1 === 9
    expect(getRandom(10)).toBe(9);
  } finally {
    Object.defineProperty(globalThis, "crypto", {
      value: cryptoSource,
      configurable: true,
    });
    jest.restoreAllMocks();
  }
});
