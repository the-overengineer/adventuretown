export enum Size {
  Minuscule,
  Tiny,
  Small,
  Modest,
  Average,
  Large,
  Bustling,
  Huge,
}

export enum Prosperity {
  DirtPoor,
  Poor,
  Decent,
  Average,
  WellOff,
  Rich,
}

export enum Equality {
  GeneralSlavery,
  RacialSlavery,
  GenderInequality,
  IncomeInequality,
  Stratified,
  Equal,
}

export enum Fortification {
  None,
  Ditch,
  Palisade,
  Walls,
  MoatAndCastle,
}

export enum Gender {
  Male,
  Female,
}

export enum Profession {
  BarWorker,
  Guard,
  Farmer,
  Trader,
  Politician,
}

export enum ProfessionLevel {
  Entry,
  Medium,
  Leadership,
}

export type OneToTen = number & { _oneToTen: never };
export type ID = number & { _i: never };

export type CharacterFlag =
  | 'alive'
  | 'dead'
  ;

export type WorldFlag =
  | 'this'
  | 'that'
  ;

export interface IUserSettings {
  pauseOnEvents: boolean;
  autoSave: boolean;
}

export interface ITownSettings {
  name: string;
  size: Size;
  prosperity: Prosperity;
  equality: Equality;
  fortification: Fortification;
}

export interface IResources {
  coin: number;
  food: number;
  renown: number;
}

export interface ICharacter {
  name: string;
  gender: Gender;
  physical: OneToTen;
  intelligence: OneToTen;
  education: OneToTen;
  charm: OneToTen;
  profession?: Profession;
  professionLevel?: ProfessionLevel;
  isPregnant: boolean;
}

export interface IRelationships {
  spouse?: ICharacter;
  lover?: ICharacter;
  children: ICharacter[];
}

export interface IGameAction {
  text: string;
  condition: (state: IGameState) => boolean;
  perform: (state: IGameState) => IGameState;
}

export interface IEvent {
  id: ID;
  /**
   * Mean amount of seconds that need to pass for an event to happen
   */
  meanTimeToHappen: boolean;
  condition: (state: IGameState) => boolean;
  title: string;
  getText: (state: IGameState) => boolean;
  actions: IGameAction[];
}

export interface IQueuedEvent {
  id: ID;
  meanTimeToHappen: boolean; // Duplicated for easier lookup
  queuedAt: number;
}

export interface ICharacterFlags {
  [key: string]: boolean;
}

export interface IWorldFlags {
  [key: string]: boolean;
}

export interface IGameState {
  settings: IUserSettings;
  town: ITownSettings;
  resources: IResources;
  character: ICharacter;
  relationships: IRelationships;
  eventQueue: IQueuedEvent[];
  activeEvent?: ID;
  characterFlags: Partial<ICharacterFlags>;
  worldFlags: Partial<IWorldFlags>;
}
