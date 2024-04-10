# Onboarding

Link: [https://nearvault.org/auth/signin](https://nearvault.org/auth/signin)

First time usage of nearvault requires a few steps to be completed. This guide will walk you through the process.

## Login

You can either connect with Google or email to login. If you choose to login with email, you will receive a magic link in your inbox to login.

Email not received? Check your spam folder. If you still can't find it, you can request a new magic link.

After login you will end up on this page:

<figure><img src="../.gitbook/assets/Screenshot 2024-04-10 at 10.49.03.png" alt="" width="375"><figcaption></figcaption></figure>

You can either create a multisig wallet now or skip this section by clicking "Continue" and create a wallet later on.

## Create your first multisig wallet

Give it a name, the name will be prefixed with `.multisignature.near`. For example, if you name it `mywallet`, the full wallet name will be `mywallet.multisignature.near`.

Add the public keys that you want to have access to your multisig wallet.

Find your Ledger public key:&#x20;

{% content-ref url="../frequently-asked-questions/how-to-find-my-ledger-public-key.md" %}
[how-to-find-my-ledger-public-key.md](../frequently-asked-questions/how-to-find-my-ledger-public-key.md)
{% endcontent-ref %}

You can also create a keypair from: [https://near.github.io/near-seed-phrase/](https://near.github.io/near-seed-phrase/) and add the public key of the pair to the multisig wallet.

Set the voting threshold. This is the number of signatures required to approve a transaction. For example, if you have 3 public keys and set the threshold to 2, then 2 signatures are required to approve a transaction. If you set the threshold to 3, then all 3 signatures are required.

## Create your first team

Give it a name, list of multisig wallets, and a list of emails of the team members. The team members will receive an email to join the team. Once they accept the invitation, they will be able to view requests in the multisig wallet. (It doesn't give any write access to the multisig wallet).
