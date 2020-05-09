import {
  ClassEquality,
  Gender,
  GenderEquality,
  ICharacter,
  IGameState,
  Prosperity,
  Size,
  Fortification,
  Taxation,
} from 'types/state';
import { pickOne } from './random';

const classInequal = [
  ClassEquality.GeneralSlavery,
  ClassEquality.IncomeInequality,
];

export const isGenderOppressed = (state: IGameState, character: ICharacter): boolean => {
  const { town } = state;
  if (town.genderEquality === GenderEquality.FemaleOppression && character.gender === Gender.Female) {
    return true;
  }

  if (town.genderEquality === GenderEquality.MaleOppression && character.gender === Gender.Male) {
    return true;
  }

  return false;
}

export const isOppressed = (state: IGameState, character: ICharacter): boolean => {
  const { town, resources, finances } = state;
  if (isGenderOppressed(state, character)) {
    return true;
  }

  if (classInequal.includes(town.equality) && resources.coin < 100 && (finances.coinIncome - finances.coinExpenses < 1)) {
    return true;
  }

  return false;
};

export const hasLimitedRights = (state: IGameState, character: ICharacter): boolean => {
  const { town, resources, finances } = state;

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

  if (resources.coin < 250 && classInequal.includes(town.equality) && (finances.coinIncome - finances.coinExpenses < 2)) {
    return true;
  }

  return false;
};

export const decreaseProsperity = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    prosperity: Math.max(Prosperity.DirtPoor, state.town.prosperity - 1),
  },
});

export const increaseProsperity = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    prosperity: Math.min(Prosperity.Rich, state.town.prosperity + 1),
  },
});

export const decreaseSize = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    size: Math.max(Size.Minuscule, state.town.size - 1),
  },
});

export const increaseSize = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    size: Math.min(Size.Huge, state.town.size + 1),
  },
});

export const decreaseFortifications = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    fortification: Math.max(Fortification.None, state.town.fortification - 1),
  },
});

export const increaseFortifications = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    fortification: Math.min(Fortification.MoatAndCastle, state.town.fortification + 1),
  },
});

export const decreaseClassEquality = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    equality: Math.max(ClassEquality.GeneralSlavery, state.town.equality - 1),
  },
});

export const increaseClassEquality = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    equality: Math.min(ClassEquality.Equal, state.town.equality + 1),
  },
});

export const equaliseGenderRights = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    genderEquality: state.town.genderEquality < GenderEquality.Equal ? state.town.genderEquality + 1 : state.town.genderEquality - 1,
  },
});

export const increaseMaleRights = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    genderEquality: Math.max(GenderEquality.FemaleOppression, state.town.genderEquality - 1),
  },
});

export const increaseFemaleRights = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    genderEquality: Math.min(GenderEquality.MaleOppression, state.town.genderEquality + 1),
  },
});

export const increaseMyGenderRights = (state: IGameState): IGameState =>
  state.character.gender === Gender.Male
    ? increaseMaleRights(state)
    : increaseFemaleRights(state);

export const setTaxation = (taxation: Taxation) => (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    taxation,
  },
});

export const setRandomGovernment = (state: IGameState): IGameState => ({
  ...state,
  town: {
    ...state.town,
    equality: pickOne([ClassEquality.Equal, ClassEquality.GeneralSlavery, ClassEquality.IncomeInequality, ClassEquality.Stratified]),
    genderEquality: pickOne([GenderEquality.Equal, GenderEquality.FemaleDominance, GenderEquality.FemaleOppression, GenderEquality.MaleDominance, GenderEquality.MaleOppression]),
    taxation: pickOne([Taxation.Flat, Taxation.None, Taxation.Percentage]),
  },
});
