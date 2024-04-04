# Ledger error 0x6990

The issue you are facing is because the transaction is too long to be signed from the Ledger. You have to use a non ledger protected key pair to avoid this issue.

1. Create a keypair, go to this website: [https://near.github.io/near-seed-phrase/](https://near.github.io/near-seed-phrase/)
   1. Code: [https://github.com/near/near-seed-phrase](https://github.com/near/near-seed-phrase)
2. Copy the private key, and the public key somewhere safe, preferably air gapped device.
3. Go to [https://nearvault.org/approval/manage](https://nearvault.org/approval/manage) to add the public key to the multisig wallet.
   1. Make sure to only enable “add request” permission.
   2. ![](https://lh7-eu.googleusercontent.com/IDkKAunBx-osLVtWbC9KeKGX7qadk6ACqoUn90EIWMfAA4FL38X9R9ZMtQe0XKYzM2Baht2e1ImJ3MLdTgOWrXru75RCMt7GONPN8yQ4yIAPXlf6Qagy2XhUwBckhqzW4rxe-LiRgA-SV2LSCO-qBAY)
   3. Create request and ask for approval from the different parties.
4. Import the private key by going to “Wallet Manager…” and Private Key connect
   1. Copy paste the private key in this text field and then click “Connect”
   2. ![](https://lh7-eu.googleusercontent.com/IW8nye6iQvgwYpRT2VL1YrpEAHJKhxjqBQcVGU5bwYhLrRO1U0UgCVuQNT6c8G8M1VsTbgbiEBB8CqQ0UWLu5KWY3NFgAQo5iWZU0qvm8bXJ5gIVeRE-gya6WiZU4IHAwOE8Ah4fs3PvD0UFnrwHTxA)
5. Now try to send the create request transaction from the given wallet, the request should be added and available for approval in [https://nearvault.org/approval/pending](https://nearvault.org/approval/pending) page.
   1. **If it is**, we need to forget the imported private key: go to “Wallet Manager…”, and then “View Imported Keys”, click forget key on the public key of the manually created keypair.
6. If the request matches your expectation, approve the transaction and ask other parties to do the same.
   1. If you are facing any issue, try to re import your Ledger public key using the Wallet Manager > Ledger Connect.
