import React from 'react';
import CodeSpan from '../components/CodeSpan/CodeSpan';
import getWarhammerSuccessLevels from './getWarhammerSuccessLevels';
import getReversedResult from './getReversedResult';
import getWarhammer2eHitLocation from './getWarhammer2eHitLocation';
import getWarhammer4eHitLocation from './getWarhammer4eHitLocation';
import getDarkHeresyIIHitLocation from './getDarkHeresyIIHitLocation';
import ResultVsSkillRow from '../components/ResultVsSkillRow/ResultVsSkillRow';
import HitLocations from '../components/HitLocations/HitLocations';
import styles from '../components/ResultsModal/ResultsModal.module.css';

export type LocalMsgParamsType = {
	title: any,
	fields: Array<any>
	isSuccess?: boolean
	rollOptions?: any
	finalDieResult?: number,
	userSettings?: any
}

const getWarhammerLocalMsg = (result:any, rollOptions:any, userSettings?:any):LocalMsgParamsType => {
	const {
		results,
		skillLevel
	} = result;
	const skillLevelString = skillLevel <= 9 ? `0${skillLevel}` : `${skillLevel}`;
	const fields = [];
	const finalDieResult = results[0];
	const finalDieResultString = finalDieResult <= 9 ? `0${finalDieResult}` : `${finalDieResult}`;
	let title = '';

	if (rollOptions.fastSL) {
		title = 'Fast SL';
	} else if (rollOptions.darkHeresySL) {
		title = 'Dark Heresy II DoS';
	} else if (rollOptions.warhammer2eSL) {
		title = 'Warhammer 2e DoS';
	} else {
		title = 'Warhammer 4e SL';
	}

	const successLevels = getWarhammerSuccessLevels(
		skillLevel,
		finalDieResult,
		!!rollOptions.fastSL,
		!!rollOptions.darkHeresySL,
		!!rollOptions.warhammer2eSL
	);

	fields.push(
		<ResultVsSkillRow
			skillLevel={skillLevelString}
			finalDieResult={finalDieResultString}
			isSuccess={successLevels.isSuccess}
		/>
	);

	if (successLevels.isSuccess && !successLevels.isAutoSuccess) {
		fields.push(
			<div className={`${styles.warhammerResult} ${styles.warhammerResultSuccess}`}>Success</div>
		);
	}
	if (successLevels.isAutoSuccess) {
		fields.push(
			<div className={`${styles.warhammerResult} ${styles.warhammerResultSuccess}`}>Automatic Success</div>
		);
	}
	if (successLevels.isFailure && !successLevels.isAutoFailure) {
		fields.push(
			<div className={`${styles.warhammerResult} ${styles.warhammerResultFailure}`}>Failure</div>
		);
	}
	if (successLevels.isAutoFailure) {
		fields.push(
			<div className={`${styles.warhammerResult} ${styles.warhammerResultFailure}`}>Automatic Failure</div>
		);
	}
	if (successLevels.isDouble) {
		fields.push(
			<div className={`${styles.warhammerResult}`}>Double</div>
		);
	}
	if (rollOptions.rerolledTimes) {
		const timesWord = rollOptions.rerolledTimes === 1 ? 'time' : 'times';
		fields.push(
			<div className={`${styles.warhammerResult}`}>Rerolled <CodeSpan>{rollOptions.rerolledTimes}</CodeSpan> {timesWord}</div>
		);
	}

	let slWord = '';
	if (rollOptions.darkHeresySL || rollOptions.warhammer2eSL) {
		if (successLevels.SL > 0) {
			slWord = successLevels.SL === 1 ? 'Degree of Success' : 'Degrees of Success';
		} else {
			slWord =  successLevels.SL === 1 ?'Degree of Failure' : 'Degrees of Failure';
		}
	} else {
		slWord = 'Success Level';
	}

	let slString = '';
	if (rollOptions.darkHeresySL || rollOptions.warhammer2eSL) {
		slString = `${Math.abs(successLevels.SL)}`;
	} else {
		slString = successLevels.SL > 0 ? `+${successLevels.SL}` : `${successLevels.SL}`;
	}

	fields.push(
		<div className={styles.slResult}>
			<div><span className={styles.slResultLabel}>{slWord}:</span></div>
			<div><CodeSpan className={styles.slResultSpan}>{slString}</CodeSpan></div>
		</div>
	);

	const reversedResult = getReversedResult(finalDieResultString);
	let hitLocation;

	if (rollOptions.darkHeresySL) {
		hitLocation = getDarkHeresyIIHitLocation(reversedResult)
	} else if (rollOptions.warhammer2eSL) {
		hitLocation = getWarhammer2eHitLocation(reversedResult);
	} else {
		hitLocation = getWarhammer4eHitLocation(reversedResult);
	}

	fields.push(
		<HitLocations
			result={reversedResult}
			hitLocation={hitLocation}
			isDarkHeresy={!!rollOptions.darkHeresySL}
			isWarhammer2e={!!rollOptions.warhammer2eSL}
		/>
	);

	rollOptions.warhammerMode = true;

	return {
		title,
		fields,
		isSuccess: successLevels.isSuccess,

		finalDieResult,
		rollOptions,
		userSettings
	};
};

export default getWarhammerLocalMsg;