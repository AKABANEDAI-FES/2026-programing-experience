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

  const renderCurrentScreen = () => {
    if (step === 'home' || drawMode === null) {
      return <HomeScreen onSelectMode={handleSelectMode} />;
    }

    if (step === 'drawing') {
      return (
        <DrawingScreen
          mode={drawMode}
          onModeChange={setDrawMode}
          onDrawingComplete={handleDrawingComplete}
        />
      );
    }

    if (imageData === null) {
      return <HomeScreen onSelectMode={handleSelectMode} />;
    }

    return <ProgrammingScreen imageData={imageData} />;
  };

  return (
    <main className={styles.app}>
      {renderCurrentScreen()}
    </main>
  );
}

export default App;
