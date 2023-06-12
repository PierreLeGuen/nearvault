/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useSession } from "next-auth/react";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import { initMultiSigContract } from "~/lib/multisig/contract";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const AddWallet: NextPageWithLayout = () => {
  useSession({ required: true });
  const { currentTeam, newNearConnection } = usePersistingStore();
  const mutation = api.teams.addWalletsForTeam.useMutation({});

  const [walletIds, setWalletIds] = useState<string>("");
  const [walletErrors, setWalletsError] = useState<string[]>([]);
  const [walletSucess, setWalletSucess] = useState<string>("");

  if (!currentTeam) {
    throw new Error("No current team");
  }

  const assertValidMultisigAccount = async (walletId: string) => {
    const n = await newNearConnection();

    const a = await n.account(walletId);
    const m = initMultiSigContract(a, walletId);

    try {
      const request_ids = await m.list_request_ids();
      console.log(`Request ids: ${JSON.stringify(request_ids)}`);
    } catch (e: any) {
      if (
        e.message.includes("CodeDoesNotExist") ||
        e.message.includes("MethodNotFound") ||
        e.message.includes("does not exist")
      ) {
        console.log("not multisig");
      } else {
        console.error(e);
      }
      return false;
    }

    return true;
  };

  const addMultisigWallets = async () => {
    setWalletsError([]);
    setWalletSucess("");
    const wallets = walletIds.split(/[\n,]+/).map((id) => id.trim());
    const validWallets = [];

    for (const walletId of wallets) {
      const ok = await assertValidMultisigAccount(walletId);
      if (!ok) {
        setWalletsError((errors) => [
          ...errors,
          `Wallet ID ${walletId} is not a valid multisig account`,
        ]);
        continue;
      }
      validWallets.push(walletId);
    }

    mutation.mutate(
      {
        walletAddresses: validWallets,
        teamId: currentTeam.id,
      },
      {
        onSuccess: (data) => {
          if (data.newWallets.length > 0) {
            setWalletSucess(
              `Created wallets: ${JSON.stringify(data.newWallets)}`
            );
          }
          if (data.errors.length > 0) {
            setWalletsError((errors) => [...errors, ...data.errors]);
          }
        },
        onError: (error) => {
          setWalletsError((errors) => [
            ...errors,
            `Error creating wallets: ${error.message}`,
          ]);
        },
      }
    );
  };

  return (
    <div className="prose p-4">
      <h1>Add wallet</h1>
      <p>
        If a lockup is attached to this wallet it will be automatically
        discovered.
      </p>
      <p>Wallets needs to be multisig wallets</p>
      <textarea
        placeholder="Wallet IDs, separated by commas or new lines"
        value={walletIds}
        onChange={(e) => setWalletIds(e.target.value)}
        className="focus:shadow-outline mt-2 w-full px-3 py-2 leading-tight text-gray-700 focus:outline-none"
        rows={4}
      />
      <button
        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        onClick={() => {
          console.log(`Creating wallets: ${walletIds}`);
          void addMultisigWallets();
        }}
      >
        Add
      </button>
      {walletErrors.length > 0 && (
        <div className="mt-4 text-red-500">
          {walletErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {walletSucess && <p className="text-green-500">{walletSucess}</p>}
    </div>
  );
};

AddWallet.getLayout = getSidebarLayout;
export default AddWallet;
