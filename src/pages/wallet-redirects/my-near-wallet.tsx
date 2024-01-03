import { useStoreActions } from "easy-peasy";
import { useEffect } from "react";
import { useRouter } from "next/router";

const MyNearWallet = () => {
  const handleRedirects = useStoreActions(
    (actions: any) => actions.wallets.myNearWallet.handleRedirects,
  );
  const router = useRouter();

  useEffect(() => {
    handleRedirects({ router });
  }, []);

  return null;
};

export default MyNearWallet;
