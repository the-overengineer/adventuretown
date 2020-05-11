import {
  ID,
  IEvent,
  IGameState,
  IQueuedEvent,
} from 'types/state';

interface IEventWithWeight {
  id: ID;
  weight: number;
  delay?: number;
  condition?: (state: IGameState) => boolean;
}

const enqueue = (state: IGameState, eventID: ID, delay?: number): IGameState => {
  const queuedEvent: IQueuedEvent = {
    id: eventID,
    meanTimeToHappen: delay ?? 0,
    queuedAtDay: state.daysPassed,
  };

  return {
    ...state,
    eventQueue: [queuedEvent, ...state.eventQueue],
  };
}

const eventChain = (events: IEventWithWeight[] | ID) => (state: IGameState): IGameState => {
  if (typeof events === 'number') {
    return enqueue(state, events);
  }

  const possibleEvents = (events as IEventWithWeight[]).filter((it) => it.condition == null || it.condition(state));

  if (possibleEvents.length === 0) {
    return state;
  }

  if (possibleEvents.length === 1) {
    const event = (events as IEventWithWeight[])[0]
    return enqueue(state, event.id, event.delay);
  }

  const maxWeight = possibleEvents.map(_ => _.weight).reduce((a, b) => a + b, 0);

  let previous = 0;
  const chance = Math.random() * maxWeight;

  for (const possibleEvent of possibleEvents) {
    if (previous + possibleEvent.weight >= chance) {
      return enqueue(state, possibleEvent.id, possibleEvent.delay);
    } else {
      previous += possibleEvent.weight;
    }
  }

  const event = possibleEvents[possibleEvents.length - 1];
  return enqueue(state, event.id, event.delay);
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
  private delay?: number;

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

  public after(delay: number): this {
    this.delay = delay;
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

export class EventChainBuilder {
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

  public after(delay: number): this {
    this.activeEvent().after(delay);
    return this;
  }

  public delayAll(delay: number): this {
    this.events.forEach(_ => _.after(delay));
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
