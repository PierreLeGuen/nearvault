import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth";
import { getProviders, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SignInButtons from "~/components/Welcome/SignInButtons";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { authOptions } from "~/server/auth/auth";
import { NextPageWithLayout } from "../_app";

const StartPage: NextPageWithLayout = ({
  providers,
  session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 sm:flex-row">
      <div className="flex w-[200px] flex-1 flex-col items-center justify-center gap-3 rounded border p-8">
        <div className="flex flex-col items-center">
          <Link href={"/"}>
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={32}
              className="mr-2"
            />
          </Link>
        </div>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Sign in your account to access the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div>
                <Link href={"/lockup/manage"} className="w-full">
                  <Button variant="outline" className="inline-flex h-12 w-full">
                    <Image
                      src={session?.user?.image || "/account.png"}
                      width={32}
                      height={32}
                      alt="profile picture"
                      className="mr-2 h-5 w-5 rounded-full"
                    />
                    <div className="my-20 flex flex-col">
                      <span className="text-sm">
                        Continue
                        {session.user.name ? ` as ${session.user.name}` : ""}
                      </span>
                      <span className="text-xs">{session.user.email}</span>
                    </div>
                  </Button>
                </Link>
                <Button
                  onClick={() => void handleSignOut()}
                  variant="link"
                  className="w-full"
                >
                  Switch account...
                </Button>
              </div>
            ) : (
              <SignInButtons providers={providers} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // // If the user is already logged in, redirect.
  // // Note: Make sure not to redirect to the same page
  // // To avoid an infinite loop!
  // if (session) {
  //   return { redirect: { destination: "/auth/signin" } };
  // }

  // console.log("session", session);

  const providers = await getProviders();

  return {
    props: { providers: providers, session },
  };
}

StartPage.getLayout = (page) => (
  <div className="relative flex min-h-screen">{page}</div>
);

export default StartPage;
