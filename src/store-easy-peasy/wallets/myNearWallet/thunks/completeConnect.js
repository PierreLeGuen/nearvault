import { thunk } from "easy-peasy";

/* The account may already exist associated with another jack
 * If the account is not in the list - just add it
 * If the account is in the list, but has a different key - replace it with a new key
 * If the account is in the list, but associated with another wallet - remove the account from the list and add a new one
 * If the account is not a multisig - we show the modal and do not add it
 * */

const getAllAccountsWithSameKey1 = async (publicKey) =>
  await fetch(`https://api.kitwallet.app/publicKey/${publicKey}/accounts`, {
    headers: { "X-requestor": "near" },
  }).then((r) => r.json());

const getAllAccountsWithSameKey2 = async (publicKey) => {
  try {
    const res = await fetch(`https://api.nearblocks.io/v1/keys/${publicKey}`).then(
      (r) => r.json(),
    );
    const a = res.keys.map(({ account_id}) =>  account_id);
    console.log(a);
    return a;
  } catch (e) {
    console.log(e);
  }
};

const isMultisig = async (accountId, provider) =>
  await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: accountId,
    method_name: "list_request_ids",
    args_base64: "e30=",
  });

const getMultisigAccounts = async (newAccount, state) => {
  const allAccounts = await getAllAccountsWithSameKey2(newAccount.publicKey);

  const results = await Promise.allSettled(
    allAccounts.map((accountId) =>
      isMultisig(
        accountId,
        state.wallets.myNearWallet.connection.connection.provider,
      ),
    ),
  );

  return results
    .map((promise, index) => ({
      status: promise.status,
      accountId: allAccounts[index],
      publicKey: newAccount.publicKey,
      wallet: newAccount.wallet,
      addedBy: allAccounts[index] === newAccount.accountId ? "user" : "auto",
    }))
    .filter((promise) => promise.status === "fulfilled")
    .map((result) => ({
      accountId: result.accountId,
      publicKey: result.publicKey,
      wallet: result.wallet,
      addedBy: result.addedBy,
    }));
};

export const completeConnection = thunk(
  async (_actions, payload, { getStoreActions, getStoreState }) => {
    const state = getStoreState();
    const actions = getStoreActions();

    const connectionInProgress = state.wallets.connectInProgress;

    // TODO Check the right way to do it in Next
    const currentUrl = new URL(window.location.href);
    const accountId = currentUrl.searchParams.get("account_id") || "";
    const allKeys = (currentUrl.searchParams.get("all_keys") || "").split(",");
    const prevPage = currentUrl.searchParams.get("prevPage") || "";
    const publicKey = allKeys[0];

    console.log(accountId, allKeys, prevPage);

    currentUrl.searchParams.delete("all_keys");
    currentUrl.searchParams.delete("account_id");
    currentUrl.searchParams.delete("prevPage");

    console.log("connectionInProgress", connectionInProgress);

    if (connectionInProgress !== "my-near-wallet") return;
    // window.history.replaceState({}, "", currentUrl.origin);
    actions.wallets.setConnectionInProgress(null);

    const account = {
      accountId,
      publicKey,
      wallet: "myNearWallet",
      addedBy: "user",
    };

    const accounts = await getMultisigAccounts(account, state);
    console.log(accounts);

    payload.router.replace(prevPage);
    if (accounts.length > 0) actions.addAccount({ accounts, account });
  },
);
