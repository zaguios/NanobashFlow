import Nanobash from 0xProfile

pub fun main(): {UInt64: UInt64} {
    let acct1 = getAccount(0xf8d6e0586b0a20c7)
    let acct2 = getAccount(0x01cf0e2f2f715450)

    // Get references to the account's receivers
    // by getting their public capability
    // and borrowing a reference from the capability
    let acct1ReceiverRef = acct1.getCapability<&Nanobash.Vault{Nanobash.Balance}>(/public/MainReceiver)
        .borrow()
        ?? panic("Could not borrow a reference to the acct1 receiver")

    let acct2ReceiverRef = acct2.getCapability<&Nanobash.Vault{Nanobash.Balance}>(/public/MainReceiver)
        .borrow()
        ?? panic("Could not borrow a reference to the acct2 receiver")

    // Read and log balance fields
    log("Account 1 Balance")
    log(acct1ReceiverRef.balances)

    return acct1ReceiverRef.balances
    // log("Account 2 Balance")
    // log(acct2ReceiverRef.balances)
}
