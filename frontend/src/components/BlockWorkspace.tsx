import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import * as ja from 'blockly/msg/ja';
import 'blockly/blocks';
import styles from './BlockWorkspace.module.css';

Blockly.setLocale(ja as unknown as Record<string, string>);

type BlockWorkspaceProps = {
  onWorkspaceChange?: (workspaceJson: Record<string, unknown>) => void;
};

const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'ろんり',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'くりかえし',
      colour: '120',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
      ],
    },
    {
      kind: 'category',
      name: 'すうじ',
      colour: '230',
      contents: [{ kind: 'block', type: 'math_number' }],
    },
    {
      kind: 'category',
      name: 'もじ',
      colour: '160',
      contents: [{ kind: 'block', type: 'text' }],
    },
  ],
};

export function BlockWorkspace({ onWorkspaceChange }: BlockWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onWorkspaceChangeRef = useRef(onWorkspaceChange);

  useEffect(() => {
    onWorkspaceChangeRef.current = onWorkspaceChange;
  }, [onWorkspaceChange]);

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const workspace = Blockly.inject(container, { toolbox: TOOLBOX });

    const handleChange = () => {
      const json = Blockly.serialization.workspaces.save(workspace);
      onWorkspaceChangeRef.current?.(json);
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
