import Nanobash from 0xProfile

transaction(tokenID: UInt64) {

    let adminRef: &Nanobash.Admin

    prepare(acct: AuthAccount) {
        self.adminRef = acct.borrow<&Nanobash.Admin>(from: /storage/NanobashAdmin)
            ?? panic("No admin resource in storage")

    }

    execute {
        let tokenRef = self.adminRef.borrowToken(tokenID: tokenID)
        tokenRef.lock()
    }
}