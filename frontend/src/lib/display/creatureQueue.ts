type HasId = { id: string };

export type AddCreatureResult<T extends HasId> = {
  creatures: T[];
  /** 上限を超えたため画面から取り除く作品（古い順） */
  removed: T[];
};

/** 作品を末尾に追加し、上限を超えた分を古い順（先に届いた順）に取り除く */
export const addCreature = <T extends HasId>(
  current: T[],
  creature: T,
  maxCreatures: number,
): AddCreatureResult<T> => {
  // 再接続などで同じ通知が届いても二重に表示しない
  if (current.some(({ id }) => id === creature.id)) {
    return { creatures: current, removed: [] };
  }

  const next = [...current, creature];
  const overflow = Math.max(0, next.length - maxCreatures);

  return { creatures: next.slice(overflow), removed: next.slice(0, overflow) };
};
