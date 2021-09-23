// Mint Tokens

import Nanobash from 0xProfile

// This transaction mints tokens and deposits them into account 2's vault
transaction(metadata: {String: String}, maxEditions: UInt64) {

    // Local variable for storing the reference to the minter resource
    let adminRef: &Nanobash.Admin

	prepare(acct: AuthAccount) {
        self.adminRef = acct.borrow<&Nanobash.Admin>(from: /storage/NanobashAdmin)
            ?? panic("No admin resource in storage")

	}

    execute {
        self.adminRef.createToken(metadata: metadata, maxEditions: maxEditions)
        log ("token created")
    }
}
 

