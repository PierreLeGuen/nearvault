import BN from 'bn.js';

export const toGas = (terraGas: string | number) =>
  new BN(Number(terraGas) * 1000000000000);