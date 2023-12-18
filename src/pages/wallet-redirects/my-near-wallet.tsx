import { useStoreActions } from "easy-peasy";
import { useEffect } from "react";
import { useRouter } from "next/router";
 // Sign Tx
// http://localhost:3000/approval/pending?transactionHashes=7iTdECfWC9L1p8DddV9r3ukhBqVhmVqS76w7msrN5Ukw - success tx
// http://localhost:3000/approval/pending?errorCode=Error&errorMessage=%257B%2522index%2522%253A0%252C%2522kind%2522%253A%257B%2522ExecutionError%2522%253A%2522Exceeded%2520the%2520account%2520balance.%2522%257D%257D
// http://localhost:3000/approval/pending?errorCode=userRejected&errorMessage=User%2520rejected%2520transaction
// Connect
// `${window.location.origin}/connect/my-near-wallet/success?prevPage=${window.location.pathname}`,
// `${window.location.origin}/connect/my-near-wallet/failure?prevPage=${window.location.pathname}`,

// /wallet-redirects/my-near-wallet?success=true&sign-tx?

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
