import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

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
          {/* <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/lockup/create"
            >
              Create lockup
            </Link>
          </div> */}
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/lockup/manage"
            >
              Manage lockup
            </Link>
          </div>
          <hr />
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/staking/stake"
            >
              Stake
            </Link>
          </div>
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/staking/unstake"
            >
              Unstake
            </Link>
          </div>
          <div>
            <Link
              className="cursor-pointer hover:text-blue-500"
              href="/staking/withdraw"
            >
              Withdraw
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasurySection;
