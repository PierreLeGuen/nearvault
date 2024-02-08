import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { getSidebarLayout } from "~/components/Layout";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { type NextPageWithLayout } from "../_app";
import { type WalletPretty } from "../staking/stake";

interface IFormInput {
  newMultisigWalletId: string;
  fundingMultisigWalletId: string;
  members: string;
  numConfirmations: number;
}

const CreateMultisigWallet: NextPageWithLayout = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();
  const [fromWallet, setFromWallet] = useState<WalletPretty>();

  const { data, isLoading } = useTeamsWalletsWithLockups();

  const onSubmit: SubmitHandler<IFormInput> = (values) => {
    // createMultisig({ values, creatorAccount: fromWallet });
    // TODO: switch to new create multisig view
  };

  const r = register("newMultisigWalletId");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prose p-3">
      <h1>Create multisig wallet</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <label htmlFor="fundingMultisigWalletId">Funding multisig wallet</label>
        <WalletsDropDown
          wallets={data}
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
