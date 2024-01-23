import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { CreateMultisigWalletCard } from "~/components/Welcome/CreateMultisigWalletCard";
import { CreateTeamCard } from "~/components/Welcome/CreateTeamCard";
import { Button } from "~/components/ui/button";
import { WalletSelectorContextProvider } from "~/contexts/WalletSelectorContext";
import { NextPageWithLayout } from "../_app";

export const SetupMultisigWallet: NextPageWithLayout = () => {
  const [multisigWalletCreated, setMultisigWalletCreated] = useState(undefined);
  const [teamCreated, setTeamCreated] = useState(undefined);
  const [step, setStep] = useState(0);
  const { data, status } = useSession();
  const loading = status === "loading";
  const email = data?.user.email;
  const router = useRouter();

  const nextStep = async () => {
    if (isLastStep()) {
      await router.push("/dashboard"); // Redirect the user to the dashboard page.
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const stepDone = (step) => {
    return step === 0 ? !!multisigWalletCreated : !!teamCreated;
  };

  const isLastStep = () => {
    return step === 1;
  };

  if (loading) return null;

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center">
      <div className="flex w-[700px] flex-col gap-3">
        <CreateMultisigWalletCard
          className={step !== 0 ? "hidden" : ""}
          onMultisigCreateSuccess={setMultisigWalletCreated}
        />
        <CreateTeamCard
          className={step !== 1 ? "hidden" : ""}
          onTeamCreated={setTeamCreated}
          defaultValues={{
            name: `${data.user.name}'s team`,
            members: [email],
            wallets: [multisigWalletCreated],
          }}
        />

        <div className="inline-flex w-full justify-between">
          <Button variant="outline" disabled={step === 0} onClick={prevStep}>
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button disabled={!stepDone(step)} onClick={nextStep}>
            {isLastStep() ? "Finish" : "Continue"}
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
