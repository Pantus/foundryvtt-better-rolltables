import { CONSTANTS } from "../constants/constants.js";
import SETTINGS from "../constants/settings.js";

export const BRTCONFIG = {
  NAMESPACE: CONSTANTS.MODULE_ID,

  // START FLAGS
  GENERIC_AMOUNT_KEY: CONSTANTS.FLAGS.GENERIC_AMOUNT_KEY,

  // saved data keys (used e.g. in the rolltableEntity.data.flags)
  TABLE_TYPE_KEY: CONSTANTS.FLAGS.TABLE_TYPE_KEY,

  LOOT_CURRENCY_STRING_KEY: CONSTANTS.FLAGS.LOOT_CURRENCY_STRING_KEY,
  LOOT_AMOUNT_KEY: CONSTANTS.FLAGS.LOOT_AMOUNT_KEY,
  LOOT_ACTOR_NAME_KEY: CONSTANTS.FLAGS.LOOT_ACTOR_NAME_KEY,

  HARVEST_AMOUNT_KEY: CONSTANTS.FLAGS.HARVEST_AMOUNT_KEY,
  HARVEST_DC_VALUE_KEY: CONSTANTS.FLAGS.HARVEST_DC_VALUE_KEY,
  HARVEST_SKILL_VALUE_KEY: CONSTANTS.FLAGS.HARVEST_SKILL_VALUE_KEY,
  HARVEST_ACTOR_NAME_KEY: CONSTANTS.FLAGS.HARVEST_ACTOR_NAME_KEY,

  /** @deprecated used on the old html view */
  RESULTS_FORMULA_KEY: CONSTANTS.FLAGS.RESULTS_FORMULA_KEY,
  RESULTS_FORMULA_KEY_FORMULA: CONSTANTS.FLAGS.RESULTS_FORMULA_KEY_FORMULA,
  HIDDEN_TABLE: CONSTANTS.FLAGS.HIDDEN_TABLE,

  // END FLAGS

  // START WORLD SETTINGS

  // different type of table type the mod will support. none will basically keep the basic rolltable functionality
  TABLE_TYPE_NONE: CONSTANTS.TABLE_TYPE_NONE,
  TABLE_TYPE_BETTER: CONSTANTS.TABLE_TYPE_BETTER,
  TABLE_TYPE_LOOT: CONSTANTS.TABLE_TYPE_LOOT,
  TABLE_TYPE_HARVEST: CONSTANTS.TABLE_TYPE_HARVEST,
  TABLE_TYPE_STORY: CONSTANTS.TABLE_TYPE_STORY,

  SPELL_COMPENDIUM_KEY: SETTINGS.SPELL_COMPENDIUM_KEY,
  // LOOT_SHEET_TO_USE_KEY: SETTINGS.LOOT_SHEET_TO_USE_KEY,
  SHOW_REROLL_BUTTONS: SETTINGS.SHOW_REROLL_BUTTONS,
  SHOW_OPEN_BUTTONS: SETTINGS.SHOW_OPEN_BUTTONS,
  USE_CONDENSED_BETTERROLL: SETTINGS.USE_CONDENSED_BETTERROLL,
  ADD_ROLL_IN_COMPENDIUM_CONTEXTMENU: SETTINGS.ADD_ROLL_IN_COMPENDIUM_CONTEXTMENU,
  ADD_ROLL_IN_ROLLTABLE_CONTEXTMENU: SETTINGS.ADD_ROLL_IN_ROLLTABLE_CONTEXTMENU,
  SHOW_WARNING_BEFORE_REROLL: SETTINGS.SHOW_WARNING_BEFORE_REROLL,
  STICK_ROLLTABLE_HEADER: SETTINGS.STICK_ROLLTABLE_HEADER,
  ROLL_TABLE_FROM_JOURNAL: SETTINGS.ROLL_TABLE_FROM_JOURNAL,

  // Loot
  SHOW_CURRENCY_SHARE_BUTTON: SETTINGS.SHOW_CURRENCY_SHARE_BUTTON,
  ALWAYS_SHOW_GENERATED_LOOT_AS_MESSAGE: SETTINGS.ALWAYS_SHOW_GENERATED_LOOT_AS_MESSAGE,

  // Harvest
  ALWAYS_SHOW_GENERATED_HARVEST_AS_MESSAGE: SETTINGS.ALWAYS_SHOW_GENERATED_HARVEST_AS_MESSAGE,

  TAGS: {
    USE: SETTINGS.TAGS.USE,
    DEFAULTS: SETTINGS.TAGS.DEFAULTS,
  },

  // END WORLD SETTINGS
};
