import { useCallback, useEffect, useRef, useState } from 'react';
import type { Creature } from 'shared';
import {
  CREATURE_HEIGHT,
  CREATURE_WIDTH,
  createMotion,
  stepMotion,
  toVisual,
  type CreatureMotion,
} from '../../lib/display/creatureMotion.ts';
import { useCreatureStream } from './useCreatureStream.ts';
import styles from './DisplayPage.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';
const MAX_DELTA_MS = 100;

type CreatureNode = {
  root: HTMLDivElement;
  image: HTMLImageElement;
  bubble: HTMLParagraphElement;
};

const toImageUrl = (imageUrl: string): string =>
  imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}/api/images/${imageUrl}`;

export function DisplayPage() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const motions = useRef(new Map<string, CreatureMotion>());
  const commands = useRef(new Map<string, Creature['commands']>());
  const nodes = useRef(new Map<string, CreatureNode>());

  const handleCreature = useCallback((creature: Creature) => {
    const bounds = { width: window.innerWidth, height: window.innerHeight };

    motions.current.set(creature.id, createMotion(bounds));
    commands.current.set(creature.id, creature.commands);
    setCreatures((previous) => [...previous, creature]);
  }, []);

  const status = useCreatureStream(handleCreature);

  // ref は再描画や StrictMode でも null で呼ばれるため、ここでは DOM の参照だけを管理する。
  // 動きとコマンドは作品が画面から取り除かれるときに消す。
  const registerNode = (id: string) => (root: HTMLDivElement | null) => {
    if (root === null) {
      nodes.current.delete(id);
      return;
    }

    const image = root.querySelector('img');
    const bubble = root.querySelector('p');

    if (image !== null && bubble !== null) {
      nodes.current.set(id, { root, image, bubble });
    }
  };

  useEffect(() => {
    let previous: number | null = null;

    const tick = (now: number) => {
      const delta = previous === null ? 0 : Math.min(now - previous, MAX_DELTA_MS);
      previous = now;

      const bounds = { width: window.innerWidth, height: window.innerHeight };

      for (const [id, node] of nodes.current) {
        const motion = motions.current.get(id);

        if (motion === undefined) {
          continue;
        }

        const creatureCommands = commands.current.get(id) ?? [];
        const nextMotion = stepMotion(motion, creatureCommands, delta, bounds);
        const visual = toVisual(nextMotion, creatureCommands);

        motions.current.set(id, nextMotion);
        node.root.style.transform = `translate3d(${visual.x}px, ${visual.y}px, 0)`;
        node.image.style.transform = `rotate(${visual.rotation}deg) scaleX(${visual.facing})`;
        node.bubble.hidden = visual.sayText === null;
        node.bubble.textContent = visual.sayText;
      }

      frame = requestAnimationFrame(tick);
    };

    let frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className={styles.page} aria-label="大画面モニター">
      {creatures.length === 0 && (
        <p className={styles.waiting}>いきものが やってくるのを まっています</p>
      )}

      {creatures.map((creature) => (
        <div
          key={creature.id}
          ref={registerNode(creature.id)}
          className={styles.creature}
          style={{ width: CREATURE_WIDTH, height: CREATURE_HEIGHT }}
        >
          <p className={styles.bubble} hidden />
          <img className={styles.image} src={toImageUrl(creature.imageUrl)} alt="放流された作品" />
        </div>
      ))}

      {status !== 'open' && (
        <p className={styles.status}>
          {status === 'connecting'
            ? 'サーバーに接続しています…'
            : 'サーバーとの接続が切れました。再接続しています…'}
        </p>
      )}
    </main>
  );
}
