import {
  Gender,
  ICharacter,
  IGameState,
  OneToTen,
  Profession,
  ProfessionLevel,
} from 'types/state';
import { compose, stableSort } from './functional';
import {
  inIntRange,
  pickOne,
} from './random';
import { setCharacterFlag } from './setFlag';
import { getAge } from './time';
import { isOppressed, isGenderOppressed } from './town';

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

export const insertChild = (child: ICharacter) => (state: IGameState): IGameState => {
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: stableSort(
        [...state.relationships.children, child],
        (first, second) => first.dayOfBirth - second.dayOfBirth,
      )
    },
  };
};


type Stat = 'physical' | 'intelligence' | 'education' | 'charm';


export const changeCharacterState = (stat: Stat, by: number) => (character: ICharacter): ICharacter => ({
  ...character,
  [stat]: Math.max(0, Math.min(10, character[stat] + by)),
})

export const changeStat = (stat: Stat, by: number) => (state: IGameState): IGameState => ({
  ...state,
  character: changeCharacterState(stat, by)(state.character)
});

export const changeSpouseStat = (stat: Stat, by: number) => (state: IGameState): IGameState => {
  if (state.relationships.spouse == null) {
    return state;
  }

  return {
    ...state,
    relationships: {
      ...state.relationships,
      spouse: {
        ...state.relationships.spouse!,
        [stat]: Math.max(0, Math.min(10, state.relationships.spouse![stat] + by)),
      }
    },
  };
}

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

export const removeChild = (child: ICharacter) => (state: IGameState): IGameState => {
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: state.relationships.children.filter((it) => it.name !== child.name && it.dayOfBirth !== child.dayOfBirth),
    },
  };
};


export const marryOffRandomChild = (state: IGameState): IGameState => {
  const child = pickOne(state.relationships.children.filter((it) => isOppressed(state, it) && getAge(it.dayOfBirth, state.daysPassed) >= 14));
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: state.relationships.children.filter((it) => it !== child),
    },
  };
};

export const changeRandomChildStat = (state: IGameState, stat: 'physical' | 'intelligence' | 'education' | 'charm', by: number): IGameState => {
  const child = pickOne(state.relationships.children.filter((it) => isOppressed(state, it) && getAge(it.dayOfBirth, state.daysPassed) >= 14));
  return {
    ...state,
    relationships: {
      ...state.relationships,
      children: state.relationships.children.map((it) => it === child ? ({ ...it, [stat]: Math.max(0, Math.min(10, it[stat] + by)) }) : it),
    },
  };
};


export const newCharacter = (state: IGameState): IGameState => ({
  ...state,
  character: undefined as any,
  characterFlags: {},
  resources: {
    coin: 10,
    food: 25,
    renown: 0,
  },
  relationships: {
    children: [],
  },
  tmp: new Map(),
});

export const eldestInherits = (keepResources: boolean = true) => (state: IGameState): IGameState => {
  const eldest = state.relationships.children[0];
  const part = Math.max(state.relationships.children.filter(child => !isGenderOppressed(state, child)).length, 1);
  const resources = {
    coin: keepResources ? Math.floor(state.resources.coin / part) : 0,
    food: keepResources ? Math.floor(state.resources.food / part) : 0,
    renown: Math.floor(state.resources.renown / 10), // keep percentage of fame of parent
  };

  return {
    ...state,
    character: eldest,
    characterFlags: {},
    relationships: {
      children: [],
    },
    resources,
    tmp: new Map(),
  };
};

export const addSpouse = (state: IGameState): IGameState => {
  const yourDateOfBirth = state.character.dayOfBirth;
  const offsetByFiveYears = 365 * inIntRange(-5, 5);
  const minBirthDay = state.daysPassed - 16 * 365; // Minimum age is 16
  const bornOn = Math.min(offsetByFiveYears + yourDateOfBirth, minBirthDay);
  return {
    ...state,
    relationships: {
      ...state.relationships,
      spouse: generateCharacter(bornOn, state.character.gender === Gender.Male ? Gender.Female : Gender.Male),
    },
  };
}

export const removeSpouse = (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: undefined,
  },
  characterFlags: {
    ...state.characterFlags,
    spouseLove: undefined,
    spouseResent: undefined,
  },
});

export const startJob = (profession: Profession, professionLevel: ProfessionLevel = ProfessionLevel.Entry) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession,
    professionLevel,
  },
  characterFlags: profession !== state.character.profession ? {
    ...state.characterFlags,
    jobNeglect: undefined,
    onMerchantAdventure: undefined,
    preparingMerchantAdventure: undefined,
  } : state.characterFlags,
});

export const removeJob =  (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    profession: undefined,
    professionLevel: undefined,
  },
  characterFlags: {
    ...state.characterFlags,
    jobNeglect: undefined,
    onMerchantAdventure: undefined,
    preparingMerchantAdventure: undefined,
  },
});

export const setLevel = (professionLevel: ProfessionLevel) => (state: IGameState): IGameState => ({
  ...state,
  character: {
    ...state.character,
    professionLevel,
  },
});

export const employSpouse = (profession?: Profession) => (state: IGameState): IGameState => ({
  ...state,
  relationships: {
    ...state.relationships,
    spouse: {
      ...state.relationships.spouse!,
      profession: profession ?? pickOne([Profession.BarWorker, Profession.Farmer, Profession.Trader]),
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

export const isInCouncil = (state: IGameState): boolean =>
  state.character.profession === Profession.Politician && state.character.professionLevel === ProfessionLevel.Leadership;

const spouseLovesYou = compose(setCharacterFlag('spouseLove'), setCharacterFlag('spouseResent', false));
const spouseResentsYou = compose(setCharacterFlag('spouseLove', false), setCharacterFlag('spouseResent'));
const cleanSlate = compose(setCharacterFlag('spouseLove', false), setCharacterFlag('spouseResent', false));
export const improveSpouseRelationship = (state: IGameState) => {
  if (state.relationships.spouse == null) {
    return state;
  }

  if (state.characterFlags.spouseResent!) {
    return cleanSlate(state);
  } else if (!state.characterFlags.spouseLove) {
    return spouseLovesYou(state);
  } else {
    return state;
  }
};

export const worsenSpouseRelationship = (state: IGameState) => {
  if (state.characterFlags.spouseLove!) {
    return cleanSlate(state);
  } else if (!state.characterFlags.spouseResent) {
    return spouseResentsYou(state);
  } else {
    return state;
  }
};

export const isAdult = (state: IGameState, character: ICharacter) => getAge(character.dayOfBirth, state.daysPassed) >= 14;

export const flipGender = (gender: Gender) => gender === Gender.Male ? Gender.Female : Gender.Male;

export const generateLoverDescription = (state: IGameState, otherGender: boolean = true): string => {
  const ownGender = state.character.gender;
  const gender = otherGender ? flipGender(ownGender) : ownGender;
  const pronoun = gender === Gender.Male ? 'He' : 'She';
  const possessive = gender === Gender.Male ? 'his' : 'her';
  const height = pickOne(['short', 'of average height', 'tall']);
  const build = pickOne(['slim', 'of average build', 'fit', 'muscled', 'fat', 'well-proportioned']);
  const face = gender === Gender.Male
    ? pickOne(['is bearded', 'is clean-shaven', 'has an aquiline face', 'has a bloated face', 'has an average-looking face', 'is exceedingly handsome'])
    : pickOne(['is full-lipped', 'has a beautiful face', 'has an average-looking face', 'has a worn and unattractive face']);
  const approach = pickOne(['confident', 'shy', 'jovial', 'direct', 'flirty']);
  const hairColor = pickOne(['dark', 'blonde', 'drab brown', 'strawberry blonde', 'red']);
  const eyeColor = pickOne(['brown', 'dark', 'blue', 'green', 'grey']);
  const intelligence = pickOne(['somewhat dull', 'of average intelligence', 'quick of mind', 'exceedingly intelligent'])

  let baseDescription = `${pronoun} is ${height} and ${build}, with ${hairColor} hair and ${eyeColor} eyes. You note that ${pronoun.toLocaleLowerCase()} ${face}.
    ${pronoun} is quite ${approach} in ${possessive} interaction with you, and you have an impression that ${pronoun.toLocaleLowerCase()} is ${intelligence}.`;

  if (Math.random() < 0.25) {
    baseDescription += ` You can see some marks of an old disease on ${possessive} face.`;
  }

  if (Math.random() < 0.25) {
    baseDescription += ` Many of ${possessive} teeth are missing`;
  } else if (Math.random() < 0.25) {
    baseDescription += ` You can note that ${possessive} teeth are especially well-maintained.`;
  }

  if (Math.random() < 0.25) {
    baseDescription += ` ${pronoun} is exceedingly well-dressed and ${possessive} clothes are fashionable.`
  } else if (Math.random() < 0.3) {
    baseDescription += ` ${pronoun} is wearing dull and ill-fitting clothing.`;
  } else {
    baseDescription += ` ${pronoun} is wearing typical clothings for somebody in ${state.town.name}, not standing out from the crowd with that.`
  }

  return baseDescription;
};