import { useQuery } from "@tanstack/react-query";
import { type Near } from "near-api-js";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
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
}

const CreateMultisigWallet: NextPageWithLayout = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();
  const { currentTeam, newNearConnection } = usePersistingStore();
  const [nearConnection, setNearConnection] = useState<Near>();

  const [fromWallet, setFromWallet] = useState<WalletPretty>();

  const walletSelector = useWalletSelector();

  const { data, isLoading } = api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    { enabled: !!currentTeam }
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
            "lockup.near"
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
    }
  );

  useEffect(() => {
    const getNearConnection = async () => {
      const near = await newNearConnection();
      setNearConnection(near);
    };

    void getNearConnection();
  }, [newNearConnection]);

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(JSON.stringify(data));
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

    const w = await walletSelector.selector.wallet();

    // TODO: get the actual multisig factory address
    await addRequestToMultisigWallet(
      w,
      fromWalletId,
      "multisig-factory-v0.near-finance.near",
      [
        {
          type: "FunctionCall",
          method_name: "create",
          args: btoa(
            JSON.stringify({
              name: data.newMultisigWalletId,
              members: ["ed25519:8dpAgHR8zqcHqfX2abqq9F6JGEJFEFd42vHR6kDkpZ5D"], // TODO
              num_confirmations: 1, // TODO
            })
          ),
          deposit: parseNearAmount("0"),
          gas: "150000000000000",
        },
      ]
    );
  };

  if (isLoading || walletsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prose">
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

        <label>New multisig ID</label>
        <input
          type="text"
          placeholder="mymultisig.near"
          {...register("newMultisigWalletId", {
            validate: (value) => value !== "bill", // TODO: check wallet doesn't exist
          })}
        />
        {errors.newMultisigWalletId && (
          <div className="text-red-500">Incorrect multisig wallet</div>
        )}

        <label>Members</label>
        <textarea
          placeholder={`example.near\ned25519:publickey`}
          {...register("members", {
            validate: (value) => value !== "bill",
          })}
        />
        {errors.members && (
          <div className="text-red-500">Incorrect members</div>
        )}

        <input type="submit" value="Create multisig wallet" />
      </form>
    </div>
  );
};

CreateMultisigWallet.getLayout = getSidebarLayout;

export default CreateMultisigWallet;
