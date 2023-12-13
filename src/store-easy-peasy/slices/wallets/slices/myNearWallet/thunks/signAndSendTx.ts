import { serialize } from "near-api-js/lib/utils/serialize";
import { SCHEMA } from "near-api-js/lib/transaction";
import { thunk } from "easy-peasy";

export const signAndSendTx = thunk(async (_, payload: any, { getState }) => {
  const { transaction, meta } = payload;
  const slice: any = getState();

  const currentUrl = new URL(window.location.href);
  const newUrl = new URL("sign", slice.walletUrl);

  newUrl.searchParams.set(
    "transactions",
    Buffer.from(serialize(SCHEMA, transaction)).toString("base64"),
  );
  newUrl.searchParams.set("callbackUrl", currentUrl.href);

  if (meta) newUrl.searchParams.set("meta", meta);

  window.location.assign(newUrl.toString());
});
