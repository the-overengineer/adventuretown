import {
  Gender,
  ICharacter,
  IGameState,
  OneToTen,
  Profession,
  ProfessionLevel,
} from 'types/state';
import { pickOne, inIntRange } from './random';
import { getAge } from './time';
import { isOppressed } from './town';

const boyNames = ['Arnold', 'Geoff', 'Eirich', 'Mark', 'Elron', 'Marr'];
const girlNames = ['Rose', 'Aerin', 'Elisabeth', 'Zaira', 'Leona', 'Jasmine'];

const generateStat = () => inIntRange(1, 6) as OneToTen;

export const generateCharacter = (dayOfBirth: number, fixedGender?: Gender): ICharacter => {
  const gender = fixedGender ?? pickOne([Gender.Male, Gender.Female]);
  const name = gender === Gender.Male ? pickOne(boyNames) : pickOne(girlNames);

  return {
    name,
    gender,
    dayOfBirth,
    physical: generateStat(),
    intelligence: generateStat(),
    education: generateStat(),
    charm: generateStat(),
  };
};

export const createChild = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    children: [...state.relationships.children, generateCharacter(state.daysPassed)],
  },
});

export const createNonBabyChild = (state: IGameState): IGameState => {
  const ageInYears = inIntRange(3, 14);
  const birthDay = state.daysPassed - ageInYears * 365;
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: [...state.relationships.children, generateCharacter(birthDay)],
    },
  };
};

type Stat = 'physical' | 'intelligence' | 'education' | 'charm';

export const changeStat = (stat: Stat, by: number) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    [stat]: Math.max(0, Math.min(10, state.character[stat] + by)),
  },
});

export const removeLastChild = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    children: state.relationships.children.slice(0, state.relationships.children.length - 1),
  },
});

export const removeRandomChild = (state: IGameState): IGameState => {
  const child = pickOne(state.relationships.children);
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: state.relationships.children.filter((it) => it !== child),
    },
  };
};


export const newCharacter = (state: IGameState): IGameState => ({
  ...state,
  character: undefined as any,
  characterFlags: {},
  resources: {
    coin: 10,
    food: 10,
    renown: 0,
  },
  relationships: {
    children: [],
  },
});

export const eldestInherits = (keepResources: boolean = true) => (state: IGameState): IGameState => {
  const eldest = state.relationships.children[0];
  const resources = {
    coin: keepResources ? state.resources.coin : 0,
    food: keepResources ? state.resources.food : 0,
    renown: Math.floor(state.resources.renown / 2), // keep half the fame of your parent
  };

  return {
    ...state,
    character: eldest,
    characterFlags: {},
    relationships: {
      children: [],
    },
    resources,
  };
};

export const addSpouse = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: generateCharacter(state.daysPassed - 18 * 365, state.character.gender === Gender.Male ? Gender.Female : Gender.Male),
  },
});

export const removeSpouse = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: undefined,
  },
});

export const startJob = (profession: Profession) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession,
    professionLevel: ProfessionLevel.Entry,
  },
});

export const removeJob =  (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession: undefined,
    professionLevel: undefined,
  },
});

export const setLevel = (professionLevel: ProfessionLevel) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    professionLevel,
  },
});

export const employSpouse = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: {
      ...state.relationships.spouse!,
      profession: pickOne([Profession.BarWorker, Profession.Farmer, Profession.Trader]),
      professionLevel: ProfessionLevel.Entry,
    },
  },
});

export const fireSpouse = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: {
      ...state.relationships.spouse!,
      profession: undefined,
      professionLevel: undefined,
    },
  },
});

export const setSpouseProfessionLevel = (professionLevel: ProfessionLevel) => (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: {
      ...state.relationships.spouse!,
      professionLevel,
    },
  },
});

export const isEmployable = (state: IGameState, character: ICharacter): boolean =>
  !isOppressed(state, character)
    && getAge(character.dayOfBirth, state.daysPassed) >= 14
    && character.profession == null;

export const findEmployableChild = (state: IGameState): ICharacter | undefined =>
  state.relationships.children.find((child) => isEmployable(state, child));

export const findFireableChild = (state: IGameState): ICharacter | undefined =>
  state.relationships.children.find((child) => child.profession != null);

export const employChild = (state: IGameState, child: ICharacter): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    children: state.relationships.children.map((c) => c === child ? ({
      ...c,
      profession: pickOne([Profession.BarWorker, Profession.Farmer, Profession.Trader]),
      professionLevel: ProfessionLevel.Entry,
    }) : c)
  },
});

export const fireChild = (state: IGameState, child: ICharacter): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    children: state.relationships.children.map((c) => c === child ? ({
      ...c,
      profession: undefined,
      professionLevel: undefined,
    }) : c)
  },
});

export const hireEmployableChild = (state: IGameState): IGameState => {
  const child = findEmployableChild(state);
  return child != null ? employChild(state, child) : state;
}

export const fireFireableChild = (state: IGameState): IGameState => {
  const child = findFireableChild(state);
  return child != null ? fireChild(state, child) : state;
}

export const hasFixedIncome = (character: ICharacter) =>
  character.profession == null || new Set([Profession.Guard, Profession.Politician]).has(character.profession);

export const hasSmallChild = (state: IGameState): boolean =>
  state.relationships.children.some((child) => getAge(child.dayOfBirth, state.daysPassed) < 3);
