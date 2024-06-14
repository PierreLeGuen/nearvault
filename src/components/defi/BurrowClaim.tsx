import { type z } from "zod";
import { burrowClaimRewardsSchema, useGetBurrowClaim } from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { SenderFormField } from "../inputs/sender";
import { Button } from "../ui/button";
import { Form } from "../ui/form";

const BurrowClaim = () => {
  const form = useZodForm(burrowClaimRewardsSchema);

  const walletsQuery = useTeamsWalletsWithLockups();
  const burrowClaimMutation = useGetBurrowClaim();
  const onSubmit = (values: z.infer<typeof burrowClaimRewardsSchema>) => {
    console.log(values);
    burrowClaimMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <SenderFormField
          isLoading={walletsQuery.isLoading}
          wallets={walletsQuery.data?.filter((w) => !w.isLockup)}
          name="accountId"
          control={form.control}
          rules={{
            required: "Please select a wallet.",
          }}
          description="Funding wallet."
          placeholder="Select a wallet"
          label="Sender"
        />

        <Button type="submit">Claim all rewards</Button>
      </form>
    </Form>
  );
};

export default BurrowClaim;
