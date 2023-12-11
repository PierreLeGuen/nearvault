import { serialize } from 'near-api-js/lib/utils/serialize';
import { SCHEMA } from 'near-api-js/lib/transaction';

export const requestSignTransactions = ({ transactions }) => {
  // const currentUrl = new URL(window.location.href);
  // const newUrl = new URL('sign', walletUrl);
  //
  // newUrl.searchParams.set('transactions', transactions
  //   .map(transaction => serialize(SCHEMA, transaction))
  //   .map(serialized => Buffer.from(serialized).toString('base64'))
  //   .join(','));
  //
  // newUrl.searchParams.set('callbackUrl', callbackUrl || currentUrl.href);
  //
  // if (meta) newUrl.searchParams.set('meta', meta);
  //
  // window.location.assign(newUrl.toString());
};