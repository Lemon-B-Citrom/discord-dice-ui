import {
  NARRATIVE_DICE_POOL_ROLL_REQUESTED,
  narrativeDicePoolRolled,
} from "../actions/roll.actions";
import getDieNumberVal from "../utils/getDieNumberVal";
import getResultsArray from "../utils/getResultsArray";
import mapValueToNarrative from "./utils/mapValueToNarrative";
import getNarrativeDiceDerivedResults from "./utils/getNarrativeDiceDerivedResults";
import diceModuleOptionsStore from "../components/DiceModuleOptions/store";

export default (store: any) => (next: any) => (action: any) => {
  if (action.type === NARRATIVE_DICE_POOL_ROLL_REQUESTED) {
    const { pool } = action.payload;
    const allResults: Array<string> = [];
    const results = {};
    let resultsDerived;

    Object.keys(pool).forEach((diceType: string) => {
      const diceTypeNum = getDieNumberVal(diceType);
      const diceAmount: number = pool[diceType];
      const { preserveDiceOrder } = diceModuleOptionsStore.getState();
      const resultsArray = getResultsArray(
        diceTypeNum,
        diceAmount,
        undefined,
        !preserveDiceOrder
      );
      if (resultsArray.length) {
        const mappedResults = resultsArray.map((value: number) => {
          return mapValueToNarrative(diceType, value);
        });

        // @ts-ignore
        results[diceType] = mappedResults;

        mappedResults.forEach((rs: string) => {
          // Fill allResults
          rs.split(",").forEach((r: string) => {
            allResults.push(r);
          });
        });
      }
    });

    resultsDerived = getNarrativeDiceDerivedResults(allResults);

    if (Object.keys(results).length) {
      store.dispatch(
        narrativeDicePoolRolled({
          results,
          resultsDerived,
        })
      );
    }
  }
  next(action);
};
