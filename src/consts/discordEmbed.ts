/**
 * Discord's documented limits for a single embed. Shared by every builder that
 * has to fit its output inside one embed so the budgets cannot drift apart.
 */
export const EMBED_TITLE_MAX = 256;
export const EMBED_DESCRIPTION_MAX = 4096;
export const EMBED_FIELD_NAME_MAX = 256;
export const EMBED_FIELD_VALUE_MAX = 1024;
export const EMBED_FIELD_MAX = 25;
export const EMBED_TOTAL_MAX = 6000;

/**
 * Local packing budget: a deliberate safety margin below `EMBED_TOTAL_MAX`
 * so a builder never lands exactly on Discord's hard ceiling.
 */
export const EMBED_TOTAL_BUDGET = 5800;
