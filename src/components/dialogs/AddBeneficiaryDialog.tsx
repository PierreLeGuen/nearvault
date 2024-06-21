import { zodResolver } from "@hookform/resolvers/zod";

import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useAddBeneficiary, useGetCurrentTeam } from "~/hooks/teams";

const formSchema = z.object({
  identifier: z.string().min(2).max(50),
  accountId: z.string().min(2),
});

export const AddBeneficiaryDialog = () => {
  const [submitMessage, setSubmitMessage] = useState("");
  const currentTeamQuery = useGetCurrentTeam();
  const addBenefMut = useAddBeneficiary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      accountId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addBenefMut.mutateAsync({
        firstName: values.identifier.trim(),
        lastName: "",
        walletAddress: values.accountId.trim(),
        teamId: currentTeamQuery.data.id,
      });
      setSubmitMessage("Beneficiary created successfully!");
    } catch (error) {
      setSubmitMessage("Failed to create beneficiary. Please try again.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add address</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new address to book</DialogTitle>
          <DialogDescription>
            Adds a new address to the address book, which can be used to
            distribute funds to. This information will be encrypted and stored
            offchain.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-row gap-1">
                              <span>Off-chain name</span>
                              <QuestionMarkCircledIcon />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md bg-gray-800 p-2 text-white shadow-lg">
                            <p>Encrypted and stored offchain</p>
                            <TooltipArrow />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NEAR account ID</FormLabel>
                  <FormControl>
                    <Input placeholder="acme.near" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addBenefMut.isLoading}>
              Create Beneficiary
            </Button>
            {submitMessage && <FormMessage>{submitMessage}</FormMessage>}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
