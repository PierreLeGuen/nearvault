import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { type Token } from "~/pages/payments/lib/transformations";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const CurrenciesDropDown = ({
  tokens,
  currentToken,
  setCurrentToken,
}: {
  tokens: Token[];
  currentToken: Token | undefined;
  setCurrentToken: (token: Token) => void;
}) => {
  return (
    <Menu as="div" className="relative inline-block w-32 text-left">
      <div>
        <Menu.Button className="w-full items-center justify-between gap-x-2 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
          {currentToken?.symbol || "Select a token"}
          <div className="flex-grow"></div>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {tokens.map((token, idx) => (
              <Menu.Item key={idx}>
                {({ active }) => (
                  <button
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex w-full items-center justify-center px-4 py-2 text-sm",
                    )}
                    onClick={() => {
                      console.log(token);
                      setCurrentToken(token);
                    }}
                  >
                    {token.symbol}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default CurrenciesDropDown;
