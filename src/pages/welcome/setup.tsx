import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Team, TeamInvitation } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { CreateMultisigWalletCard } from "~/components/Welcome/CreateMultisigWalletCard";
import { CreateTeamCard } from "~/components/Welcome/CreateTeamCard";
import { PendingInvitations } from "~/components/Welcome/PendingInvitations";
import { Button } from "~/components/ui/button";
import { WalletSelectorContextProvider } from "~/contexts/WalletSelectorContext";
import { cn } from "~/lib/utils";
import { type NextPageWithLayout } from "../_app";

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
      await router.push("/payments/transfers"); // Redirect the user to the dashboard page.
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const stepDone = (step) => {
    return step === 0 ? !!teamCreated : true;
  };

  const isLastStep = () => {
    return step === 1;
  };

  const teamInvitationCallback = (
    invitation: TeamInvitation & { team: Team },
    status: string,
  ) => {
    console.log("Invitation callback", invitation, status);
    if (status === "ACCEPTED") {
      setTeamCreated(invitation.team.name);
    }
  };
  if (loading) return null;

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center">
      <div className="flex w-[700px] flex-col gap-3">
        <CreateMultisigWalletCard
          className={step !== 1 ? "hidden" : ""}
          onMultisigCreateSuccess={setMultisigWalletCreated}
        />
        <div className={cn("flex flex-col gap-2", step !== 0 ? "hidden" : "")}>
          <PendingInvitations callback={teamInvitationCallback} />
          <CreateTeamCard
            onTeamCreated={setTeamCreated}
            defaultValues={{
              name: `My Awesome Team`,
              members: [email],
              wallets: [""],
            }}
          />
        </div>

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
