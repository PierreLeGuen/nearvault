import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { CreateMultisigWalletCard } from "~/components/Welcome/CreateMultisigWalletCard";
import { Button } from "~/components/ui/button";
import { WalletSelectorContextProvider } from "~/contexts/WalletSelectorContext";
import { NextPageWithLayout } from "../_app";

export const SetupMultisigWallet: NextPageWithLayout = () => {
  const [multisigWalletCreated, setMultisigWalletCreated] = useState(undefined);

  useEffect(() => {
    console.log(multisigWalletCreated);
  }, [multisigWalletCreated]);

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center">
      <div className="flex w-[700px] flex-col gap-3">
        <CreateMultisigWalletCard
          onMultisigCreateSuccess={setMultisigWalletCreated}
        />
        <div className="inline-flex w-full justify-between">
          <Button variant="outline">
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button>
            Continue
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

SetupMultisigWallet.getLayout = function getLayout(page) {
  return <WalletSelectorContextProvider>{page}</WalletSelectorContextProvider>;
};

export default SetupMultisigWallet;
