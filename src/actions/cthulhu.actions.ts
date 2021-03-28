export const OPEN_CTHULHU_MODAL = 'OPEN_CTHULHU_MODAL';
export const CLOSE_CTHULHU_MODAL = 'CLOSE_CTHULHU_MODAL';
export const CTHULHU_ROLL_REQESTED = 'CTHULHU_ROLL_REQESTED';
export const CTHULHU_DICE_ROLLED = 'CTHULHU_DICE_ROLLED';
export const CLOSE_CTHULHU_RESULTS_MODAL = 'CLOSE_CTHULHU_RESULTS_MODAL';

export function openCthulhuModal() {
	return {
		type: OPEN_CTHULHU_MODAL
	};
}

export function closeCthulhuModal() {
	return {
		type: CLOSE_CTHULHU_MODAL
	};
}

export function requestCthulhuRoll(payload: any) {
	return {
		type: CTHULHU_ROLL_REQESTED,
		payload
	};
}

export function cthulhuDiceRolled(payload: any) {
	return {
		type: CTHULHU_DICE_ROLLED,
		payload
	};
}

export function closeCthulhuResultsModal() {
	return {
		type: CLOSE_CTHULHU_RESULTS_MODAL
	};
}
