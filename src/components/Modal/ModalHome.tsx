import { ReloadIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useZodForm } from "~/hooks/form";
import { ModalState } from "~/store/slices/navigation";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { DerivationPathInput } from "../inputs/derivation";
import { Button } from "../ui/button";
import { Form } from "../ui/form";

const Default = () => {
  const wsStore = useWalletTerminator();

  const startLedgerConnect = () => {
    wsStore.goToLedgerDerivationPath();
  };

  return (
    <>
      <Button onClick={() => startLedgerConnect()}>Ledger connect</Button>
      <Button onClick={() => wsStore.connectWithMyNearWallet()} disabled={true}>
        MyNearWallet connect
      </Button>
      <Button onClick={() => wsStore.closeModal()} variant={"outline"}>
        Close
      </Button>
    </>
  );
};

const formSchema = z.object({
  derivationNumber: z.string(),
});

const DerivationPath = () => {
  const wsStore = useWalletTerminator();
  const form = useZodForm(formSchema, {
    defaultValues: {
      derivationNumber: "0",
    },
  });

  const generateDerivationPath = (path: string) => {
    return "44'/397'/0'/0'/" + path + "'";
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);

    await wsStore.connectWithLedger(
      generateDerivationPath(values.derivationNumber),
    );
  };

  const backToHome = () => {
    wsStore.goHome();
  };

  return (
    <>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DerivationPathInput
              control={form.control}
              name="derivationNumber"
              placeholder="Derivation number"
              generateDerivationPath={generateDerivationPath}
            />
            <Button className="w-full" type="submit">
              Connect
            </Button>
          </form>
        </Form>
      </div>
      {wsStore.ledgerError && (
        <div className="text-red-400">{wsStore.ledgerError}</div>
      )}
      <Button type="button" onClick={() => backToHome()} variant={"outline"}>
        Back
      </Button>
      <Button
        type="button"
        onClick={() => wsStore.closeModal()}
        variant={"outline"}
      >
        Close
      </Button>
    </>
  );
};

const LedgerSharePublicKey = () => {
  const wsStore = useWalletTerminator();
  return (
    <>
      <strong>Action required on Ledger device</strong>
      <p>
        Make sure your Ledger is connected securely via USB, and that the NEAR
        app is open on your device
      </p>
      <p>
        Please share the public key to discover associated multisig accounts.
      </p>
      <Button disabled>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Waiting for approval
      </Button>
      <Button onClick={wsStore.goHome}>Back home</Button>{" "}
    </>
  );
};

const LedgerSharePublicKeySuccess = () => {
  const wsStore = useWalletTerminator();

  return (
    <div className="flex flex-col gap-4">
      <p className="break-word break-alls">
        Found the following accounts associated to the key: {wsStore.sharedPk}.
      </p>
      <ul className="flex list-inside list-disc flex-col gap-2">
        {wsStore.discoveredAccounts.map((account) => (
          <li key={account}>{account}</li>
        ))}
      </ul>
      {wsStore.discoveredAccounts.length === 0 && (
        <p className="text-red-500">No accounts found for this public key.</p>
      )}
      <Button onClick={() => wsStore.goToLedgerDerivationPath()}>Back</Button>
      <Button onClick={wsStore.goHome} variant={"outline"}>
        Back home
      </Button>
    </div>
  );
};

const LedgerSignTransaction = () => {
  const wsStore = useWalletTerminator();

  return (
    <>
      <strong>Action required on Ledger device</strong>
      <p>Sign the transaction on your ledger device.</p>
      {wsStore.ledgerError && (
        <p className="text-red-500">{wsStore.ledgerError}</p>
      )}
      {!wsStore.ledgerError && (
        <Button disabled>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Waiting for approval
        </Button>
      )}
      <Button onClick={wsStore.closeModal}>Cancel</Button>{" "}
    </>
  );
};

const WaitForTransaction = () => {
  const wsStore = useWalletTerminator();

  if (wsStore.transactionId) {
    return (
      <>
        <p>Success!</p>
        <p>Transaction ID: {wsStore.transactionId}</p>
        <Button onClick={wsStore.closeModal}>Close</Button>
      </>
    );
  }

  return (
    <>
      <p>Waiting for transaction to be processed by the chain...</p>
      <Button disabled>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Processing
      </Button>
    </>
  );
};

const GetGoodModal = () => {
  const wsStore = useWalletTerminator();

  switch (wsStore.modalState) {
    case ModalState.Home:
      return <Default />;
    case ModalState.LedgerDerivationPath:
      return <DerivationPath />;
    case ModalState.LedgerSharePublicKey:
      return <LedgerSharePublicKey />;
    case ModalState.LedgerSharePublicKeySuccess:
      return <LedgerSharePublicKeySuccess />;
    case ModalState.LedgerSignTransaction:
      return <LedgerSignTransaction />;
    case ModalState.WaitForTransaction:
      return <WaitForTransaction />;
    default:
      return "Not implemented yet: " + JSON.stringify(wsStore.modalState);
  }
};

export const WalletHome = () => {
  const wsStore = useWalletTerminator();

  return (
    <Dialog
      open={wsStore.isModalOpen}
      onOpenChange={() => wsStore.closeModal()}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Wallet selector</DialogTitle>
          {/* <DialogDescription>Manage your wallets from here.</DialogDescription> */}
        </DialogHeader>
        <GetGoodModal />
      </DialogContent>
    </Dialog>
  );
};
