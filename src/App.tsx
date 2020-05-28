import React from 'react';
import DiceModuleContainer from './components/DiceModule/DiceModuleContainer';
import HeaderContainer from './components/Header/HeaderContainer';

// Modals
import SettingsModalContainer from './components/SettingsModal/SettingsModalContainer';
import ModifierModalContainer from './components/ModifierModal/ModifierModalContainer';
import ResultsModalContainer from './components/ResultsModal/ResultsModalContainer';
import CoCModalContainer from './components/CoCModal/CoCModalContainer';
import WarhammerModalContainer from './components/WarhammerModal/WarhammerModalContainer';

function App() {
	return (
		<div className="App">
			<CoCModalContainer />
			<WarhammerModalContainer />
			<ResultsModalContainer />
			<ModifierModalContainer />
			<SettingsModalContainer />
			<HeaderContainer />
			<DiceModuleContainer />
		</div>
	);
}

export default App;
