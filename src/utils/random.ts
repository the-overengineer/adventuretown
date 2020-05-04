export const pickOne = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export const inIntRange = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));
