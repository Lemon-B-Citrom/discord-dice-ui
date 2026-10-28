import { Middleware } from "redux";
import { requestMsgReady } from "../../actions/roll.actions";
import reducers from "../../reducers";

type RootState = ReturnType<typeof reducers>;

interface DamageRequestMsg {
  msgTitle: string;
  description: string;
  color: number;
  fields: ReadonlyArray<{ name: string; value: string }>;
}

/**
 * Both damage calculators notify Discord the same way: save the result, then
 * build one embed from it. Only the trigger action and the builder differ, so a
 * notification problem must never turn a saved result into a failure.
 */
export function createDamageSendResultsMiddleware<Result>(
  actionType: string,
  buildMessage: (result: Result, username: string) => DamageRequestMsg
): Middleware<{}, RootState> {
  return (store) => (next) => (action: any) => {
    if (action.type !== actionType) return next(action);

    const result = action.payload as Result;
    const nextResult = next(action);

    try {
      const username = store.getState().userSettings.username;
      store.dispatch(requestMsgReady(buildMessage(result, username)));
    } catch (_error) {
      console.error("Unable to prepare a Warhammer damage webhook message.");
    }

    return nextResult;
  };
}
