import { formatNearAmount } from "near-api-js/lib/utils/format";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import {
  useWithdrawAllTransaction,
  useWithdrawTransaction,
} from "~/hooks/staking";
import { type WalletPretty } from "~/pages/staking/stake";
import { type StakedPool } from "../Staking/AllStaked";
import { TokenWithMaxInput } from "../inputs/near";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";

const formSchema = z.object({
  amountNear: z
    .string()
    .refine((v) => isNaN(Number(v)) === false, {
      message: "Must be a number",
    })
    .refine((v) => Number(v) > 0, {
      message: "Must be greater than 0",
    }),
});

export function WithdrawDialog(props: {
  wallet: WalletPretty;
  pool: StakedPool;
}) {
  const form = useZodForm(formSchema);

  const withdrawTxn = useWithdrawTransaction();
  const withdrawAllTxn = useWithdrawAllTransaction();

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    withdrawTxn.mutate({
      wallet: props.wallet,
      poolId: props.pool.validator_id,
      amountNear: values.amountNear,
      maxAmountYocto: props.pool.withdraw_available,
    });
  }

  function onWithdrawAll() {
    withdrawAllTxn.mutate({
      wallet: props.wallet,
      poolId: props.pool.validator_id,
    });
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Withdraw</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw from {props.pool.validator_id}</DialogTitle>
          <DialogDescription>
            Withdraw unstaked tokens from staking pool.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TokenWithMaxInput
              control={form.control}
              name="amountNear"
              label="Amount to withdraw in NEAR"
              description={`You can withdraw up to ${formatNearAmount(
                props.pool.withdraw_available,
              )} NEAR.`}
              placeholder="10"
              rules={{ required: true }}
              disabled={false}
              maxIndivisible={props.pool.withdraw_available}
              decimals={24}
              symbol="NEAR"
            />

            <span className="inline-flex gap-2">
              <Button type="submit">Withdraw</Button>
              <Button type="button" variant="outline" onClick={onWithdrawAll}>
                Unstake all tokens
              </Button>
            </span>
            {withdrawTxn.isError && (
              <div className="text-red-500">
                {(withdrawTxn.error as Error).message}
              </div>
            )}
            {withdrawTxn.isSuccess && (
              <div className="text-green-500">Successfully sent request!</div>
            )}
            {withdrawAllTxn.isError && (
              <div className="text-red-500">
                {(withdrawAllTxn.error as Error).message}
              </div>
            )}
            {withdrawAllTxn.isSuccess && (
              <div className="text-green-500">Successfully sent request!</div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
