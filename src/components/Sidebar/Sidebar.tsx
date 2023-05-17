import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import { useNearContext } from "~/context/near";
import OffchainProfile from "./OffchainProfile";
import TeamsMenu from "./TeamsMenu";

const Sidebar = () => {
  return (
    <div className="sticky flex h-screen w-64 flex-col">
      <TeamsMenu />
      <div className="flex h-screen flex-col px-3 pb-3">
        <TreasurySection />
        <div className="flex-grow"></div>
        <OffchainProfile />
        <CurrentNetwork />
      </div>
    </div>
  );
};

const TreasurySection = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="mb-1 w-full">
      <button
        className="focus:outline-grey-300 mb-1 flex h-11 w-full items-center justify-between rounded-lg border-4 border-white p-2 font-sans last:mb-0 hover:bg-slate-100"
        onClick={toggleExpanded}
      >
        <div>Treasury</div>
        <div>
          <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
        </div>
      </button>
      {expanded && (
        <div className="pl-4">
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/lockup/create"
            >
              Create lockup
            </Link>
          </div>
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/lockup/manage"
            >
              Manage lockup
            </Link>
          </div>
        </div>
      )}
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
