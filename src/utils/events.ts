import {
  ID,
  IEvent,
  IGameState,
  StateTransformer,
  IGameAction,
  IResources,
} from 'types/state';
import { notify } from './message';
import { compose, clamp } from './functional';
import { EventChainBuilder } from './eventChain';
import { changeResource, changeResourcePercentage } from './resources';

type TextFromState = (state: IGameState) => string;
type TimeFromState = (state: IGameState) => number;

export const isEvent = (it: any): it is IEvent =>
  it != null && (it as IEvent).id != null && (it as IEvent).condition != null;

export const collectEvents = (it: { [key: string]: any }): IEvent[] =>
  Object.values(it).filter(isEvent);

interface IBackgroundEvent extends Omit<IEvent, 'id' | 'actions' | 'getText' | 'fixedTimeToHappen' | 'meanTimeToHappen' | 'title'> {
  meanTimeToHappen: number | TimeFromState | TimeBuilder;
  action: IGameAction | ActionBuilder;
}

interface IRegularEvent extends Omit<IEvent, 'id' | 'actions' | 'getText' | 'fixedTimeToHappen' | 'meanTimeToHappen'> {
  meanTimeToHappen: number | TimeFromState | TimeBuilder;
  actions: Array<IGameAction | ActionBuilder>;
  getText: string | TextFromState;
}

interface ITriggeredEvent extends Omit<IEvent, 'meanTimeToHappen' | 'fixedTimeToHappen' | 'condition' | 'id' | 'actions' | 'getText'> {
  actions: Array<IGameAction | ActionBuilder>;
  getText: string | TextFromState;
}

interface IFixedEvent extends Omit<IEvent, 'meanTimeToHappen' | 'fixedTimeToHappen' | 'id' | 'actions' | 'getText'> {
  fixedTimeToHappen: number | TimeFromState | TimeBuilder;
  actions: Array<IGameAction | ActionBuilder>;
  getText: string | TextFromState;
}

const getActions = (actions: Array<IGameAction | ActionBuilder>): IGameAction[] =>
  actions.map((action): IGameAction => action instanceof ActionBuilder ? action.done() : action as IGameAction);

const text = (getText: string | TextFromState): TextFromState =>
  typeof getText === 'string' ? _ => getText : getText;

const getTime = (time: number | TimeFromState | TimeBuilder): TimeFromState =>
  typeof time === 'number'
    ?  (_ => time) as TimeFromState
    : time instanceof TimeBuilder
      ? time.calculate()
      : time;

export const eventCreator = (prefix: number) => {
  let id = prefix + 1;

  return {
    triggered: (base: ITriggeredEvent): IEvent => ({
      ...base,
      id: id++ as ID,
      condition: _ => false,
      actions: getActions(base.actions),
      getText: text(base.getText),
    }),
    regular: (base: IRegularEvent): IEvent => ({
      ...base,
      id: id++ as ID,
      actions: getActions(base.actions),
      getText: text(base.getText),
      meanTimeToHappen: getTime(base.meanTimeToHappen),
    }),
    fixed: (base: IFixedEvent): IEvent => ({
      ...base,
      id: id++ as ID,
      actions: getActions(base.actions),
      fixedTimeToHappen: getTime(base.fixedTimeToHappen),
      getText: text(base.getText),
    }),
    background: (base: IBackgroundEvent): IEvent => ({
      condition: base.condition,
      id: id++ as ID,
      title: '',
      background: true,
      getText: _ => '',
      meanTimeToHappen: getTime(base.meanTimeToHappen),
      actions: getActions([base.action]),
    }),
  };
}

export class ActionBuilder {
  private conditions: Array<(state: IGameState) => boolean> = [];
  private actions: Array<StateTransformer> = [];

  public constructor(private text: string) {}

  public when(condition: (state: IGameState) => boolean): this {
    this.conditions.push(condition);
    return this;
  }

  public do(...actions: Array<EventChainBuilder | StateTransformer>): this {
    this.actions = [...this.actions, ...actions.map(this.unpack)];
    return this;
  }

  public and(...actions: Array<EventChainBuilder | StateTransformer>): this {
    return this.do(...actions);
  }

  // Such a common pattern that we're encoding it here
  public spendResource(resource: keyof IResources, amount: number): this {
    return this.when(_ => _.resources[resource] >= amount).do(changeResource(resource, -amount));
  }

  public resourceLosePercentage(resource: keyof IResources, percentage: number, min?: number, max?: number): this {
    const amount = -1 * clamp(percentage / 100, min, max);
    return this.do(changeResourcePercentage(resource, amount));
  }

  public resourceGainPercentage(resource: keyof IResources, percentage: number, min?: number, max?: number): this {
    const amount = clamp(percentage / 100, min, max);
    return this.do(changeResourcePercentage(resource, amount));
  }

  public changeResource(resource: keyof IResources, amount: number): this {
    return this.do(changeResource(resource, amount));
  }

  public log(message: string): IGameAction {
    this.actions.push(notify(message));
    return this.done();
  }

  public done(): IGameAction {
    return {
      condition: (state: IGameState) => this.conditions.length === 0 || this.conditions.every(condition => condition(state)),
      text: this.text,
      perform: this.actions.length > 0 ? compose(...this.actions) : undefined,
    }
  }

  private unpack(event: EventChainBuilder | StateTransformer): StateTransformer {
    if (event instanceof EventChainBuilder) {
      return event.toTransformer();
    }

    return event;
  }
}

export const action = (text: string) => new ActionBuilder(text);

type TimeSpan = 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months' | 'year' | 'years';

interface IFactor {
  weight: number;
  condition: (state: IGameState) => boolean;
}

class TimeBuilder {
  private factors: IFactor[] = [];

  public constructor(
    private count: number,
    private timeSpan: TimeSpan,
  ) {}

  public modify(weight: number, condition: (state: IGameState) => boolean): this {
    this.factors.push({ weight, condition });
    return this;
  }

  public calculate(): TimeFromState {
    const base = this.count * this.calculateSpanFactor();

    return (state: IGameState) => this.factors.reduce((num, factor) => factor.condition(state) ? factor.weight * num : num, base);
  }

  private calculateSpanFactor(): number {
    switch (this.timeSpan) {
      case 'year':
      case 'years':
        return 365;
      case 'month':
      case 'months':
        return 30;
      case 'week':
      case 'weeks':
        return 7;
      default:
        return 1;
    }
  }
}

export const time = (count: number, timeSpan: TimeSpan = 'days') => new TimeBuilder(count, timeSpan);
