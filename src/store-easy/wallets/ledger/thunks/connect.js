import { thunk } from 'easy-peasy';
import { LedgerClient } from '../helpers/LedgerClient.ts';
import { walletsConnector } from '../../../walletsConnector/index.js';

/* Акаунт уже може існувати асоційованим з іншим валлетом
 * Якщо акаунта немає у списку - просто додаємо його
 * Якщо акаунт є у списку але має інший ключ - заміняємо на новий ключ
 * Якщо акаунт є у списку але асоційований з іншим валлетом - видаляємо акаунт зі списку і додаємо новий
 * Якщо акаунт не є мультисігом - показуємо модалку і не додаємо його
 * */

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

const getAllAccounts = async (publicKey, state) => {
  const allAccounts = await getAllAccountsWithKey(publicKey);
  console.log(allAccounts);
  const res = await Promise.allSettled(
    allAccounts.map((accountId) => isMultisig(accountId, state)),
  );

  return res
    .map((v, index) => ({
      status: v.status,
      accountId: allAccounts[index],
      publicKey,
      wallet: 'ledger',
      addedBy: 'auto',
    }))
    .filter((v) => v.status === 'fulfilled')
    .map((v) => ({
      accountId: v.accountId,
      publicKey: v.publicKey,
      wallet: v.wallet,
      addedBy: v.addedBy,
    }));
};

export const connect = thunk(async (_actions, payload, { getStoreState, getStoreActions }) => {
  const state = getStoreState();
  const actions = getStoreActions();
  const navigate = actions.walletsConnector.modal.navigate;

  navigate('/ledger/connect/progress');

  const ledger = new LedgerClient();
  let publicKey = null;

  try {
    await ledger.connect();
    publicKey = await ledger.getPublicKey();
    console.log(publicKey.toString());
  } catch (e) {
    console.log(e);
    navigate({ route: '/ledger/connect/error', routeParams: { error: e } });
  } finally {
    ledger.isConnected() && await ledger.disconnect();
  }

  if (!publicKey) return;

  navigate('/ledger/multisig-accounts/progress');

  try {
    const accounts = await getAllAccounts(publicKey.toString(), state);
    console.log(accounts);
    if (accounts.length > 0) {
      navigate({ route: '/ledger/multisig-accounts/success', routeParams: { accounts } });
      actions.addAccount({ accounts });
    }
  } catch (e) {
    console.log(e);
    navigate({ route: '/ledger/multisig-accounts/error', routeParams: { error: e } });
  }
});
