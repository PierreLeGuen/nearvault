import { useStoreActions } from "easy-peasy";
import { useEffect } from 'react';
import { useRouter } from 'next/router'

const Success = () => {
  const completeConnection = useStoreActions(
    (actions: any) => actions.wallets.myNearWallet.completeConnection,
  );
  const router = useRouter();

  useEffect(() => {
    completeConnection({ router });
  }, []);

  return <div>Completing MyNearWallet Connection...</div>;
};

export default Success;
