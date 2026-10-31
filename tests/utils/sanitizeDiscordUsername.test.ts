import sanitizeDiscordUsername from "../../src/utils/sanitizeDiscordUsername";

test("escapes Markdown, angle brackets, and mentions exactly once", () => {
  expect(sanitizeDiscordUsername("a<b>c@d")).toBe("a\\<b\\>c@\u200bd");
});

test("keeps the fallback escaped for a missing or blank name", () => {
  expect(sanitizeDiscordUsername("")).toBe("USERNAME\\_MISSING");
  expect(sanitizeDiscordUsername("   ")).toBe("USERNAME\\_MISSING");
});

test("truncates by escape token so the title never ends in a lone backslash", () => {
  const sanitized = sanitizeDiscordUsername(`${"a".repeat(179)}<`);

  expect(sanitized).toBe("a".repeat(179));
  expect(sanitized.length).toBeLessThanOrEqual(180);
  expect(sanitized.endsWith("\\")).toBe(false);
});

test("honours a custom maximum length", () => {
  expect(sanitizeDiscordUsername("abcde", 3)).toBe("abc");
});
