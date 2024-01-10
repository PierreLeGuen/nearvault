import { Action, ActionCreator } from "easy-peasy";

type Route = string;
type RouteParams = object | null;

type State = {
  isOpen: boolean;
  route: Route;
  routeParams: RouteParams;
};

export type Open = Action<State>;
export type OpenFn = ActionCreator;

export type Close = Action<State>;

type NavigatePayload = Route | { route: Route; routeParams: RouteParams };

export type Navigate = Action<State, NavigatePayload>;
export type NavigateFn = ActionCreator<NavigatePayload>;

type Actions = {
  open: Open;
  close: Close;
  navigate: Navigate;
};

export type Modal = State & Actions;
