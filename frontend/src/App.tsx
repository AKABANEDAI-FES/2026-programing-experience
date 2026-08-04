import { useState } from 'react';
import type { Command, DrawMode } from 'shared';
import { CompleteScreen } from './components/CompleteScreen';
import { DisplayScreen } from './components/DisplayScreen';
import { DrawingScreen } from './components/DrawingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProgrammingScreen } from './components/ProgrammingScreen';
import styles from './App.module.css';

type ParticipantStep = 'home' | 'drawing' | 'programming' | 'complete';

function App() {
  const route = window.location.pathname;
  const [step, setStep] = useState<ParticipantStep>('home');
  const [drawMode, setDrawMode] = useState<DrawMode | null>(null);
  const [imageData, setImageData] = useState('');

  const handleSelectMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setImageData('');
    setStep('drawing');
  };

  const handleDrawingComplete = (nextImageData: string) => {
    setImageData(nextImageData);
    setStep('programming');
  };

  const handleReleaseComplete = () => {
    setStep('complete');
  };

  const handleReset = () => {
    setDrawMode(null);
    setImageData('');
    setStep('home');
  };

  if (route === '/display') {
    return (
      <main className={styles.app}>
        <DisplayScreen />
      </main>
    );
  }

  let participantScreen = <HomeScreen onSelectMode={handleSelectMode} />;

  if (drawMode !== null && step === 'drawing') {
    participantScreen = <DrawingScreen mode={drawMode} onComplete={handleDrawingComplete} />;
  }

  if (drawMode !== null && step === 'programming') {
    participantScreen = (
      <ProgrammingScreen
        imageData={imageData}
        mode={drawMode}
        onReleased={handleReleaseComplete}
        fallbackCommands={[] satisfies Command[]}
      />
    );
  }

  if (step === 'complete') {
    participantScreen = <CompleteScreen onDone={handleReset} />;
  }

  return <main className={styles.app}>{participantScreen}</main>;
}

export default App;
