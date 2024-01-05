import { z } from "zod";
import { getSidebarLayout } from "~/components/Layout";
import { DateField } from "~/components/inputs/date";
import { SwitchInput } from "~/components/inputs/switch";
import { TextAreaInput } from "~/components/inputs/text-area";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { useReporting } from "~/hooks/accounting";
import { useZodForm } from "~/hooks/form";
import { type NextPageWithLayout } from "../_app";

const formSchema = z.object({
  from: z.date(),
  to: z.date(),
  includeBalances: z.boolean(),
  accounts: z.string().transform((value) => {
    const wallets = value
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter(Boolean);
    const errors = [];
    for (const walletId of wallets) {
      try {
        z.string().parse(walletId);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
    return wallets;
  }),
});

const Tta: NextPageWithLayout = () => {
  const form = useZodForm(formSchema, {
    defaultValues: {
      // start one month ago
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date(),
      includeBalances: false,
    },
  });
  const mutation = useReporting();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    mutation.mutate({
      startDate: values.from,
      endDate: values.to,
      accountIds: values.accounts,
      includeBalances: values.includeBalances,
    });
  };

  return (
    <div className="flex flex-grow flex-col items-center gap-10 py-10 ">
      <Card className="max-w-[600px]">
        <CardHeader>
          <CardTitle>Reporting</CardTitle>
          <CardDescription>
            Generate a report of all outgoing and incoming token transactions
            (supports NEAR and NEP-141 tokens).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <DateField
                label="Start date"
                placeholder="Select a date"
                description="Date to start the report from."
                name="from"
                control={form.control}
                rules={{
                  required: "Please select a start date.",
                }}
              />
              <DateField
                label="End date"
                placeholder="Select a date"
                description="Date to end the report at."
                name="to"
                control={form.control}
                rules={{
                  required: "Please select an end date.",
                }}
              />
              <TextAreaInput
                control={form.control}
                name={"accounts"}
                label="Wallet IDs"
                placeholder="Wallet IDs, seperated by commas or new lines, eg: acme.near, bob.multisignature.near"
                rules={{ required: true }}
              />
              <SwitchInput
                control={form.control}
                name={"includeBalances"}
                label="Include Balances"
                description="Note: Reports with balances may take significantly longer to generate."
                rules={{ required: false }}
              />
              <Button type="submit" disabled={mutation.isLoading}>
                Submit
              </Button>
              {mutation.error && (
                <div className="text-red-500">
                  {(mutation.error as Error).message}
                </div>
              )}
              {mutation.isSuccess && (
                <div className="text-green-500">
                  Successfully generated report!
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

Tta.getLayout = getSidebarLayout;
export default Tta;
