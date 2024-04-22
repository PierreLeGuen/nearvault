# Create NEAR lockup (vesting)

## Create NEAR Lockup (Vesting)

NEAR Vault supports two types of lockups: linear release and cancellable with a cliff feature.

### Linear Release Lockup

A linear release lockup allows for a gradual release of tokens from a start date to an end date. This type of lockup cannot be cancelled once created.

### Cancellable Lockup with Cliff

A cancellable lockup offers a cliff feature, allowing the NEAR Foundation to cancel the lockup at any time and transfer back the unvested amount. If a cliff date is set, the receiver can only start withdrawing tokens after the cliff date has passed.

#### Prerequisites

* The minimum amount of NEAR for a lockup is 4 NEAR.
* The recipient account ID must be added to the address book.

#### Create a Lockup

1. Go to: [https://nearvault.org/lockup/create](https://nearvault.org/lockup/create)
2. Fill in the following fields:
   * **Sender Wallet**: Select the wallet to fund the lockup.
   * **Receiver Account**: Select the account to receive the lockup.
   * **Token**: NEAR (pre-selected, cannot be changed).
   * **Amount**: Enter the amount of NEAR to be locked up.
   * **Allow Cancellation**: Toggle on/off to allow or disallow cancellation of the lockup by the NEAR Foundation.
   * **Start Date**: Select the start date of the lockup.
   * **End Date**: Select the end date of the lockup.
   * **Cliff Date** (optional): Select the date when the receiver can start withdrawing tokens. Only available if cancellation is allowed.
   * **Allow Staking**: Toggle on/off to allow or disallow staking of the locked-up tokens by the owner (even before the cliff date).
3. Review the lockup details and explanation provided.
4. Click on "Create Lockup" to create the lockup contract.

Note: Non-cancellable lockups are not compatible with cliff dates.
