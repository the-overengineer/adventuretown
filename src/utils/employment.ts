import { ICharacter, Profession, ProfessionLevel, Gender } from 'types/state';

type GenderMapping<T> = {
  [key in Gender]: T;
}

type ProfessionLevelMapping<T> = {
  [key in ProfessionLevel]: T | GenderMapping<T>;
}

type ProfessionMapping<T> = {
  [key in Profession]: ProfessionLevelMapping<T>;
}

const isGenderMapping = <T>(it: any): it is GenderMapping<T> =>
  it && it[Gender.Male] != null && it[Gender.Female] != null;

export const getProfessionMap = <T>(descriptor: ProfessionMapping<T>, defaultValue: T) => (character: ICharacter): T => {
  if (character.profession == null || character.professionLevel == null) {
    return defaultValue;
  }

  try {
    const descriptionOrGenderMap = descriptor[character.profession!][character.professionLevel!];
    if (isGenderMapping(descriptionOrGenderMap)) {
      return descriptionOrGenderMap[character.gender];
    } else {
      return descriptionOrGenderMap;
    }
  } catch (error) {
    console.warn('Employment mapping failed:');
    console.error(error);

    return defaultValue;
  }
}

export const describeJob = getProfessionMap<string>({
  [Profession.BarWorker]: {
    [ProfessionLevel.Entry]: { [Gender.Male]: 'Waiter', [Gender.Female]: 'Waitress' },
    [ProfessionLevel.Medium]: { [Gender.Male]: 'Bartender', [Gender.Female]: 'Barmaid' },
    [ProfessionLevel.Leadership]: 'Tavern Owner',
  },
  [Profession.Farmer]: {
    [ProfessionLevel.Entry]: 'Farm Hand',
    [ProfessionLevel.Medium]: 'Farmer',
    [ProfessionLevel.Leadership]: 'Landowner',
  },
  [Profession.Guard]: {
    [ProfessionLevel.Entry]: 'Recruit',
    [ProfessionLevel.Medium]: { [Gender.Male]: 'Guardsman', [Gender.Female]: 'Guardswoman' },
    [ProfessionLevel.Leadership]: 'Guard Captain',
  },
  [Profession.Trader]: {
    [ProfessionLevel.Entry]: { [Gender.Male]: 'Salesman', [Gender.Female]: 'Saleswoman' },
    [ProfessionLevel.Medium]: 'Shopkeep',
    [ProfessionLevel.Leadership]: 'Merchant',
  },
  [Profession.Politician]: {
    [ProfessionLevel.Entry]: 'Town Clerk',
    [ProfessionLevel.Medium]: 'Official',
    [ProfessionLevel.Leadership]: { [Gender.Male]: 'Councilman', [Gender.Female]: 'Councilwoman' },
  },
}, 'Unemployed');
