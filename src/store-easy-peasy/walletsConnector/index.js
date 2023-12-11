import { action } from 'easy-peasy';

export const walletsConnector = {
  modal: {
    isOpen: false,
    route: '/wallets',
    routeParams: null,

    // isOpen: true,
    // route: '/ledger/multisig-accounts/progress',

    open: action((state) => {
      state.isOpen = true;
    }),

    // opeLedgerSign: action((state) => {
    //   state.isOpen = true;
    //   state.route = '/ledger/sign/progress';
    // }),

    close: action((state) => {
      if (state.route === '/ledger/connect/progress') return;
      state.isOpen = false;
    }),

    navigate: action((state, payload) => {
      if (typeof payload === 'string') {
        state.route = payload;
        state.routeParams = null;
        return;
      }
      state.route = payload.route;
      state.routeParams = payload.routeParams;
    }),
  },
};
