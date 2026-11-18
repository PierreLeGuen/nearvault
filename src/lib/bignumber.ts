import BigNumberJs from "bignumber.js";

/**
 * bignumber.js >= 10 throws on non-numeric input by default (STRICT mode).
 * Keep the previous behaviour of returning NaN, so that empty or partially
 * typed form values do not throw while a component renders.
 */
const BigNumber = BigNumberJs.clone({ STRICT: false });
type BigNumber = BigNumberJs;

export default BigNumber;
