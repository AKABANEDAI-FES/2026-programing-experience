import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import * as ja from 'blockly/msg/ja';
import type { Command } from 'shared';
import { MAX_COMMANDS } from 'shared';
import { defineCommandBlocks } from '../lib/blockly/blocks';
import { TOOLBOX } from '../lib/blockly/toolbox';
import { workspaceToCommands } from '../lib/blockly/workspaceToCommands';
import styles from './BlockWorkspace.module.css';

Blockly.setLocale(ja as unknown as Record<string, string>);
defineCommandBlocks();

type BlockWorkspaceProps = {
  onCommandsChange?: (commands: Command[]) => void;
};

export function BlockWorkspace({ onCommandsChange }: BlockWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCommandsChangeRef = useRef(onCommandsChange);

  useEffect(() => {
    onCommandsChangeRef.current = onCommandsChange;
  }, [onCommandsChange]);

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const workspace = Blockly.inject(container, {
      toolbox: TOOLBOX,
      maxBlocks: MAX_COMMANDS,
      trashcan: true,
    });

    const handleChange = () => {
      const json = Blockly.serialization.workspaces.save(workspace);
      onCommandsChangeRef.current?.(workspaceToCommands(json));
    };
    workspace.addChangeListener(handleChange);

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      workspace.removeChangeListener(handleChange);
      workspace.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.workspace}
      aria-label="ブロックプログラミングのワークスペース"
    />
  );
}
