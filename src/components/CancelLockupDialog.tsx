import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

import type Transport from "@ledgerhq/hw-transport-webhid";
import { Account, connect } from "near-api-js";
import { LedgerSigner } from "~/lib/ledger";
import { vestingTermination } from "~/lib/lockup/termination";
import { type IStore } from "~/store/useStore";

export interface LedgerClient {
  transport: Transport;
  getVersion: () => Promise<string>;
  getPublicKey: (path?: string) => Promise<Buffer>;
  sign: (transactionData: Buffer, path?: string) => Promise<Buffer>;
}

export const CancelLockupDialog = (
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  lockupId: string,
  store: IStore
) => {
  console.log("MyDialog", isOpen, setIsOpen);

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Are you sure?
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      The lockup will be cancelled. There is no way back.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        connect({
                          networkId: "mainnet",
                          nodeUrl: "https://rpc.mainnet.near.org",
                          signer: new LedgerSigner(store),
                        })
                          .then((c) => {
                            console.log("c", c);
                            vestingTermination(
                              new Account(
                                c.connection,
                                "multisig.pierre-dev.near"
                              ),
                              lockupId,
                              "multisig.pierre-dev.near",
                              "terminate_vesting"
                            )
                              .then((r) => {
                                console.log("r", r);
                              })
                              .catch((e) => {
                                console.log("vesting termination error: ", e);
                              });
                          })
                          .catch((e) => {
                            console.log("connect error: ", e);
                          });
                      }}
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Abort
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
