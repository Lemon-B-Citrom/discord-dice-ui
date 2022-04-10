// @ts-nocheck
import React from "react";
import { localMsgReady } from "../../actions/roll.actions";
import { INFINITY_DICE_ROLLED } from "../../actions/infinity.actions";
import { CONAN_DICE_ROLLED } from "../../actions/conan.actions";
import {
  get2d20SuccessLevel,
  I2d20SuccessLevel,
} from "../../components/2d20/utils/get-2d20-success-level";

export const get2d20LocalMsg = (store: any) => (next: any) => (action: any) => {
  if (
    action.type === CONAN_DICE_ROLLED ||
    action.type === INFINITY_DICE_ROLLED
  ) {
    const state = store.getState();
    const { rerollCount } = state;
    const {
      payload: { result },
    } = action;
    const {
      payload: { rollOptions },
    } = action;
    const { results, assistanceDiceResults } = result;
    const {
      difficulty,
      tn,
      focus,
      untrainedTest,
      assistanceDice,
      assistanceFocus,
      assistanceTn,
      assistanceUntrainedTest,
    } = rollOptions;

    let assistanceSuccessLevel: Partial<I2d20SuccessLevel> = {};

    if (assistanceDice && assistanceDiceResults) {
      assistanceSuccessLevel = get2d20SuccessLevel({
        results: assistanceDiceResults,
        tn: assistanceTn,
        focus: assistanceFocus,
        difficulty: Number(difficulty),
        untrainedTest: assistanceUntrainedTest || untrainedTest,
      });
    }

    const successLevel: infinitySuccessLevelType = get2d20SuccessLevel({
      results,
      tn,
      focus,
      difficulty,
      assistanceSuccessLevel: assistanceSuccessLevel.successLevel,
      untrainedTest,
    });

    store.dispatch(
      localMsgReady({
        successLevel,
        assistanceSuccessLevel,
        assistanceDiceResults,
        rollOptions,
        results,
        rerollCount,
      })
    );
  }
  next(action);
};
