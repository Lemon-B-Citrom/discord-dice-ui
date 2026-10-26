const DEFAULT_MAX_LENGTH = 180;
const FALLBACK_USERNAME = "USERNAME_MISSING";

// Single shared escape set: includes `<` and `>` exactly once each so every
// calculator that embeds a display name renders it identically.
const MARKDOWN_CHARACTERS = new Set([
  "\\",
  "`",
  "*",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "#",
  "+",
  "-",
  ".",
  "!",
  "|",
  ">",
  "~",
  "<",
]);

/**
 * Make a user-supplied display name safe for a Discord embed title.
 *
 * Escapes Discord Markdown, suppresses `@` mentions, replaces control and line
 * separators with spaces, and truncates token-by-token so truncation can never
 * leave a lone backslash at the end of the title.
 */
export default function sanitizeDiscordUsername(
  username: string,
  maxLength = DEFAULT_MAX_LENGTH
): string {
  const tokens = Array.from(username || FALLBACK_USERNAME).map((character) => {
    const code = character.charCodeAt(0);
    if (
      code <= 0x1f ||
      code === 0x7f ||
      code === 0x2028 ||
      code === 0x2029
    ) {
      return " ";
    }
    if (character === "@") return "@\u200b";
    return MARKDOWN_CHARACTERS.has(character) ? `\\${character}` : character;
  });

  let bounded = "";
  tokens.forEach((token) => {
    if (bounded.length + token.length <= maxLength) {
      bounded += token;
    }
  });

  return bounded.trim() || "USERNAME\\_MISSING";
}
