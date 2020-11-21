import React from 'react';
import Button from 'react-bootstrap/Button';
import PoolBuilderContainer from '../PoolBuilder/PoolBuilderContainer';
import { PoolType } from '../PoolBuilderModal/PoolBuilderModalTypes';
import styles from './NarrativeDicePoolBuilder.module.css';

function NarrativeDicePoolBuilder({
	submitRoll
}: any ) {
	const handleSubmit = (pool: PoolType) => {
		submitRoll({
			pool
		});
	}

	const formName = 'narrative-pool-builder-form';

	return (
		<div className="dice-module">
			<PoolBuilderContainer
				handleSubmit={handleSubmit}
				formName={formName}
			/>
			<div className={styles.poolBuilderBtnContainer}>
				<Button
					size="lg"
					variant="success"
					type="submit"
					form={formName}>Roll!
				</Button>
			</div>
		</div>
	);
}

export default NarrativeDicePoolBuilder;
