import { useState } from 'react';
import type { DrawMode } from 'shared';
import { DrawingScreen } from './components/DrawingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProgrammingScreen } from './components/ProgrammingScreen';
import styles from './App.module.css';

type AppStep = 'home' | 'drawing' | 'programming';

function App() {
  const [step, setStep] = useState<AppStep>('home');
  const [drawMode, setDrawMode] = useState<DrawMode | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const handleSelectMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setImageData(null);
    setStep('drawing');
  };

  const handleDrawingComplete = (nextImageData: string) => {
    setImageData(nextImageData);
    setStep('programming');
  };

  return (
    <main className={styles.app}>
      {step === 'home' || drawMode === null ? (
        <HomeScreen onSelectMode={handleSelectMode} />
      ) : step === 'drawing' ? (
        <DrawingScreen
          mode={drawMode}
          onModeChange={setDrawMode}
          onNext={handleDrawingComplete}
        />
      ) : imageData !== null ? (
        <ProgrammingScreen imageData={imageData} />
      ) : (
        <HomeScreen onSelectMode={handleSelectMode} />
      )}
    </main>
  );
}

export default App;
