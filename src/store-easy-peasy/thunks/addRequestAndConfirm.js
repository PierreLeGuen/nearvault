import { transactions, utils, providers } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { thunk } from 'easy-peasy';
import { requestSignTransactions } from '../wallets/myNearWallet/helpers/requestSignTransactions.js';
import { LedgerSigner } from '../wallets/ledger/helpers/LedgerSigner.ts';
/*
 * export function createTransaction(
 * signerId: string,
 * publicKey: PublicKey,
 * receiverId: string,
 * nonce: BN | string | number,
 * actions: Action[],
 * blockHash: Uint8Array): Transaction
 * */
// const sender = 'eclpseeer-multisig-test-1.testnet';
// const receiver = 'eclpseeer-multisig-test-1.testnet';
// const pk = PublicKey.from('ed25519:D4AP2sdR9FQbvu3wcXYfQ9NAyUshir64uaRAhCAPRgyq');

const createTx = async (provider, sender, receiver, publicKey) => {
  const pk = PublicKey.from(publicKey);
  const accessKey = await provider.query(`access_key/${sender}/${pk.toString()}`, '');
  const nonce = accessKey.nonce + 1;
  const recentBlockHash = utils.serialize.base_decode(accessKey.block_hash);

  const tx = transactions.createTransaction(
    sender,
    pk,
    receiver,
    nonce,
    [
      transactions.functionCall(
        'add_request_and_confirm',
        {
          request: {
            receiver_id: 'eclipseer.testnet',
            actions: [{ type: 'Transfer', amount: utils.format.parseNearAmount('0.01') }],
          },
        },
        300000000000000,
        0,
      ),
    ],
    recentBlockHash,
  );
  console.log(tx);
  return tx;
};

// ledger requestSignAndSentTransaction
const requestSignAndSentTransaction = async (tx) => {
  const provider = new providers.JsonRpcProvider({ url: `https://rpc.testnet.near.org` });

  const [_hash, signedTransaction] = await transactions.signTransaction(
    tx,
    new LedgerSigner(),
    tx.signerId,
    'testnet',
  );
  // sends transaction to NEAR blockchain via JSON RPC call and records the result
  const result = await provider.sendJsonRpc('broadcast_tx_commit', [
    Buffer.from(signedTransaction.encode()).toString('base64'),
  ]);
  return result;
};

export const addRequestAndConfirm = thunk(
  async (_actions, payload, { getStoreState, getStoreActions }) => {
    const state = getStoreState();
    const account = state.selectedAccount;
    const actions = getStoreActions();
    const open = actions.walletsConnector.modal.open;
    const close = actions.walletsConnector.modal.close;
    const navigate = actions.walletsConnector.modal.navigate;

    if (account.wallet === 'myNearWallet') {
      const tx = await createTx(
        state.wallets[account.wallet].connection.connection.provider,
        account.accountId,
        account.accountId,
        account.publicKey,
      );

      requestSignTransactions({
        transactions: [tx],
        walletUrl: state.wallets.myNearWallet.connection.config.walletUrl,
      });
    }

    if (account.wallet === 'ledger') {
      // Open Modal
      open();
      navigate('/ledger/sign/progress');

      try {
        const tx = await createTx(
          state.wallets[account.wallet].connection.provider,
          account.accountId,
          account.accountId,
          account.publicKey,
        );
        const a = await requestSignAndSentTransaction(tx, close);
        console.log(a);
        close();
      } catch (e) {
        console.log(e);
        navigate({ route: '/ledger/sign/error', routeParams: { error: e } });
      }
    }
  },
);
