import { thunk } from 'easy-peasy';

const INDEXER_SERVICE_URL = 'https://testnet-api.kitwallet.app';

const getAllAccountsWithKey = async (publicKey) =>
  await fetch(`${INDEXER_SERVICE_URL}/publicKey/${publicKey}/accounts`, {
    headers: { 'X-requestor': 'near' },
  }).then((r) => r.json());

const isMultisig = async (accountId, state) =>
  await state.wallets.myNearWallet.connection.connection.provider.query({
    request_type: 'call_function',
    finality: 'final',
    account_id: accountId,
    method_name: 'list_request_ids',
    args_base64: 'e30=',
  });

const getAllAccounts = async (newAccount, state) => {
  const allAccounts = await getAllAccountsWithKey(newAccount.publicKey);

  const res = await Promise.allSettled(
    allAccounts.map((accountId) => isMultisig(accountId, state)),
  );

  return res
    .map((v, index) => ({
      status: v.status,
      accountId: allAccounts[index],
      publicKey: newAccount.publicKey,
      wallet: newAccount.wallet,
      addedBy: allAccounts[index] === newAccount.accountId ? 'user' : 'auto',
    }))
    .filter((v) => v.status === 'fulfilled')
    .map((v) => ({
      accountId: v.accountId,
      publicKey: v.publicKey,
      wallet: v.wallet,
      addedBy: v.addedBy,
    }));
};

export const completeConnection = thunk(
  async (_actions, payload, { getStoreActions, getStoreState }) => {
    const state = getStoreState();
    const actions = getStoreActions();

    const currentUrl = new URL(window.location.href);
    const accountId = currentUrl.searchParams.get('account_id') || '';
    const allKeys = (currentUrl.searchParams.get('all_keys') || '').split(',');
    const publicKey = allKeys[0];

    currentUrl.searchParams.delete('all_keys');
    currentUrl.searchParams.delete('account_id');
    window.history.replaceState({}, '', currentUrl.origin);

    actions.wallets.setConnectionInProgress(null);

    const account = { accountId, publicKey, wallet: 'myNearWallet', addedBy: 'user' };
    const accounts = await getAllAccounts(account, state);
    console.log(accounts);
    if (accounts.length > 0) actions.addAccount({ accounts, account });
  },
);
// {"data":{"selectedAccount":{"accountId":"eclpseeer-multisig-test-2.testnet","publicKey":"ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6","wallet":"myNearWallet","addedBy":"user"},"accounts":[{"accountId":"eclpseeer-multisig-test-1.testnet","publicKey":"ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6","wallet":"myNearWallet","addedBy":"auto"},{"accountId":"eclpseeer-multisig-test-2.testnet","publicKey":"ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6","wallet":"myNearWallet","addedBy":"auto"}]}}
