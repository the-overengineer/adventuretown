import {
  events,
  eventMap,
} from 'events/index';
import {
  IGameState,
  IQueuedEvent,
} from 'types/state';

// Every how often (in game days) to check for events
const EVENT_PROCESS_OFFSET_DAYS: number = 10;

export const updateEventQueue = (state: IGameState): IGameState => {
  const validEvents = state.eventQueue.filter((eq) => {
    const event = eventMap[eq.id];
    if (event == null) {
      return false;
    }

    return event.condition(state);
  })

  const existingIDs = new Set(validEvents.map((it) => it.id));

  const eventCandidates = events
  .filter((event) => !existingIDs.has(event.id) && event.condition(state))
  .map((event): IQueuedEvent => ({
    id: event.id,
    meanTimeToHappen: event.meanTimeToHappen,
    queuedAtDay: state.daysPassed,
  }));

  return {
    ...state,
    eventQueue: [...validEvents, ...eventCandidates],
  };
};

export const updateActiveEvent = (state: IGameState): IGameState => {
  if (state.activeEvent != null) {
    return state;
  }

  for (const event of state.eventQueue) {
    const chanceToHappen = event.meanTimeToHappen === 0
      ? 1
      : (1 - Math.pow(2, -1 * EVENT_PROCESS_OFFSET_DAYS / event.meanTimeToHappen));

    if (Math.random() <= chanceToHappen) {
      return {
        ...state,
        eventQueue: state.eventQueue.filter((it) => it.id !== event.id),
        activeEvent: event.id,
      };
    }
  }

  return state;
}