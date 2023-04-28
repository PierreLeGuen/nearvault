import { providers } from "near-api-js";
import { Provider } from "near-api-js/lib/providers";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface NearContextType {
  network: "mainnet" | "testnet";
  archivalNodeUrl: string;
  archival_provider: Provider;
}

const NearContext = createContext<NearContextType | null>(null);

export const NearContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [network, setNetwork] = useState<"mainnet" | "testnet">("mainnet");
  const archivalNodeUrl = useMemo(() => {
    switch (network) {
      case "mainnet":
        return "https://archival-rpc.mainnet.near.org";
      case "testnet":
        return "https://archival-rpc.testnet.near.org";
    }
  }, [network]);

  const value = useMemo(() => {
    return {
      network,
      archivalNodeUrl,
      archival_provider: new providers.JsonRpcProvider({
        url: archivalNodeUrl,
      }),
    };
  }, [network, archivalNodeUrl]);

  return (
    <NearContext.Provider value={value}> {children} </NearContext.Provider>
  );
};

export function useNearContext() {
  const context = useContext(NearContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }

  return context;
}
