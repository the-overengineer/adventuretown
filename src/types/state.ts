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

export enum ClassEquality {
  GeneralSlavery,
  RacialSlavery,
  IncomeInequality,
  Stratified,
  Equal,
}

export enum GenderEquality {
  FemaleOppression,
  MaleDominance,
  Equal,
  FemaleDominance,
  MaleOppression,
}

export enum Fortification {
  None,
  Ditch,
  Palisade,
  Walls,
  MoatAndCastle,
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum Profession {
  BarWorker = 'BarWorker',
  Guard = 'Guard',
  Farmer = 'Farmer',
  Trader = 'Trader',
  Politician = 'Politician',
}

export enum ProfessionLevel {
  Entry,
  Medium,
  Leadership,
}

export type OneToTen = number & { _oneToTen: never };
export type ID = number & { _i: never };

export type CharacterFlag =
  | 'adventuring'
  | 'equipped'
  | 'focusPhysical'
  | 'focusIntelligence'
  | 'focusEducation'
  | 'focusCharm'
  | 'focusWealth'
  | 'focusFood'
  | 'focusRenown'
  | 'focusFamily'
  | 'focusFun'
  | 'focusCity'
  | 'unknowinglyPregnant'
  | 'pregnant'
  | 'enemiesInHighPlaces'
  | 'friendsInHighPlaces'
  | 'tookBribe'
  | 'lover'
  | 'sickness'
  | 'djinnFound'
  | 'fundedCaravan'
  | 'criminalActivity'
  | 'gardener'
  | 'poet'
  ;

export type WorldFlag =
  | 'pregnantLover'
  | 'pregnantLoverKnown'
  | 'spousePregnant'
  | 'spousePregnantDiscovered'
  | 'sickness'
  | 'blackMarket'
  ;

export interface IUserSettings {
  pauseOnEvents: boolean;
  autoSave: boolean;
}

export interface ITownSettings {
  name: string;
  size: Size;
  prosperity: Prosperity;
  equality: ClassEquality;
  genderEquality: GenderEquality;
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
  dayOfBirth: number;
  profession?: Profession;
  professionLevel?: ProfessionLevel;
}

export interface IRelationships {
  spouse?: ICharacter;
  children: ICharacter[];
}

export interface IGameAction {
  text: string;
  condition?: (state: IGameState) => boolean;
  perform?: (state: IGameState) => IGameState;
}

export interface IEvent {
  id: ID;
  /**
   * Mean amount of ticks that need to pass for an event to happen
   */
  meanTimeToHappen: number;
  condition: (state: IGameState) => boolean;
  title: string;
  getText: (state: IGameState) => string;
  actions: IGameAction[];
}

export interface IQueuedEvent {
  id: ID;
  meanTimeToHappen: number; // Duplicated for easier lookup
  queuedAtDay: number;
}

export interface ICharacterFinances {
  coinIncome: number;
  foodIncome: number;
  renownIncome: number;
  coinExpenses: number;
  foodExpenses: number;
  renownExpenses: number;
}

export type ICharacterFlags = {
  [flag in CharacterFlag]?: boolean;
}

export type IWorldFlags = {
  [flag in WorldFlag]?: boolean;
}

export interface IGameState {
  daysPassed: number;
  settings: IUserSettings;
  town: ITownSettings;
  resources: IResources;
  character: ICharacter;
  finances: ICharacterFinances;
  relationships: IRelationships;
  eventQueue: IQueuedEvent[];
  activeEvent?: ID;
  characterFlags: Partial<ICharacterFlags>;
  worldFlags: Partial<IWorldFlags>;
  messages: string[];
}

export type StateTransformer = (gameState: IGameState) => IGameState;
