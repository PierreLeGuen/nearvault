import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { type WalletPretty } from "~/pages/staking/stake";

const WalletsDropDown = ({
  wallets,
  selectedWallet,
  setSelectedWallet,
  r,
}: {
  wallets: WalletPretty[];
  selectedWallet: WalletPretty | undefined;
  setSelectedWallet: (wallet: WalletPretty) => void;
  r?: UseFormRegisterReturn<"newMultisigWalletId"> | undefined;
}) => {
  const [query, setQuery] = useState("");

  const filteredPeople =
    query === ""
      ? wallets
      : wallets.filter((walletPretty) =>
          walletPretty.prettyName
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    <Combobox value={selectedWallet} onChange={setSelectedWallet}>
      <div className="not-prose relative z-40 mt-1">
        <Combobox.Button>
          {({ open }) => (
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                displayValue={(walletPretty: WalletPretty) =>
                  walletPretty.prettyName
                }
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                onClick={(e) => {
                  if (open) e.stopPropagation();
                }}
                {...r}
              />
              <span className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </div>
          )}
        </Combobox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredPeople.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredPeople.map((walletPretty) => (
                <Combobox.Option
                  key={walletPretty.walletDetails.id}
                  className={({ active }) =>
                    `relative z-10 cursor-default select-none list-none py-2 pl-10 pr-4 ${
                      active ? "bg-teal-600 text-white" : "text-gray-900"
                    }`
                  }
                  value={walletPretty}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {walletPretty.prettyName}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-teal-600"
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
};

export default WalletsDropDown;
