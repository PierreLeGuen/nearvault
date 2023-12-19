import { formatNearAmount } from "near-api-js/lib/utils/format";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useUnstakeTransaction } from "~/hooks/staking";
import { WalletPretty } from "~/pages/staking/stake";
import { StakedPool } from "../Staking/AllStaked";
import { NearWithMaxInput } from "../inputs/near";
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

export function UnstakeDialog(props: {
  wallet: WalletPretty;
  pool: StakedPool;
}) {
  const form = useZodForm(formSchema);
  const unstakeTxn = useUnstakeTransaction();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    unstakeTxn.mutate({
      wallet: props.wallet,
      poolId: props.pool.validator_id,
      amountNear: values.amountNear,
    });
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Unstake</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unstake from {props.pool.validator_id}</DialogTitle>
          <DialogDescription>
            Unstake from staking pool. You will have to wait 3 epochs before you
            can withdraw the tokens out of the staking pool.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <NearWithMaxInput
              control={form.control}
              name="amountNear"
              label="Amount to unstake in NEAR"
              description={`You can unstake up to ${formatNearAmount(
                props.pool.deposit,
              )} NEAR.`}
              placeholder="10"
              rules={{ required: true }}
              disabled={false}
              yoctoMax={props.pool.deposit}
            />
            <Button type="submit">
              <div className="inline-flex items-center">Unstake</div>
            </Button>
            {unstakeTxn.isError && (
              <div className="text-red-500">
                {(unstakeTxn.error as Error).message}
              </div>
            )}
            {unstakeTxn.isSuccess && (
              <div className="text-green-500">Successfully sent request!</div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
