import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { type Beneficiary } from "@prisma/client";
import { Fragment, useState } from "react";

const BeneficiariesDropDown = ({
  beneficiaries,
  selectedBeneficiary,
  setSelectedBeneficiary,
}: {
  beneficiaries: Beneficiary[] | undefined;
  selectedBeneficiary: Beneficiary | undefined;
  setSelectedBeneficiary: (wallet: Beneficiary) => void;
}) => {
  const [query, setQuery] = useState("");

  if (!beneficiaries) {
    beneficiaries = [];
  }

  const filteredBenefs =
    query === ""
      ? beneficiaries
      : beneficiaries.filter((b) =>
          (b.firstName + " " + b.lastName + " " + b.walletAddress)
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    <Combobox value={selectedBeneficiary} onChange={setSelectedBeneficiary}>
      <div className="not-prose relative mt-1">
        <div className="relative z-20 w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={(b: Beneficiary) =>
              `${b.firstName} ${b.lastName} (${b.walletAddress})`
            }
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredBenefs.length === 0 ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredBenefs.map((b) => (
                <Combobox.Option
                  key={b.id}
                  className={({ active }) =>
                    `relative cursor-default select-none list-none py-2 pl-10 pr-4 ${
                      active ? "bg-teal-600 text-white" : "text-gray-900"
                    }`
                  }
                  value={b}
                >
                  {({ selected, active }) => (
                    <div>
                      <div
                        className={`flex flex-col truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        <span>{`${b.firstName} ${b.lastName}`}</span>
                        <span className="text-xs">{b.walletAddress}</span>
                      </div>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-teal-600"
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
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

export default BeneficiariesDropDown;
