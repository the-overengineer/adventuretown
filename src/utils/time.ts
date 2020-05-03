const STARTING_AGE = 18;

export const getAge = (daysPassed: number): number =>
  STARTING_AGE + Math.floor(daysPassed / 365);