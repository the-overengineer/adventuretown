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
