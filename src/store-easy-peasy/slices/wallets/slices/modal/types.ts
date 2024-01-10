import { Action } from "easy-peasy";

type Route = string;
type RouteParams = object | null;

type State = {
  isOpen: boolean;
  route: Route;
  routeParams: RouteParams;
};

export type Open = Action<State>;
export type Close = Action<State>;

export type Navigate = Action<
  State,
  Route | { route: Route; routeParams: RouteParams }
>;

type Actions = {
  open: Open;
  close: Close;
  navigate: Navigate;
};

export type Modal = State & Actions;
