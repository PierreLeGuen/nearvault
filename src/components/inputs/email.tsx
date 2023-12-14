import {
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { type InputProps } from "~/lib/validation/inputs";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export function EmailInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: UseControllerProps<TFieldValues, TName> & InputProps) {
  return (
    <FormField
      {...props}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="capitalize">
            {props.label ?? field.name}
            {props.rules?.required && " *"}
          </FormLabel>
          <FormControl>
            <Input {...field} placeholder={props.placeholder} type="email" />
          </FormControl>
          <FormDescription>{props.description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
