import { useEffect, useMemo, useState } from 'react';
import type { Command, Creature } from 'shared';
import { MAX_CREATURES } from 'shared';
import { fetchCreatures } from '../api';
import styles from './DisplayScreen.module.css';

type PositionedCreature = Creature & {
  top: number;
  delay: number;
  duration: number;
  size: number;
};

function hash(input: string) {
  let value = 0;
  for (const char of input) {
    value = (value * 31 + char.charCodeAt(0)) % 9973;
  }
  return value;
}

function getSpeed(commands: Command[]) {
  const speedCommand = commands.find((command) => command.type === 'speed');
  if (speedCommand?.type !== 'speed') {
    return 28;
  }

  if (speedCommand.value === 'slow') {
    return 38;
  }

  if (speedCommand.value === 'fast') {
    return 18;
  }

  return 28;
}

function getSayText(commands: Command[]) {
  const sayCommand = commands.find((command) => command.type === 'say');
  return sayCommand?.type === 'say' ? sayCommand.text : '';
}

function getMotionClass(commands: Command[]) {
  const moveCommand = commands.find((command) => command.type === 'move');
  if (moveCommand?.type !== 'move') {
    return styles.swim;
  }

  if (moveCommand.motion === 'jump') {
    return styles.jump;
  }

  if (moveCommand.motion === 'spin') {
    return styles.spin;
  }

  return styles.swim;
}

export function DisplayScreen() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [status, setStatus] = useState('接続中');

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const nextCreatures = await fetchCreatures();
        if (isActive) {
          setCreatures(nextCreatures.slice(-MAX_CREATURES));
          setStatus('受信中');
        }
      } catch {
        if (isActive) {
          setStatus('API待機中');
        }
      }
    };

    void load();
    const timer = window.setInterval(load, 2000);

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, []);

  const positionedCreatures = useMemo<PositionedCreature[]>(
    () =>
      creatures.map((creature) => {
        const seed = hash(creature.id);
        return {
          ...creature,
          top: 12 + (seed % 68),
          delay: -1 * (seed % 20),
          duration: getSpeed(creature.commands),
          size: 96 + (seed % 56),
        };
      }),
    [creatures],
  );

  return (
    <section className={styles.screen} aria-label="投影用大画面">
      <div className={styles.hud}>
        <p className={styles.title}>プログラミング体験会</p>
        <p className={styles.status}>
          {status} {creatures.length} / {MAX_CREATURES}
        </p>
      </div>
      <div className={styles.sea}>
        {positionedCreatures.map((creature) => {
          const sayText = getSayText(creature.commands);
          return (
            <div
              key={creature.id}
              className={`${styles.creature} ${getMotionClass(creature.commands)}`}
              style={{
                top: `${creature.top}%`,
                width: `${creature.size}px`,
                animationDuration: `${creature.duration}s`,
                animationDelay: `${creature.delay}s`,
              }}
            >
              {sayText !== '' ? <p className={styles.bubble}>{sayText}</p> : null}
              <img src={creature.imageUrl} alt="" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
