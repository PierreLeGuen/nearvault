import { createTypedHooks } from "easy-peasy";
import type { Store } from "~/store-easy-peasy/types";

const typedHooks = createTypedHooks<Store>();

export const useStoreActions = typedHooks.useStoreActions;
export const useStoreState = typedHooks.useStoreState;
