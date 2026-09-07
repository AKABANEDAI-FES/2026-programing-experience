import { useState } from 'react';
import type { DrawMode } from 'shared';
import { DrawingScreen } from './components/DrawingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProgrammingScreen } from './components/ProgrammingScreen';
import type { DrawingCache, DrawingResult } from './types/drawing';
import styles from './App.module.css';

type AppStep = 'home' | 'drawing' | 'programming';

function App() {
  const [step, setStep] = useState<AppStep>('home');
  const [drawMode, setDrawMode] = useState<DrawMode | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [drawingCache, setDrawingCache] = useState<DrawingCache | null>(null);

  const handleSelectMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setImageData(null);
    setDrawingCache(null);
    setStep('drawing');
  };

  const handleDrawingComplete = (result: DrawingResult) => {
    setImageData(result.imageData);
    setDrawingCache(result.drawingCache);
    setStep('programming');
  };

  return (
    <main className={styles.app}>
      {step === 'home' || drawMode === null ? (
        <HomeScreen onSelectMode={handleSelectMode} />
      ) : step === 'drawing' ? (
        <DrawingScreen
          mode={drawMode}
          initialDrawingCache={drawingCache}
          onModeChange={setDrawMode}
          onDrawingComplete={handleDrawingComplete}
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
