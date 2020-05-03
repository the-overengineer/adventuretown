
export const getAge = (dayOfBirth: number, daysPassed: number): number =>
  Math.floor((daysPassed - dayOfBirth) / 365);