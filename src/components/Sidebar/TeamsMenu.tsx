import { Menu, Transition } from "@headlessui/react";
import { ArrowsUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import { Fragment, useState } from "react";
import { api } from "~/lib/api";
import { CreateTeamDialog } from "./CreateTeamDialog";
import LetterProfilePicture from "./LetterProfilePicture"; // Import the LetterProfilePicture component

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TeamsMenu() {
  // State to handle the visibility of the CreateTeamDialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data } = useSession({ required: true });
  const fetchTeams = () => {
    const res = api.teams.getTeamsForUser.useQuery();
    return res.data;
  };

  const currentTeam = () => {
    const res = api.teams.getTeamsForUser.useQuery();
    // take first team as current
    return res.data?.[0];
  };

  const teams = fetchTeams();
  const current = currentTeam();
  const mail = data?.user.email;
  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full items-center gap-x-2 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50">
            <LetterProfilePicture letter={current?.team.name[0] || "a"} />
            {current?.team.name}
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
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {mail && (
                <div className="flex items-center px-4 py-2 text-xs">
                  {mail}
                </div>
              )}
              {teams?.map((userTeamMap) => (
                <Menu.Item key={userTeamMap.teamId}>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "flex items-center gap-2 px-4 py-2 text-sm"
                      )}
                    >
                      {/* Render the LetterProfilePicture component before each team name */}
                      <LetterProfilePicture
                        letter={userTeamMap.team.name[0] || "a"}
                      />
                      {userTeamMap.team.name}
                      {userTeamMap.team.id === userTeamMap.team.id && (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      )}
                    </a>
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
              <hr className="my-1" />
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex items-center px-4 py-2 text-sm"
                    )}
                  >
                    Account settings
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex items-center px-4 py-2 text-sm"
                    )}
                  >
                    Support
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "flex items-center px-4 py-2 text-sm"
                    )}
                  >
                    License
                  </a>
                )}
              </Menu.Item>
              <form method="POST" action="#">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="submit"
                      className={classNames(
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "flex w-full items-center px-4 py-2 text-left text-sm"
                      )}
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
