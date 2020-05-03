import { IGameState, GenderEquality, Gender, ClassEquality, ICharacter } from 'types/state';

export const isOppressed = (state: IGameState, character: ICharacter): boolean => {
  const { town, resources } = state;
  if (town.genderEquality === GenderEquality.FemaleOppression && character.gender === Gender.Female) {
    return true;
  }

  if (town.genderEquality === GenderEquality.MaleOppression && character.gender === Gender.Male) {
    return true;
  }

  if (town.equality === ClassEquality.GeneralSlavery && resources.coin < 10) {
    return true;
  }

  return false;
};

export const hasLimitedRights = (state: IGameState, character: ICharacter): boolean => {
  const { town, resources } = state;

  if (character.gender === Gender.Male) {
    if ([GenderEquality.FemaleDominance, GenderEquality.MaleOppression].includes(town.genderEquality)) {
      return true;
    }
  }

  if (character.gender === Gender.Female) {
    if ([GenderEquality.MaleDominance, GenderEquality.FemaleOppression].includes(town.genderEquality)) {
      return true;
    }
  }

  const classInequal = [
    ClassEquality.GeneralSlavery,
    ClassEquality.RacialSlavery,
    ClassEquality.IncomeInequality,
  ];

  if (resources.coin < 100 && classInequal.includes(town.equality)) {
    return true;
  }

  return false;
};
