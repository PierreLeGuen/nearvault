import { useSession } from "next-auth/react";
import { useState } from "react";

const AddMultisigWallet = () => {
  useSession({ required: true });

  const [walletName, setWalletName] = useState<string>("");

  return (
    <>
      <input
        type="text"
        placeholder="Enter wallet name"
        onChange={(e) => setWalletName(e.target.name)}
        value={walletName}
      />
    </>
  );
};

export default AddMultisigWallet;
