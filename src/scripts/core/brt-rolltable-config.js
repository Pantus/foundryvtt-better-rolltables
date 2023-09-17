import API from "../API";
import { CONSTANTS } from "../constants/constants";
import { i18n } from "../lib";
import { RichResultEdit } from "./brt-result-editor";

export class BetterRollTableBetterConfig extends RollTableConfig {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "roll-table-config", `${CONSTANTS.MODULE_ID}-roll-table-config`],
      template: `modules/${CONSTANTS.MODULE_ID}/templates/sheet/brt-roll-table-config.hbs`,
      width: 800,
      height: "auto",
      closeOnSubmit: false,
      viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      scrollY: ["ol.table-results"],
      // // dragDrop: [{ dragSelector: null, dropSelector: null }],
      // dragDrop: [
      //   { dragSelector: null, dropSelector: null },
      //   {
      //     dragSelector: "section.results .table-results .table-result",
      //     dropSelector: "section.results .table-results",
      //   },
      // ],
    });
  }

  /**
   * @override
   */
  async getData(options = {}) {
    const context = await super.getData(options);
    context.descriptionHTML = await TextEditor.enrichHTML(this.object.description, {
      async: true,
      secrets: this.object.isOwner,
    });
    const results = this.document.results.map((result) => {
      result = result.toObject(false);
      result.isText = result.type === CONST.TABLE_RESULT_TYPES.TEXT;
      result.isDocument = result.type === CONST.TABLE_RESULT_TYPES.DOCUMENT;
      result.isCompendium = result.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM;
      result.img = result.img || CONFIG.RollTable.resultIcon;
      result.text = TextEditor.decodeHTML(result.text);
      // grab the formula
      // result.qtFormula = getProperty(result, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.}`;
      return result;
    });
    results.sort((a, b) => a.range[0] - b.range[0]);

    // Merge data and return;
    let brtData = foundry.utils.mergeObject(context, {
      results: results,
      resultTypes: Object.entries(CONST.TABLE_RESULT_TYPES).reduce((obj, v) => {
        obj[v[1]] = v[0].titleCase();
        return obj;
      }, {}),
      documentTypes: CONST.COMPENDIUM_DOCUMENT_TYPES,
      compendiumPacks: Array.from(game.packs.keys()),
    });

    // Set brt type
    if (this.document.getFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TABLE_TYPE_KEY) !== CONSTANTS.TABLE_TYPE_BETTER) {
      await this.document.setFlag(CONSTANTS.MODULE_ID, CONSTANTS.FLAGS.TABLE_TYPE_KEY, CONSTANTS.TABLE_TYPE_BETTER);
    }
    brtData.textType =
      i18n(`${CONSTANTS.MODULE_ID}.${"TypePrefixLabel"}`) + " " + i18n(`${CONSTANTS.MODULE_ID}.${"TypeLabel"}`) + "";

    brtData = foundry.utils.mergeObject(brtData, duplicate(this.document.flags));
    brtData.disabled = !this.isEditable;
    brtData.uuid = this.document.uuid;
    // TODO
    // brtData.enrichedDescription = await TextEditor.enrichHTML(context.data.description, { async: true });

    return brtData;
  }

  // /**
  //  * Modified copy of core _animateRoll to ensure it does not constantly break with the changed layout.
  //  *
  //  * @param {TableResult[]} results An Array of drawn table results to highlight
  //  * @returns {Promise} A Promise which resolves once the animation is complete
  //  * @override
  //  */
  // async _animateRoll(results) {
  //   // Get the list of results and their indices
  //   const tableResults = this.element[0].querySelector(".table-results"); // MOD ".table-results" instead ".table-results > tbody"
  //   const drawnIds = new Set(results.map((r) => r.id));
  //   const drawnItems = Array.from(tableResults.children).filter((item) => drawnIds.has(item.dataset.resultId));

  //   // Set the animation timing
  //   const nResults = this.object.results.size;
  //   const maxTime = 2000;
  //   let animTime = 50;
  //   let animOffset = Math.round(tableResults.offsetHeight / (tableResults.children[1].offsetHeight * 2)); // MOD [1] instead [0]
  //   const nLoops = Math.min(Math.ceil(maxTime / (animTime * nResults)), 4);
  //   if (nLoops === 1) animTime = maxTime / nResults;

  //   // Animate the roulette
  //   await this._animateRoulette(tableResults, drawnIds, nLoops, animTime, animOffset);

  //   // Flash the results
  //   const flashes = drawnItems.map((li) => this._flashResult(li));
  //   return Promise.all(flashes);
  // }

  // /**
  //  * @param {DragEvent} event
  //  */
  // _onDragStart(event) {
  //   const eel = event.target;
  //   const el = eel.dataset.resultId ? eel : eel.closest(".table-result[data-result-id]");
  //   event.dataTransfer?.setData(
  //     "text/plain",
  //     JSON.stringify({ event: "sort", index: el.dataset.index, result: el.dataset.resultId })
  //   );
  // }

  // async _onDrop(event) {
  //   const json = TextEditor.getDragEventData(event);
  //   if (json.event === "sort") {
  //     const eel = event.target;
  //     const el = eel.dataset.resultId ? eel : eel.closest(".table-result[data-result-id]");
  //     if (!el) {
  //       ui.notifications.warn("Drop target not found.");
  //       return;
  //     }
  //     return this.reorderIndex(event, json.result, el.dataset.resultId);
  //   } else {
  //     return super._onDrop(event);
  //   }
  // }

  /**
   * @param {String} source Source ID
   * @param {String} target Target ID
   */
  async reorderIndex(event, source, target) {
    if (!this.rendered || this._submitting) return false;
    // Save any pending changes
    await this._onSubmit(event);

    // Normalize weights just in case
    /** @type {Object[]} */
    const results = this.document.results.map((result) => result.toObject(false));
    results.sort((a, b) => a.range[0] - b.range[0]);

    const sourceIx = results.findIndex((r) => r._id === source),
      targetIx = results.findIndex((r) => r._id === target);

    if (sourceIx == targetIx) {
      ui.notifications.warn("Can't move result onto itself.");
      return;
    }

    // Move result
    const [moved] = results.splice(sourceIx, 1);
    results.splice(targetIx, 0, moved);

    // Update weight
    results.forEach((r) => (r.weight = r.range[1] - (r.range[0] - 1)));
    let totalWeight = 1;
    const updates = [];
    for (const result of results) {
      const w = result.weight;
      updates.push({ _id: result._id, weight: w, range: [totalWeight, totalWeight + w - 1] });
      totalWeight = totalWeight + w;
    }
    return this.document.updateEmbeddedDocuments("TableResult", updates);
  }

  /**
   * Sets weights based on ranges
   * @param {Event} event
   */
  async _onNormalizeWeights(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.rendered || this._submitting) return false;

    // Save any pending changes
    await this._onSubmit(event);

    const results = this.document.results.map((result) => result.toObject(false));

    const updates = results.map((r) => ({ _id: r._id, weight: r.range[1] - (r.range[0] - 1) }));

    return this.document.updateEmbeddedDocuments("TableResult", updates);
  }

  /**
   * @param {Event} event
   */
  async _openRichEditor(event) {
    event.preventDefault();
    event.stopPropagation();

    // Save any pending changes
    await this._onSubmit(event);

    const parent = event.target.closest(".table-result[data-result-id]");
    const id = parent.dataset.resultId;
    const result = this.document.results.get(id);

    const uuid = `richedit-${result.uuid}`;
    const old = Object.values(ui.windows).find((app) => app.options.id === uuid);
    if (old) return old.render(true, { focus: true });

    const update = await RichResultEdit.open(result);
  }

  /**
   * @param {Event} event
   */
  _toggleSimpleEditor(event, html) {
    event.preventDefault();
    event.stopPropagation();

    const simpleEditor = document.createElement("textarea");
    simpleEditor.name = "description";
    simpleEditor.innerHTML = this.object.description;
    const editor = html.querySelector(".description-editor");
    editor?.replaceChildren(simpleEditor);
    this.editors = {}; // Bust rich edit
  }

  _getSubmitData(updateData) {
    const data = super._getSubmitData(updateData);
    // HACK: Zero description caused by ProseMirror
    if (data.description == "<p></p>") data.description = "";
    return data;
  }

  /**
   * @param {JQuery} jq
   */
  activateListeners(jq) {
    super.activateListeners(jq);

    const html = jq[0];

    // Re-normalize Table Entries
    html.querySelector(".normalize-weights").addEventListener("click", this._onNormalizeWeights.bind(this));

    html
      .querySelectorAll(".rich-edit-result")
      .forEach((el) => el.addEventListener("click", this._openRichEditor.bind(this)));

    html.querySelector(".better-rolltables-roll").addEventListener("click", this._onBetterRollTablesRoll.bind(this));
    // TODO
    // html.querySelector(".toggle-editor").addEventListener("click", (ev) => this._toggleSimpleEditor(ev, html));
  }

  /* -------------------------------------------- */

  /**
   * Handle drawing a result from the RollTable
   * @param {Event} event
   * @private
   */
  async _onRollTable(event) {
    // event.preventDefault();
    // await this.submit({preventClose: true, preventRender: true});
    // event.currentTarget.disabled = true;
    // let tableRoll = await this.document.roll();
    // const draws = this.document.getResultsForRoll(tableRoll.roll.total);
    // if ( draws.length ) {
    //   if (game.settings.get("core", "animateRollTable")) await this._animateRoll(draws);
    //   await this.document.draw(tableRoll);
    // }
    // event.currentTarget.disabled = false;
    return await super._onRollTable(event);
  }

  /**
   * Handle drawing a result from the RollTable
   * @param {Event} event
   * @private
   */
  async _onBetterRollTablesRoll(event) {
    event.preventDefault();
    await this.submit({ preventClose: true, preventRender: true });
    if (event.currentTarget) {
      event.currentTarget.disabled = true;
    } else {
      event.target.disabled = true;
    }
    const tableEntity = this.document;
    await API.betterTableRoll(tableEntity);
    if (event.currentTarget) {
      event.currentTarget.disabled = false;
    } else {
      event.target.disabled = false;
    }
  }
}