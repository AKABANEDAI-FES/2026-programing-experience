import { useState } from 'react';
import type { DrawMode } from 'shared';
import { DrawingScreen } from './components/DrawingScreen';
import { HomeScreen } from './components/HomeScreen';
import styles from './App.module.css';

type AppStep = 'home' | 'drawing';

function App() {
  const [step, setStep] = useState<AppStep>('home');
  const [drawMode, setDrawMode] = useState<DrawMode | null>(null);

  const handleSelectMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setStep('drawing');
  };

  return (
    <main className={styles.app}>
      {step === 'home' || drawMode === null ? (
        <HomeScreen onSelectMode={handleSelectMode} />
      ) : (
        <DrawingScreen mode={drawMode} onModeChange={setDrawMode} />
      )}
    </main>
  );
}

export default App;
