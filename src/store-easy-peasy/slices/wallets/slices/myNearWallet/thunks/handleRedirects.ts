import { thunk } from "easy-peasy";
import { PublicKey } from "near-api-js/lib/utils";

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

  if (connectStatus === "Allowed") {
    const _publicKey = searchParams.get("all_keys").split(",")[0];
    if (!_publicKey) {
      throw new Error("No public key found in the URL");
    }

    const publicKey = PublicKey.from(_publicKey);

    const _accId = searchParams.get("accountId") || searchParams.get("account_id");
    if (!_accId) {
      throw new Error("No account ID found in the URL");
    }

    const accountId = _accId;

    return {
      connectAllowed: true,
      returnTo,
      accountId,
      publicKey,
    };
  }
  
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

    const pk = PublicKey.from(publicKey);
    console.log(pk);
    
    if (connectAllowed) {
      actions.wallets.myNearWallet.completeConnection({
        router,
        accountId,
        publicKey: pk,
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
