import {
  ID,
  IEvent,
} from 'types/state';

export const isEvent = (it: any): it is IEvent =>
  it != null && (it as IEvent).id != null && (it as IEvent).condition != null;

export const collectEvents = (it: { [key: string]: any }): IEvent[] =>
  Object.values(it).filter(isEvent);

export const eventCreator = (prefix: number) => {
  let id = prefix + 1;

  return {
    triggered: (base: Omit<IEvent, 'meanTimeToHappen' | 'condition' | 'id'>): IEvent => ({
      id: id++ as ID,
      meanTimeToHappen: 0,
      condition: _ => false,
      ...base,
    }),
    regular: (base: Omit<IEvent, 'id'>): IEvent => ({
      id: id++ as ID,
      ...base,
    }),
  };
}
