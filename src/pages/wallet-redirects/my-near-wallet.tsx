import { useStoreActions } from "easy-peasy";
import { useEffect } from "react";
import { useRouter } from "next/router";

const MyNearWallet = () => {
  const completeConnection = useStoreActions(
    (actions: any) => actions.wallets.myNearWallet.completeConnection,
  );
  const router = useRouter();

  useEffect(() => {
    console.log('render MyNearWallet redirect');
    completeConnection({ router });
  }, []);

  return null;
};

export default MyNearWallet;
