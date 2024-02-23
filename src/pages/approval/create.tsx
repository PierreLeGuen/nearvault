import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { CreateMultisigWalletCard } from "~/components/Welcome/CreateMultisigWalletCard";
import HeaderTitle from "~/components/ui/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { WalletSelectorContextProvider } from "~/contexts/WalletSelectorContext";
import { type NextPageWithLayout } from "../_app";

const CreateMultisigWallet: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1">Create a multisig wallet</HeaderTitle>
      <Tabs defaultValue="via-wallet">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="via-wallet">Via regular wallet</TabsTrigger>
          <TabsTrigger value="via-multisig">Via Multisig wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="via-wallet">
          <CreateMultisigWalletCard
            onMultisigCreateSuccess={() => {
              console.log("Multisig created");
            }}
          />
        </TabsContent>
        <TabsContent value="via-multisig">
          <CreateMultisigWalletCard
            onMultisigCreateSuccess={() => {
              console.log("Multisig created");
            }}
            viaMultisig={true}
          />
        </TabsContent>
      </Tabs>
    </ContentCentered>
  );
};

CreateMultisigWallet.getLayout = (page) => {
  return (
    <WalletSelectorContextProvider>
      {getSidebarLayout(page)}
    </WalletSelectorContextProvider>
  );
};

export default CreateMultisigWallet;
