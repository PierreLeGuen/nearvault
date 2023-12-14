import { useEffect } from "react";
import { setWalletSelector, setWalletSelectorModal } from "~/stores/global";

/**
 * Setup the wallet selector and wallet selector modal by lazy loading the setup functions
 * to optimize responsiveness.
 */
export function useWalletSelectorEffect() {
  useEffect(() => {
    import("../lib/selector")
      .then(async ({ setupSelector, setupModalSelector }) => {
        const selector = await setupSelector();
        setWalletSelector(selector);
        setWalletSelectorModal(setupModalSelector(selector));
      })
      .catch(console.error);
  }, []);
}
