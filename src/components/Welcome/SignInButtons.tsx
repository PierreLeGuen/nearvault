import { BuiltInProviderType } from "next-auth/providers";
import { ClientSafeProvider, LiteralUnion, signIn } from "next-auth/react";
import { Button } from "../ui/button";

export const SignInButtons = ({
  providers,
}: {
  providers:
    | any[]
    | Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>;
}) => {
  return (
    <>
      {Object.values(providers).map((provider) => (
        <Button
          onClick={() => signIn(provider.id)}
          className="w-full"
          key={provider}
        >
          Sign in with {provider.name}
        </Button>
      ))}
    </>
  );
};

export default SignInButtons;
