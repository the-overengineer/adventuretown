import {
  ID,
  IEvent,
  IGameState,
  StateTransformer,
  IGameAction,
  IResources,
} from 'types/state';
import { notify } from './message';
import { compose } from './functional';
import { EventChainBuilder } from './eventChain';
import { changeResource, changeResourcePercentage } from './resources';

type TextFromState = (state: IGameState) => string;

export const isEvent = (it: any): it is IEvent =>
  it != null && (it as IEvent).id != null && (it as IEvent).condition != null;

export const collectEvents = (it: { [key: string]: any }): IEvent[] =>
  Object.values(it).filter(isEvent);

interface IRegularEvent extends Omit<IEvent, 'id' | 'actions' | 'getText'> {
  actions: Array<IGameAction | ActionBuilder>;
  getText: string | TextFromState;
}

interface ITriggeredEvent extends Omit<IEvent, 'meanTimeToHappen' | 'condition' | 'id' | 'actions' | 'getText'> {
  actions: Array<IGameAction | ActionBuilder>;
  getText: string | TextFromState;
}

const getActions = (actions: Array<IGameAction | ActionBuilder>): IGameAction[] =>
  actions.map((action): IGameAction => action instanceof ActionBuilder ? action.done() : action as IGameAction);

const text = (getText: string | TextFromState): TextFromState =>
  typeof getText === 'string' ? _ => getText : getText;

export const eventCreator = (prefix: number) => {
  let id = prefix + 1;

  return {
    triggered: (base: ITriggeredEvent): IEvent => ({
      ...base,
      id: id++ as ID,
      meanTimeToHappen: 0,
      condition: _ => false,
      actions: getActions(base.actions),
      getText: text(base.getText),
    }),
    regular: (base: IRegularEvent): IEvent => ({
      ...base,
      id: id++ as ID,
      actions: getActions(base.actions),
      getText: text(base.getText),
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

  public resourceLosePercentage(resource: keyof IResources, percentage: number): this {
    return this.do(changeResourcePercentage(resource, -percentage / 100));
  }

  public gainResource(resource: keyof IResources, amount: number): this {
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
