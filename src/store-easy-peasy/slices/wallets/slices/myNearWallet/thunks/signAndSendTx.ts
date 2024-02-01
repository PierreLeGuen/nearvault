import { serialize } from "near-api-js/lib/utils/serialize";
import { SCHEMA } from "near-api-js/lib/transaction";
import { thunk } from "easy-peasy";

export const signAndSendTx = thunk(async (_, payload: any, { getState }) => {
  const { transaction } = payload;
  const slice: any = getState();

  const newUrl = new URL(slice.signUrl);

  const encodedTx = serialize(SCHEMA, transaction);
  newUrl.searchParams.set(
    "transactions",
    Buffer.from(encodedTx).toString("base64"),
  );

  
  const callbackUrl = `${window.location.origin}/wallet-redirects/my-near-wallet?returnTo=${window.location.pathname}`;
  newUrl.searchParams.set("callbackUrl", callbackUrl);

  window.location.assign(newUrl.toString());
});
