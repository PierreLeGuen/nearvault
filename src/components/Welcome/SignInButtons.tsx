import { BuiltInProviderType } from "next-auth/providers";
import { ClientSafeProvider, LiteralUnion, signIn } from "next-auth/react";
import { z } from "zod";
import { useZodForm } from "~/hooks/form";
import { EmailInput } from "../inputs/email";
import { Button } from "../ui/button";
import { Form } from "../ui/form";

const emailFormSchema = z.object({
  email: z.string().email(),
});

export const SignInButtons = ({
  providers,
}: {
  providers: Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>;
}) => {
  const sendEmail = async (email: string) => {
    await signIn("email", {
      email: email,
    });
  };

  const EmailProvider = ({
    emailProvider,
  }: {
    emailProvider: ClientSafeProvider;
  }) => {
    const emailForm = useZodForm(emailFormSchema);

    const onSubmit = async (data: z.infer<typeof emailFormSchema>) => {
      await sendEmail(data.email);
    };

    return (
      <div className="flex w-full flex-col">
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onSubmit)}>
            <EmailInput
              control={emailForm.control}
              name="email"
              placeholder="Email"
              rules={{ required: true }}
              defaultValue=""
              disabled={false}
            />

            <Button className="w-full" type="submit">
              Sign in with {emailProvider.name}
            </Button>
          </form>
        </Form>
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-2">
      {Object.values(providers)
        .filter((p) => p.name !== "Email")
        .map((provider) => (
          <Button
            onClick={() => signIn(provider.id)}
            className="w-full"
            key={provider.id}
            type="button"
          >
            Sign in with {provider.name}
          </Button>
        ))}
      <EmailProvider emailProvider={providers.email} />
    </div>
  );
};

export default SignInButtons;
