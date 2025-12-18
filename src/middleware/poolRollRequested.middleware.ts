import {
  DICE_POOL_ROLL_REQUESTED,
  dicePoolRolled,
} from "../actions/roll.actions";
import getDieNumberVal from "../utils/getDieNumberVal";
import getResultsArray from "../utils/getResultsArray";
import diceModuleOptionsStore from "../components/DiceModuleOptions/store";

export default (store: any) => (next: any) => (action: any) => {
  if (action.type === DICE_POOL_ROLL_REQUESTED) {
    const { pool, modifier } = action.payload;
    const results = {};

    Object.keys(pool).forEach((diceType: string) => {
      const diceTypeNum = getDieNumberVal(diceType);
      const diceAmount: number = pool[diceType];
      const { preserveDiceOrder } = diceModuleOptionsStore.getState();
      const resultsArray = getResultsArray(diceTypeNum, diceAmount, undefined, !preserveDiceOrder);
      if (resultsArray.length) {
        // @ts-ignore
        results[diceType] = resultsArray;
      }
    });

    if (Object.keys(results).length) {
      store.dispatch(dicePoolRolled({ results, modifier }));
    }
  }
  next(action);
};
