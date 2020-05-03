import { IGameState } from "types/state";

export const prependMessage = (messages: string[], message: string): string[] =>
  [message, ...messages.slice(0, 20)]; // Keep only the last few messages in the queue

export const notify = (message: string) => (state: IGameState): IGameState => ({
  ...state,
  messages: prependMessage(state.messages, message),
});
