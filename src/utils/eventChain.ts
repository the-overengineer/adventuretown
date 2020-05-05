import {
  ID,
  IEvent,
  IGameState,
  IQueuedEvent,
} from 'types/state';

interface IEventWithWeight {
  id: ID;
  weight: number;
  condition?: (state: IGameState) => boolean;
}

const eventChain = (events: IEventWithWeight[] | ID) => (state: IGameState): IGameState => {
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
    if (previous + possibleEvent.weight >= chance) {
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

interface IFactor {
  weight: number;
  condition: (state: IGameState) => boolean;
}

class EventActionBuilder {
  private eventID: ID;
  private weight: number = 1;
  private condition?: (state: IGameState) => boolean;
  private weightOverriden: boolean = false;
  private factors: IFactor[] = []

  public constructor(event: IEvent) {
    this.eventID = event.id;
  }

  public onlyWhen(condition: (state: IGameState) => boolean): this {
    this.condition = condition;
    return this;
  }

  public withWeight(weight: number): this {
    if (this.weightOverriden) {
      throw new Error(`You tried to override the weight on an event which already has a weight explicitly set: ${this.eventID}`);
    }

    this.weight = weight;
    this.weightOverriden = true;
    return this;
  }

  public multiplyByFactor(weight: number, when: (state: IGameState) => boolean): this {
    this.factors.push({ weight, condition: when });
    return this;
  }

  public transform(state: IGameState): IEventWithWeight {
    const weight = this.factors.reduce(
      (weight, factor) => factor.condition(state) ? weight * factor.weight : weight,
      this.weight,
    );

    return {
      condition: this.condition,
      id: this.eventID,
      weight,
    }
  }
}

class EventChainBuilder {
  private events: EventActionBuilder[] = [];

  public constructor(event: IEvent) {
    this.events.push(new EventActionBuilder(event));
  }

  public onlyWhen(condition: (state: IGameState) => boolean): this {
    this.activeEvent().onlyWhen(condition);
    return this;
  }

  public withWeight(weight: number): this {
    this.activeEvent().withWeight(weight);
    return this;
  }

  public multiplyByFactor(weight: number, when: (state: IGameState) => boolean): this {
    this.activeEvent().multiplyByFactor(weight, when);
    return this;
  }

  public orTrigger(event: IEvent): this {
    this.events.push(new EventActionBuilder(event));
    return this;
  }

  public toTransformer() {
    return (state: IGameState): IGameState => eventChain(this.events.map(_ => _.transform(state)))(state)
  }

  private activeEvent() {
    return this.events[this.events.length - 1];
  }
}

export const triggerEvent = (event: IEvent) => new EventChainBuilder(event);
