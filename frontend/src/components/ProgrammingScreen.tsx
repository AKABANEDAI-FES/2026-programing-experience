import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as Ja from 'blockly/msg/ja';
import type { Command, DrawMode, MotionType, SpeedType } from 'shared';
import { MAX_COMMANDS } from 'shared';
import { releaseCreature } from '../api';
import styles from './ProgrammingScreen.module.css';

const jaLocale = { ...(Ja as unknown as Record<string, string>) };
delete (jaLocale as Record<string, unknown>).default;

type ProgrammingScreenProps = {
  mode: DrawMode;
  imageData: string;
  fallbackCommands: Command[];
  onReleased: () => void;
};

const blockTypes = ['fes_move', 'fes_speed', 'fes_say'];

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'うごき',
      colour: '#1c7ed6',
      contents: [
        { kind: 'block', type: 'fes_move' },
        { kind: 'block', type: 'fes_speed' },
      ],
    },
    {
      kind: 'category',
      name: 'セリフ',
      colour: '#f08c00',
      contents: [{ kind: 'block', type: 'fes_say' }],
    },
  ],
};

let blocksDefined = false;

function defineBlocks() {
  if (blocksDefined) {
    return;
  }

  Blockly.setLocale(jaLocale);
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'fes_move',
      message0: '%1 うごく',
      args0: [
        {
          type: 'field_dropdown',
          name: 'MOTION',
          options: [
            ['すいすい泳ぐ', 'swim'],
            ['ぴょんとはねる', 'jump'],
            ['くるっと回る', 'spin'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: 'キャラクターの動きを選びます',
    },
    {
      type: 'fes_speed',
      message0: '速さを %1 にする',
      args0: [
        {
          type: 'field_dropdown',
          name: 'SPEED',
          options: [
            ['ゆっくり', 'slow'],
            ['ふつう', 'normal'],
            ['はやい', 'fast'],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 150,
      tooltip: '投影画面で動く速さを変えます',
    },
    {
      type: 'fes_say',
      message0: '%1 と言う',
      args0: [
        {
          type: 'field_input',
          name: 'TEXT',
          text: 'こんにちは',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 35,
      tooltip: '吹き出しに出す言葉を決めます',
    },
  ]);
  blocksDefined = true;
}

function collectBlocks(workspace: Blockly.WorkspaceSvg) {
  const orderedBlocks: Blockly.Block[] = [];

  for (const topBlock of workspace.getTopBlocks(true)) {
    let currentBlock: Blockly.Block | null = topBlock;
    while (currentBlock !== null) {
      if (blockTypes.includes(currentBlock.type)) {
        orderedBlocks.push(currentBlock);
      }
      currentBlock = currentBlock.getNextBlock();
    }
  }

  return orderedBlocks;
}

function blockToCommand(block: Blockly.Block): Command | null {
  if (block.type === 'fes_move') {
    return {
      type: 'move',
      motion: block.getFieldValue('MOTION') as MotionType,
    };
  }

  if (block.type === 'fes_speed') {
    return {
      type: 'speed',
      value: block.getFieldValue('SPEED') as SpeedType,
    };
  }

  if (block.type === 'fes_say') {
    return {
      type: 'say',
      text: String(block.getFieldValue('TEXT')).slice(0, 24),
    };
  }

  return null;
}

function workspaceToCommands(workspace: Blockly.WorkspaceSvg) {
  return collectBlocks(workspace)
    .map(blockToCommand)
    .filter((command): command is Command => command !== null);
}

export function ProgrammingScreen({
  mode,
  imageData,
  fallbackCommands,
  onReleased,
}: ProgrammingScreenProps) {
  const blocklyElementRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [commands, setCommands] = useState<Command[]>(fallbackCommands);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const element = blocklyElementRef.current;
    if (element === null) {
      return undefined;
    }

    defineBlocks();

    const workspace = Blockly.inject(element, {
      toolbox,
      trashcan: true,
      grid: {
        spacing: 24,
        length: 2,
        colour: '#d8e4e0',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: false,
        startScale: 0.9,
        maxScale: 1.2,
        minScale: 0.7,
      },
    });

    workspaceRef.current = workspace;

    const updateCommands = () => {
      const nextCommands = workspaceToCommands(workspace);
      setCommands(nextCommands.slice(0, MAX_COMMANDS));
      setError(
        nextCommands.length > MAX_COMMANDS ? `ブロックは最大${MAX_COMMANDS}個までです。` : '',
      );
    };

    workspace.addChangeListener(updateCommands);
    const handleResize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', handleResize);
    updateCommands();

    return () => {
      window.removeEventListener('resize', handleResize);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);

  const handleRelease = async () => {
    const workspace = workspaceRef.current;
    const nextCommands = workspace === null ? commands : workspaceToCommands(workspace);

    if (nextCommands.length === 0) {
      setError('ブロックを1つ以上置いてください。');
      return;
    }

    if (nextCommands.length > MAX_COMMANDS) {
      setError(`ブロックは最大${MAX_COMMANDS}個までです。`);
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await releaseCreature({
        mode,
        image_base64: imageData,
        commands: nextCommands,
      });

      if (response.success) {
        onReleased();
        return;
      }

      setError(response.message);
    } catch {
      setError('APIサーバーに送信できませんでした。');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className={styles.screen} aria-labelledby="programming-title">
      <div className={styles.header}>
        <div>
          <p className={styles.label}>プログラミング</p>
          <h1 id="programming-title" className={styles.title}>
            動きとセリフを決める
          </h1>
        </div>
        <button
          type="button"
          className={styles.releaseButton}
          disabled={isSending}
          onClick={handleRelease}
        >
          {isSending ? '送信中' : '放流する'}
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.blocklyShell}>
          <div ref={blocklyElementRef} className={styles.blockly} />
        </div>
        <aside className={styles.preview} aria-label="送信内容の確認">
          <img
            className={styles.creaturePreview}
            src={imageData}
            alt="描いたキャラクターのプレビュー"
          />
          <div className={styles.counter}>
            {commands.length} / {MAX_COMMANDS}
          </div>
          <ul className={styles.commandList}>
            {commands.map((command, index) => (
              <li key={`${command.type}-${index}`}>
                {command.type === 'move' ? `うごき: ${command.motion}` : null}
                {command.type === 'speed' ? `速さ: ${command.value}` : null}
                {command.type === 'say' ? `セリフ: ${command.text}` : null}
              </li>
            ))}
          </ul>
          {error !== '' ? <p className={styles.error}>{error}</p> : null}
        </aside>
      </div>
    </section>
  );
}
