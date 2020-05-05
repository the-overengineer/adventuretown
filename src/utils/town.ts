import {
  ClassEquality,
  Gender,
  GenderEquality,
  ICharacter,
  IGameState,
  Prosperity,
  Size,
  Fortification,
} from 'types/state';

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
    ClassEquality.IncomeInequality,
  ];

  if (resources.coin < 100 && classInequal.includes(town.equality)) {
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
