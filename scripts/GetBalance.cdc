import Nanobash from 0xProfile

pub fun main(account: Address, tokenID: UInt64): UInt64 {
    let acct = getAccount(account)
    let acctReceiverRef = acct.getCapability<&Nanobash.Vault{Nanobash.Balance}>(/public/MainReceiver)
        .borrow()
        ?? panic("Could not borrow a reference to the acct1 receiver")

    return acctReceiverRef.getBalance(tokenID: tokenID)
}
