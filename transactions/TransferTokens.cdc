// Transfer Tokens

import Nanobash from 0xProfile

// This transaction is a template for a transaction that
// could be used by anyone to send tokens to another account
// that owns a Vault
transaction(account: Address, tokenID: UInt64, quantity: UInt64) {

  // Temporary Vault object that holds the balance that is being transferred
  var temporaryVault: @Nanobash.Vault

  prepare(acct: AuthAccount) {
    // withdraw tokens from your vault by borrowing a reference to it
    // and calling the withdraw function with that reference
    let vaultRef = acct.borrow<&Nanobash.Vault>(from: /storage/MainVault)
        ?? panic("Could not borrow a reference to the owner's vault")

    self.temporaryVault <- vaultRef.withdraw(amount: quantity, tokenID: tokenID)
  }

  execute {
    let recipient = getAccount(account)
    let receiverRef = recipient.getCapability(/public/MainReceiver)
                      .borrow<&Nanobash.Vault{Nanobash.Receiver}>()
                      ?? panic("Could not borrow a reference to the receiver")

    receiverRef.deposit(from: <-self.temporaryVault)
  }
}
 
