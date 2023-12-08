import { useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { getSidebarLayout } from "~/components/Layout";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { calculateLockup } from "~/lib/lockup/lockup";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { type WalletPretty } from "../staking/stake";
import { addRequestToMultisigWallet } from "./manage";

interface IFormInput {
  newMultisigWalletId: string;
  fundingMultisigWalletId: string;
  members: string;
  numConfirmations: number;
}

const MULTISIG_FACTORY = "multisignature.near";

const CreateMultisigWallet: NextPageWithLayout = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();
  const { currentTeam, newNearConnection } = usePersistingStore();

  const [fromWallet, setFromWallet] = useState<WalletPretty>();

  const walletSelector = useWalletSelector();

  const { data, isLoading } = api.teams.getWalletsForTeam.useQuery(
    { teamId: currentTeam?.id || "" },
    { enabled: !!currentTeam },
  );

  const { data: teamsWallet, isLoading: walletsLoading } = useQuery(
    ["currentTeamWallets", currentTeam],
    async () => {
      if (!data || data.length == 0 || data[0] === undefined) {
        throw new Error("No wallets found");
      }
      const w: WalletPretty[] = [];
      for (const wallet of data) {
        w.push({
          walletDetails: wallet,
          prettyName: wallet.walletAddress,
          isLockup: false,
          ownerAccountId: undefined,
        });
        try {
          const lockupValue = calculateLockup(
            wallet.walletAddress,
            "lockup.near",
          );
          const nearConn = await newNearConnection();
          await (await nearConn.account(lockupValue)).state();

          w.push({
            prettyName: "Lockup of " + wallet.walletAddress,
            walletDetails: {
              walletAddress: lockupValue,
              id: lockupValue,
              teamId: "na",
            },
            isLockup: true,
            ownerAccountId: wallet.walletAddress,
          });
        } catch (_) {}
      }
      return w;
    },
    {
      enabled: !!currentTeam && !!data,
    },
  );

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    data.numConfirmations = Number(data.numConfirmations);
    void createMultisigWalletRequest(data);
  };

  const r = register("newMultisigWalletId", {
    validate: (value) => value === "multisig.pierre-dev.near",
  });

  const createMultisigWalletRequest = async (data: IFormInput) => {
    const fromWalletId =
      fromWallet?.ownerAccountId || fromWallet?.walletDetails.walletAddress;
    if (!fromWalletId) {
      throw new Error("No wallet selected");
    }

    const n = await newNearConnection();
    try {
      await (await n.account(data.newMultisigWalletId)).getAccountDetails();
    } catch (e) {
      console.log(e);
    }

    await assertCorrectMultisigWallet(walletSelector, fromWalletId);

    const wallet = await walletSelector.selector.wallet();

    await addRequestToMultisigWallet(wallet, fromWalletId, MULTISIG_FACTORY, [
      {
        type: "FunctionCall",
        method_name: "create",
        args: btoa(
          JSON.stringify({
            name: data.newMultisigWalletId,
            members: data.members
              .replaceAll(" ", "")
              .split("\n")
              .join(",")
              .split(","),
            num_confirmations: data.numConfirmations,
          }),
        ),
        deposit: parseNearAmount("5"),
        gas: "150000000000000",
      },
    ]);
  };

  if (isLoading || walletsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prose p-3">
      <h1>Create multisig wallet</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <label htmlFor="fundingMultisigWalletId">Funding multisig wallet</label>
        <WalletsDropDown
          wallets={teamsWallet || []}
          selectedWallet={fromWallet}
          setSelectedWallet={setFromWallet}
          r={r}
        />
        {errors.fundingMultisigWalletId && (
          <div className="text-red-500">Incorrect multisig wallet</div>
        )}

        <label>New multisig name</label>
        <input
          type="text"
          placeholder="mymultisig"
          {...register("newMultisigWalletId", {
            validate: (value) => value !== "",
          })}
        />
        {errors.newMultisigWalletId && (
          <div className="text-red-500">Incorrect multisig wallet</div>
        )}

        <label>Members</label>
        <textarea
          placeholder={`ed25519:publickey`}
          {...register("members", {
            validate: (value) => value !== "ed25519:",
          })}
        />
        {errors.members && (
          <div className="text-red-500">Incorrect members</div>
        )}

        <label>Number of confirmations</label>
        <input
          type="number"
          placeholder="2"
          {...register("numConfirmations", {
            validate: (value) => value > 0,
          })}
        />
        {errors.numConfirmations && (
          <div className="text-red-500">Incorrect number of confirmations</div>
        )}

        <input
          type="submit"
          value="Create multisig wallet"
          className="my-3 cursor-pointer rounded bg-blue-200 px-2 py-1 hover:bg-blue-300"
        />
      </form>
    </div>
  );
};

CreateMultisigWallet.getLayout = getSidebarLayout;

export default CreateMultisigWallet;
