// Mint Tokens

import Nanobash from 0xProfile

// This transaction mints tokens and deposits them into account 2's vault
transaction(account: Address, tokenID: UInt64, quantity: UInt64) {

    // Local variable for storing the reference to the minter resource
    let adminRef: &Nanobash.Admin

	prepare(acct: AuthAccount) {
        self.adminRef = acct.borrow<&Nanobash.Admin>(from: /storage/NanobashAdmin)
            ?? panic("No admin resource in storage")

	}

    execute {
        let tokenRef = self.adminRef.borrowToken(tokenID: tokenID)
        let tokens <- tokenRef.mintTokens(quantity: quantity)
        let recipient = getAccount(account)

        let receiverRef = recipient.getCapability(/public/MainReceiver)
                      .borrow<&Nanobash.Vault{Nanobash.Receiver}>()
                      ?? panic("Could not borrow a reference to the receiver")

        receiverRef.deposit(from: <-tokens)
    }
}
 

