import { BRTCONFIG } from "./config.js";
import { BRTUtils } from "../core/utils.js";
import { CONSTANTS } from "../constants/constants.js";
import { BRTBetterHelpers } from "./brt-helper.js";

export class BRTBuilder {
  constructor(tableEntity) {
    this.table = tableEntity;
  }

  /**
   *
   * @param {*} rollsAmount
   * @returns {array} results
   */
  async betterRoll(options) {
    let rollsAmount = options.rollsAmount || undefined;

    this.mainRoll = undefined;

    rollsAmount = rollsAmount || (await BRTBetterHelpers.rollsAmount(this.table));
    let resultsTmp = await this.rollManyOnTable(rollsAmount, this.table, options);
    this.results = resultsTmp;
    return this.results;
  }

  /**
   *
   * @param {array} results
   */
  async createChatCard(results, rollMode = null) {
    let msgData = { roll: this.mainRoll, messageData: {} };
    if (rollMode) {
      BRTUtils.addRollModeToChatData(msgData.messageData, rollMode);
    }
    await this.table.toMessage(results, msgData);
  }

  /**
   * Draw multiple results from a RollTable, constructing a final synthetic Roll as a dice pool of inner rolls.
   * @param {amount} amount               The number of results to draw
   * @param {RollTable} table             The rollTable object
   * @param {object} [options={}]         Optional arguments which customize the draw
   * @param {Roll} [options.roll]                   An optional pre-configured Roll instance which defines the dice roll to use
   * @param {boolean} [options.recursive=true]      Allow drawing recursively from inner RollTable results
   * @param {boolean} [options.displayChat=true]    Automatically display the drawn results in chat? Default is true
   * @param {number} [options._depth]  The rolls amount value
   *
   * @returns {Promise<Array{RollTableResult}>} The drawn results
   */
  async rollManyOnTable(amount, table, { roll = null, recursive = true, _depth = 0, dc = null, skill = null } = {}) {
    const maxRecursions = 5;
    let msg = "";
    // Prevent infinite recursion
    if (_depth > maxRecursions) {
      let msg = game.i18n.format(`${BRTCONFIG.NAMESPACE}.Strings.Warnings.MaxRecursion`, {
        maxRecursions: maxRecursions,
        tableId: table.id,
      });
      throw new Error(CONSTANTS.MODULE_ID + " | " + msg);
    }

    let drawnResults = [];

    // let dc = options.dc || undefined;
    // let skill = options.skill || undefined;
    let resultsUpdate = this.table.results;
    // Filter by dc
    if (dc && parseInt(dc) >= 0) {
      resultsUpdate = resultsUpdate.filter((r) => {
        return getProperty(r, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.HARVEST_DC_VALUE_KEY}`) >= parseInt(dc);
      });
    }
    // Filter by skill
    if (skill) {
      resultsUpdate = resultsUpdate.filter((r) => {
        return getProperty(r, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.HARVEST_SKILL_VALUE_KEY}`) === skill;
      });
    }

    while (amount > 0) {
      let resultToDraw = amount;
      /** if we draw without replacement we need to reset the table once all entries are drawn */
      if (!table.replacement) {
        const resultsLeft = table.results.reduce(function (n, r) {
          return n + !r.drawn;
        }, 0);

        if (resultsLeft === 0) {
          await table.resetResults();
          continue;
        }

        resultToDraw = Math.min(resultsLeft, amount);
      }

      if (!table.formula) {
        let msg = game.i18n.format(`${BRTCONFIG.NAMESPACE}.RollTable.NoFormula`, {
          name: table.name,
        });
        ui.notifications.error(CONSTANTS.MODULE_ID + " | " + msg);
        return;
      }

      /*
       * Draw multiple results from a RollTable, constructing a final synthetic Roll as a dice pool of inner rolls.
       * @param {number} number               The number of results to draw
       * @param {object} [options={}]         Optional arguments which customize the draw
       * @param {Roll} [options.roll]                   An optional pre-configured Roll instance which defines the dice roll to use (An existing Roll instance to use for drawing from the table)
       * @param {boolean} [options.recursive=true]      Allow drawing recursively from inner RollTable results
       * @param {boolean} [options.displayChat=true]    Automatically display the drawn results in chat? Default is true
       * @param {('blindroll'|'gmroll'|'selfroll')} [options.rollMode]             Customize the roll mode used to display the drawn results (The chat roll mode to use when displaying the result)
       * @param {Array.<TableResult>} [options.results] One or more table results which have been drawn
       * @param {boolean} [options.displayChat] Whether to automatically display the results in chat
       * @returns {Promise<{RollTableDraw}>}  The drawn results
       */
      const draw = await table.drawMany(resultToDraw, {
        roll: roll,
        recursive: false,
        displayChat: false,
        rollMode: "gmroll",
        filters: options,
      });
      if (!this.mainRoll) {
        this.mainRoll = draw.roll;
      }

      for (const entry of draw.results) {
        let formulaAmount =
          getProperty(entry, `flags.${BRTCONFIG.NAMESPACE}.${BRTCONFIG.RESULTS_FORMULA_KEY_FORMULA}`) || "";

        if (entry.type === CONST.TABLE_RESULT_TYPES.TEXT) {
          formulaAmount = "";
        }
        const entryAmount = await BRTBetterHelpers.tryRoll(formulaAmount);

        let innerTable;
        if (entry.type === CONST.TABLE_RESULT_TYPES.DOCUMENT && entry.documentCollection === "RollTable") {
          innerTable = game.tables.get(entry.documentId);
        } else if (entry.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
          const entityInCompendium = await BRTUtils.findInCompendiumByName(entry.documentCollection, entry.text);
          if (entityInCompendium !== undefined && entityInCompendium.documentName === "RollTable") {
            innerTable = entityInCompendium;
          }
        }

        if (innerTable) {
          let resultsInnerUpdate = innerTable.results;
          // Filter by dc
          if (dc && parseInt(dc) >= 0) {
            resultsInnerUpdate = resultsInnerUpdate.filter((r) => {
              return (
                getProperty(r, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.HARVEST_DC_VALUE_KEY}`) >= parseInt(dc)
              );
            });
          }
          // Filter by skill
          if (skill) {
            resultsInnerUpdate = resultsInnerUpdate.filter((r) => {
              return (
                getProperty(r, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.HARVEST_SKILL_VALUE_KEY}`) === skill
              );
            });
          }

          let innerOptions = mergeObject(deepClone(option), { _depth: _depth + 1 });

          const innerResults = await this.rollManyOnTable(entryAmount, innerTable, innerOptions);
          drawnResults = drawnResults.concat(innerResults);
        } else {
          //   for (let i = 0; i < entryAmount; i++) {
          //     drawnResults.push(entry);
          //   }
          drawnResults = drawnResults.concat(Array(entryAmount).fill(entry));
        }
      }
      amount -= resultToDraw;
    }

    return drawnResults;
  }

  /**
   * Evaluate a RollTable by rolling its formula and retrieving a drawn result.
   *
   * Note that this function only performs the roll and identifies the result, the RollTable#draw function should be
   * called to formalize the draw from the table.
   *
   * @param {object} [options={}]       Options which modify rolling behavior
   * @param {Roll} [options.roll]                   An alternative dice Roll to use instead of the default table formula
   * @param {boolean} [options.recursive=true]   If a RollTable document is drawn as a result, recursively roll it
   * @param {number} [options._depth]            An internal flag used to track recursion depth
   * @returns {Promise<RollTableDraw>}  The Roll and results drawn by that Roll
   *
   * @example Draw results using the default table formula
   * ```js
   * const defaultResults = await table.roll();
   * ```
   *
   * @example Draw results using a custom roll formula
   * ```js
   * const roll = new Roll("1d20 + @abilities.wis.mod", actor.getRollData());
   * const customResults = await table.roll({roll});
   * ```
   */
  async roll({ roll = null, recursive = true, _depth = 0 } = {}) {
    const resultsBrt = await this.rollManyOnTable(1, this.table, { roll, recursive, _depth });
    return {
      roll: roll,
      results: resultsBrt,
    };
  }
}
