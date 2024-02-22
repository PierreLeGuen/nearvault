import { ReloadIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { config } from "~/config/config";
import { useZodForm } from "~/hooks/form";
import { ModalState } from "~/store/slices/navigation";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { DerivationPathInput } from "../inputs/derivation";
import { TextInput } from "../inputs/text";
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
      <Button onClick={() => wsStore.goToPrivateKeyShare()}>
        Private key connect
      </Button>
      <hr />
      <Button onClick={() => wsStore.goToCurrentlyImportedKeys()}>
        View imported keys
      </Button>
      <hr />
      <Button onClick={() => wsStore.closeModal()} variant={"outline"}>
        Close
      </Button>
    </>
  );
};

const derivationPathFormSchema = z.object({
  derivationNumber: z.string(),
});

const DerivationPath = () => {
  const wsStore = useWalletTerminator();
  const form = useZodForm(derivationPathFormSchema, {
    defaultValues: {
      derivationNumber: "0",
    },
  });

  const generateDerivationPath = (path: string) => {
    return "44'/397'/0'/0'/" + path + "'";
  };

  const onSubmit = async (values: z.infer<typeof derivationPathFormSchema>) => {
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
      {wsStore.error && <div className="text-red-400">{wsStore.error}</div>}
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

const privateKeyFormSchema = z.object({
  privateKey: z.string(),
});

const PrivateKey = () => {
  const wsStore = useWalletTerminator();
  const form = useZodForm(privateKeyFormSchema);

  const onSubmit = async (values: z.infer<typeof privateKeyFormSchema>) => {
    console.log(values);

    try {
      const res = await wsStore.connectWithPrivateKey(values.privateKey);
      wsStore.goToPrivateKeyConnectSuccess(res.pubK, res.accounts);
    } catch (e) {
      wsStore.goToPrivateKeyShare((e as Error).message);
    }
  };

  const backToHome = () => {
    wsStore.goHome();
  };

  return (
    <>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextInput
              control={form.control}
              name="privateKey"
              label="Private Key"
              placeholder="ed25519:2v4YqugbGpUmAJVn5kCWETaYYBanAmsYoyK5wpxZygnzSrCsr6PHkTWGES553cr6xsNah6rqTyPGYuyC2WWRjDYd"
              rules={{ required: true }}
            />
            <Button className="w-full" type="submit">
              Connect
            </Button>
          </form>
        </Form>
      </div>
      {wsStore.error && <div className="text-red-400">{wsStore.error}</div>}
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

const SharePublicKeySuccess = () => {
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
        <p className="text-red-500">
          No multisig accounts found for this public key.
        </p>
      )}
      <Button onClick={() => wsStore.closeModal()}>Close</Button>
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
      {wsStore.error && <p className="text-red-500">{wsStore.error}</p>}
      {!wsStore.error && (
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
    const nbUrl = config.urls.nearBlocks.txDetails(wsStore.transactionId);
    return (
      <>
        <p>Success!</p>
        <p>Transaction ID: {wsStore.transactionId}</p>
        <a
          href={nbUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500"
        >
          View transaction on NearBlocks
        </a>
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

const FailedTransaction = () => {
  const wsStore = useWalletTerminator();

  return (
    <>
      <strong>Transaction failed!</strong>
      <pre>{wsStore.error}</pre>
      <Button onClick={wsStore.closeModal}>Close</Button>
    </>
  );
};

const CurrentlyImportedKeys = () => {
  const wsStore = useWalletTerminator();

  return (
    <>
      <strong>Currently imported keys:</strong>
      {Object.keys(wsStore.keysToAccounts).map((pubK) => {
        return (
          <div key={pubK} className="flex flex-col gap-2">
            <p>
              <strong>{pubK}</strong>
            </p>
            <ul className="flex list-inside list-disc flex-col gap-2">
              {wsStore.keysToAccounts[pubK].map((account) => (
                <li key={account}>{account}</li>
              ))}
            </ul>
          </div>
        );
      })}
      <Button onClick={wsStore.goHome} variant="outline">
        Go back
      </Button>
      <Button onClick={wsStore.closeModal}>Close</Button>
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
    case ModalState.LedgerSignTransaction:
      return <LedgerSignTransaction />;
    case ModalState.SharePublicKeySuccess:
      return <SharePublicKeySuccess />;
    case ModalState.WaitForTransaction:
      return <WaitForTransaction />;
    case ModalState.PrivateKeyShare:
      return <PrivateKey />;
    case ModalState.FailedTransaction:
      return <FailedTransaction />;
    case ModalState.CurrentlyImporterKeys:
      return <CurrentlyImportedKeys />;
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
