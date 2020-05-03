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

export const createLover = (gender: Gender) => (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    lover: generateCharacter(state.daysPassed, gender), // Technically makes them a baby, but whatever
  },
});
