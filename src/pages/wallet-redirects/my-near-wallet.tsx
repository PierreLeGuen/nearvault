import { useRouter } from "next/router";
import { useEffect } from "react";
import { useWalletTerminator } from "~/store/slices/wallet-selector";

const MyNearWallet = () => {
  const wt = useWalletTerminator();

  const router = useRouter();

  useEffect(() => {
    void wt.handleMnwRedirect(router);
  }, [router, wt]);

  return null;
};

export default MyNearWallet;
