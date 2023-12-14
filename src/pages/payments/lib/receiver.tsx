import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Beneficiary } from "@prisma/client";
import {
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { type InputProps } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

export function ReceiverFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseControllerProps<TFieldValues, TName> &
    InputProps & {
      isLoading?: boolean;
      receivers?: Beneficiary[] | undefined;
      label: string;
      placeholder: string;
      description: string;
    },
) {
  const { isLoading, receivers } = props;
  return (
    <FormField
      {...props}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{props.label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                  disabled={isLoading}
                >
                  {isLoading && "Loading..."}
                  {!isLoading &&
                    (field.value
                      ? receivers?.find(
                          (wallet) => wallet.walletAddress === field.value,
                        )?.firstName
                      : `${props.placeholder}`)}
                  <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <ScrollArea className="h-[550px]">
                <Command>
                  <CommandInput placeholder="Search wallet..." />
                  <CommandEmpty>No wallet found.</CommandEmpty>
                  <CommandGroup>
                    {receivers?.map((beneficiary) => (
                      <CommandItem
                        value={beneficiary.walletAddress}
                        key={beneficiary.walletAddress}
                        onSelect={() => {
                          field.onChange({
                            target: {
                              value: beneficiary.walletAddress,
                            },
                          });
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            beneficiary.walletAddress === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {beneficiary.firstName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <FormDescription>{props.description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
