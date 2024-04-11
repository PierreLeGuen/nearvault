import {
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { type InputProps } from "~/lib/validation/inputs";
import { Button } from "../ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export function TokenWithMaxInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseControllerProps<TFieldValues, TName> &
    InputProps & {
      maxIndivisible: string;
      decimals: number;
      symbol: string;
    },
) {
  return (
    <FormField
      {...props}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="capitalize">
            {props.label ?? field.name}
            {props.rules?.required && " *"}
          </FormLabel>
          <FormControl>
            <div className="flex flex-row">
              <Input
                {...field}
                placeholder={props.placeholder}
                type="text"
                className="rounded-r-none"
              />
              <Button
                type="button"
                className="rounded-l-none"
                disabled={props.disabled}
                onClick={() => {
                  field.onChange(
                    (
                      parseInt(props.maxIndivisible) /
                      10 ** props.decimals
                    ).toString(),
                  );
                }}
              >
                <div className="inline-flex items-center">Max</div>
              </Button>
            </div>
          </FormControl>
          <FormDescription>
            {props.description
              ? props.description
              : `You can transfer up to: ${(
                  parseInt(props.maxIndivisible) /
                  10 ** props.decimals
                ).toString()} ${props.symbol}`}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
