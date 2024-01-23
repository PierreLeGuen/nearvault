import { TrashIcon } from "@heroicons/react/20/solid";
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

export function MembersInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: UseControllerProps<TFieldValues, TName> &
    InputProps & {
      maxLength?: number;
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
            <>
              {field?.value?.map((value, index) => (
                <div key={index} className="flex flex-row gap-2">
                  <Input
                    value={value}
                    placeholder={props.placeholder}
                    key={index}
                    onChange={(event) => {
                      const newValue = [...field.value];
                      newValue[index] = event.target.value;
                      field.onChange(newValue);
                    }}
                  />
                  <Button
                    onClick={() => {
                      const newValue = [...field.value];
                      newValue.splice(index, 1);
                      field.onChange(newValue);
                    }}
                    disabled={field.value.length === 1}
                    variant="destructive"
                    type="button"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  field.onChange([...field.value, ""]);
                }}
                type="button"
              >
                Add
              </Button>
            </>
          </FormControl>
          <FormDescription>{props.description}</FormDescription>
          <div className="flex flex-row items-start justify-between">
            <span>
              <FormMessage />
            </span>
            {props.maxLength && (
              <span className="text-text-gray ml-3">
                {props.maxLength -
                  (typeof field.value === "string" ? field.value : "")
                    .length}{" "}
                characters left
              </span>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
