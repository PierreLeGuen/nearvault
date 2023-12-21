import { useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import usePersistingStore from '~/store/useStore';
import { api } from '~/lib/api';

export const useGetMultisigAccounts = () => {
  const getMultisigAccounts = useStoreActions(
    (store: any) => store.pages.approval.manage.getMultisigAccounts,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { currentTeam } = usePersistingStore();

  const { data: teamAccounts } = api.teams.getWalletsForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });

  useEffect(() => {
    teamAccounts && getMultisigAccounts({ teamAccounts, setIsLoading });
  }, [teamAccounts]);

  return isLoading;
};