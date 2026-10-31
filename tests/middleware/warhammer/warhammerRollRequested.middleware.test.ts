import middleware from "../../../src/middleware/warhammer/warhammerRollRequested.middleware";
import { WARHAMMER_DICE_ROLLED } from "../../../src/actions/warhammer.actions";
import sl from "../../../src/components/WarhammerModal/sl";

jest.mock("../../../src/utils/getResultsArray", () => () => [51]);

describe("warhammerRollRequested middleware hit locations", () => {
  test.each([sl.dh, sl.ow])(
    "combines human and vehicle locations for %s",
    (slType) => {
      const dispatch = jest.fn();
      const next = jest.fn();
      const store: any = {
        getState: () => ({ warhammerState: { slType } }),
        dispatch,
      };

      middleware(store)(next)({
        type: "WARHAMMER_ROLL_REQESTED",
        payload: { skillLevel: 50 },
      });

      const rolledAction = dispatch.mock.calls[0][0];
      expect(rolledAction.type).toBe(WARHAMMER_DICE_ROLLED);
      expect(rolledAction.payload.hitLocation).toBe(
        "Right Arm / Motive Systems"
      );
    }
  );

  test("keeps other systems' hit locations unchanged", () => {
    const dispatch = jest.fn();
    const store: any = {
      getState: () => ({ warhammerState: { slType: sl.wfrp2e } }),
      dispatch,
    };

    middleware(store)(jest.fn())({
      type: "WARHAMMER_ROLL_REQESTED",
      payload: { skillLevel: 50 },
    });

    expect(dispatch.mock.calls[0][0].payload.hitLocation).toBe("Head");
  });
});
