import { SignedTransaction } from "@near-js/transactions";
import { JsonRpcProvider } from "near-api-js/lib/providers";

export const sendTx = async (
  signedTx: SignedTransaction,
  url: string,
  navigate: any,
) => {
  navigate({
    route: "/tx/send/progress",
    routeParams: { tx: signedTx.transaction },
  });

  const provider = new JsonRpcProvider({ url });

  try {
    const outcome: any = await provider.sendJsonRpc("broadcast_tx_commit", [
      Buffer.from(signedTx.encode()).toString("base64"),
    ]);

    if (outcome.status.Failure) {
      navigate({ route: "/tx/send/error", routeParams: { outcome } });
      return;
    }
    navigate({ route: "/tx/send/success", routeParams: { outcome } });
  } catch (error) {
    navigate({ route: "/tx/send/error", routeParams: { error } });
  }
};
