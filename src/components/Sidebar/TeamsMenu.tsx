import { Menu, Transition } from "@headlessui/react";
import { ArrowsUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { CreateTeamDialog } from "./CreateTeamDialog";
import LetterProfilePicture from "./LetterProfilePicture"; // Import the LetterProfilePicture component

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TeamsMenu() {
  // State to handle the visibility of the CreateTeamDialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data } = useSession({ required: true });

  const { setCurrentTeam, currentTeam } = usePersistingStore();

  const { data: teams } = api.teams.getTeamsForUser.useQuery();

  if (!currentTeam) {
    setCurrentTeam(teams?.[0]);
  }

  const mail = data?.user.email;

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full items-center gap-x-2 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            <LetterProfilePicture letter={currentTeam?.name || "L"} />
            {currentTeam?.name || "Loading..."}
            <div className="flex-grow"></div>
            <ArrowsUpDownIcon className="h-4 w-4" />
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
          <Menu.Items className="absolute left-0 right-0 z-10 m-auto mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {mail && (
                <div className="flex items-center px-4 py-2 text-xs">
                  {mail}
                </div>
              )}
              {teams?.map((userTeamMap) => (
                <Menu.Item key={userTeamMap.teamId}>
                  {({ active }) => (
                    <button
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "flex w-full items-center gap-2 px-4 py-2 text-sm"
                      )}
                      onClick={() => {
                        setCurrentTeam(userTeamMap);
                      }}
                    >
                      <LetterProfilePicture
                        letter={userTeamMap.team.name[0] || "a"}
                      />
                      {userTeamMap.team.name}
                      {currentTeam?.id === userTeamMap.teamId && (
                        <>
                          <div className="flex flex-grow"></div>
                          <CheckIcon className="h-4 w-4 font-bold text-gray-900" />
                        </>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
              <hr className="my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex w-full items-center px-4 py-2 text-sm"
                    )}
                  >
                    Create team
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href={"/team/manage"}
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex w-full items-center px-4 py-2 text-sm"
                    )}
                  >
                    Manage team
                  </Link>
                )}
              </Menu.Item>
              <hr className="my-1" />

              <form method="POST" action="#">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="submit"
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "flex w-full items-center px-4 py-2 text-left text-sm"
                      )}
                      onClick={() => void signOut()}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </form>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <CreateTeamDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
    </>
  );
}
