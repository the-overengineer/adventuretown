import { ICharacter, Gender, OneToTen, IGameState } from 'types/state';
import { pickOne } from './random';

const boyNames = ['Arnold', 'Geoff', 'Eirich', 'Mark', 'Elron', 'Marr'];
const girlNames = ['Rose', 'Aerin', 'Elisabeth', 'Zaira', 'Leona', 'Jasmine'];

const generateStat = () => Math.floor(Math.random() * 5) as OneToTen;

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

export const newCharacter = (state: IGameState): IGameState => ({
  ...state,
  character: undefined as any,
  characterFlags: {},
  resources: {
    coin: 0,
    food: 0,
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
