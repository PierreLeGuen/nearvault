import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldValues,
  type Path,
  type PathValue,
  type Resolver,
  useForm,
  type UseFormReturn,
} from "react-hook-form";
import { type z } from "zod";

export type UseZodFormParams<Schema extends z.ZodType<FieldValues>> =
  Parameters<typeof useForm<z.infer<Schema>>>[0];

export const useHookFormDefaultProps = {
  mode: "onBlur",
  reValidateMode: "onChange",
  criteriaMode: "all",
  delayError: 300,
  shouldFocusError: true,
} satisfies UseZodFormParams<z.ZodObject<FieldValues>>;

export function useZodForm<Schema extends z.ZodObject<FieldValues>>(
  schema: Schema,
  props?: UseZodFormParams<Schema>,
) {
  return useForm<z.infer<Schema>>({
    ...useHookFormDefaultProps,
    ...props,
    // Forms are typed by the schema's output, as before; the resolver itself
    // still hands handleSubmit the parsed (transformed) values.
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<Schema>>,
  });
}

export type ZodSubmitHandler<Schema extends z.ZodObject<FieldValues>> =
  Parameters<ReturnType<typeof useZodForm<Schema>>["handleSubmit"]>[0];

export function updateFields<Schema extends z.ZodObject<FieldValues>>(
  form: UseFormReturn<z.infer<Schema>>,
  schema: Schema,
  fieldsToUpdate: Partial<z.infer<Schema>>,
) {
  if (fieldsToUpdate && Object.keys(fieldsToUpdate).length > 0) {
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (key in schema.shape && !!value) {
        form.setValue(
          key as Path<z.infer<Schema>>,
          value as PathValue<z.infer<Schema>, Path<z.infer<Schema>>>,
        );
      }
    }
  }
}
