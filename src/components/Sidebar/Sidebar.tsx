import { useNearContext } from "~/context/near";
import ApprovalSection from "./ApprovalSection";
import PaymentsSection from "./PaymentsSection";
import TeamsMenu from "./TeamsMenu";
import TreasurySection from "./TreasurySection";

const Sidebar = () => {
  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col">
      <TeamsMenu />
      <div className="flex h-screen flex-col px-3 pb-3">
        <TreasurySection />
        <PaymentsSection />
        <ApprovalSection />
        <div className="flex-grow"></div>
        {/* <OffchainProfile /> */}
        <CurrentNetwork />
      </div>
    </div>
  );
};

const CurrentNetwork = () => {
  const { network, switchNetwork } = useNearContext();

  return (
    <div className="prose flex items-center justify-center">
      <div
        className="text-xs text-gray-500"
        onClick={() => {
          void switchNetwork();
        }}
      >
        Current network:
      </div>
      <div className="prose ml-1 text-xs text-gray-500">{network}</div>
    </div>
  );
};

export default Sidebar;
