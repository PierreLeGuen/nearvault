import { thunk } from "easy-peasy";

// connectStatus=Allowed - open modal and start looking for multisig accounts
// connectStatus=Rejected - do nothing
// transactionHashes - show modal and success tx
// errorCode=Error - do nothing
// errorCode=userRejected - do nothing

const getSearchParams = () => {
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;

  const connectStatus = searchParams.get("connectStatus");
  const returnTo = searchParams.get("returnTo");

  if (connectStatus === "Allowed")
    return {
      connectAllowed: true,
      returnTo,
      accountId:
        searchParams.get("accountId") || searchParams.get("account_id"),
      publicKey: searchParams.get("all_keys").split(",")[0],
    };

  const transactionHashes = searchParams.get("transactionHashes");

  if (transactionHashes)
    return {
      txSuccess: true,
      transactionHashes,
      returnTo,
    };

  return { returnTo };
};

export const handleRedirects = thunk(
  async (_, payload: any, { getStoreActions }) => {
    const { router } = payload;
    const actions: any = getStoreActions();

    const {
      connectAllowed,
      accountId,
      publicKey,
      txSuccess,
      transactionHashes,
      returnTo,
    } = getSearchParams();

    if (connectAllowed) {
      actions.wallets.myNearWallet.completeConnection({
        router,
        accountId,
        publicKey,
      });
    }

    if (txSuccess) {
      actions.wallets.modal.open();
      actions.wallets.modal.navigate({
        route: "/tx/send/success",
        routeParams: { outcome: { transaction: { hash: transactionHashes } } },
      });
    }

    router.replace(returnTo);
  },
);
