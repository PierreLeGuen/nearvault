import { useStoreActions } from "easy-peasy";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useWalletTerminator } from "~/store/slices/wallet-selector";

const MyNearWallet = () => {
  const handleRedirects = useStoreActions(
    (actions: any) => actions.wallets.myNearWallet.handleRedirects,
  );
  const wt = useWalletTerminator();

  const router = useRouter();

  useEffect(() => {
    handleRedirects({ router });
    void wt.handleMnwRedirect(router);
  }, []);

  return null;
};

export default MyNearWallet;
