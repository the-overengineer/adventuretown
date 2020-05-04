import { IGameState, ID, IQueuedEvent } from 'types/state';


interface IEventWithWeight {
  id: ID;
  weight: number;
  condition?: (state: IGameState) => boolean;
}
export const eventChain = (events: IEventWithWeight[] | ID) => (state: IGameState): IGameState => {
  if (typeof events === 'number') {
    const queuedEvent: IQueuedEvent = {
      id: events,
      meanTimeToHappen: 0,
      queuedAtDay: state.daysPassed,
    };

    return {
      ...state,
      eventQueue: [queuedEvent, ...state.eventQueue],
    };
  }

  const possibleEvents = (events as IEventWithWeight[]).filter((it) => it.condition == null || it.condition(state));

  if (possibleEvents.length === 0) {
    return state;
  }

  const maxWeight = possibleEvents.map(_ => _.weight).reduce((a, b) => a + b, 0);

  let previous = 0;
  const chance = Math.random() * maxWeight;

  for (const possibleEvent of possibleEvents) {
    if (previous + possibleEvent.weight <= chance) {
      const queuedEvent: IQueuedEvent = {
        id: possibleEvent.id,
        meanTimeToHappen: 0,
        queuedAtDay: state.daysPassed,
      };
      return {
        ...state,
        eventQueue: [queuedEvent, ...state.eventQueue],
      };
    } else {
      previous += possibleEvent.weight;
    }
  }

  const event = possibleEvents[possibleEvents.length - 1];
  const queuedEvent: IQueuedEvent = {
    id: event.id,
    meanTimeToHappen: 0,
    queuedAtDay: state.daysPassed,
  };
  return {
    ...state,
    eventQueue: [queuedEvent, ...state.eventQueue],
  };
};