import { providers } from "near-api-js";
import { type Provider } from "near-api-js/lib/providers";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface NearContextType {
  network: "mainnet" | "testnet";
  switchNetwork: () => void;
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
    const switchNetwork = () => {
      if (network === "mainnet") {
        setNetwork("testnet");
      } else {
        setNetwork("mainnet");
      }
    };

    return {
      network,
      switchNetwork,
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
    throw new Error("useNearContext must be used within a NearContextProvider");
  }

  return context;
}
