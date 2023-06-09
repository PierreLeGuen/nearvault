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
  const mutation = api.teams.addWalletForTeam.useMutation({});

  const [walletId, setWalletId] = useState<string>("");
  const [walletError, setWalletError] = useState<string>("");
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

  const addMultisigWallet = async (walletId: string) => {
    setWalletError("");
    setWalletSucess("");

    const ok = await assertValidMultisigAccount(walletId);
    if (!ok) {
      setWalletError("Not a valid multisig account");
    }

    mutation.mutate(
      {
        walletAddress: walletId,
        teamId: currentTeam.id,
      },
      {
        onSuccess: (data) => {
          setWalletSucess(`Created wallet: ${JSON.stringify(data)}`);
        },
        onError: (error) => {
          setWalletError(`Error creating wallet: ${error.message}`);
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
      <p>The wallet needs to be a multisig wallet</p>
      <input
        type="text"
        placeholder="Wallet ID"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
        className="focus:shadow-outline mt-2 w-full px-3 py-2 leading-tight text-gray-700 focus:outline-none"
      />
      <button
        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        onClick={() => {
          console.log(`Creating wallet: ${walletId}`);
          void addMultisigWallet(walletId);
        }}
      >
        Add
      </button>
      {walletError && <p className="text-red-500">{walletError}</p>}
      {walletSucess && <p className="text-green-500">{walletSucess}</p>}
    </div>
  );
};

AddWallet.getLayout = getSidebarLayout;
export default AddWallet;
