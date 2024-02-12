import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import ContentCentered from "~/components/ContentCentered";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const VerifyPage = () => {
  const router = useRouter();

  return (
    <ContentCentered className="min-h-screen items-center justify-center gap-2">
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
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>Magic link available in your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <strong>Follow these steps:</strong>
          <ul className="list-inside list-decimal">
            <li>Open the email we just sent you.</li>
            <li>Click on the magic link in the email.</li>
            <li>
              You will be redirected back to our site and logged in
              automatically.
            </li>
          </ul>
          <p>
            If you didn{"'"}t receive the email, check your spam folder or try
            resending the magic link.
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mt-4"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    </ContentCentered>
  );
};

export default VerifyPage;
