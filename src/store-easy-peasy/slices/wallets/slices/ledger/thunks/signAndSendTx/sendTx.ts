import { SignedTransaction } from "@near-js/transactions";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { NavigateFn } from "~/store-easy-peasy/slices/wallets/slices/modal/types";

export const sendTx = async (
  signedTx: SignedTransaction,
  url: string,
  navigate: NavigateFn,
) => {
  try {
    navigate({
      route: "/tx/send/progress",
      routeParams: { tx: signedTx.transaction },
    });

    const provider = new JsonRpcProvider({ url });
    const outcome = await provider.sendTransaction(signedTx);

    // @ts-ignore
    if (outcome.status.Failure) {
      navigate({ route: "/tx/send/error", routeParams: { outcome } });
      return;
    }
    navigate({ route: "/tx/send/success", routeParams: { outcome } });
  } catch (error) {
    navigate({ route: "/tx/send/error", routeParams: { error } });
  }
};
