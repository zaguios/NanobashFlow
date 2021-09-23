// Setup Account

import Nanobash from 0xProfile

// This transaction configures an account to store and receive tokens defined by
// the ExampleToken contract.
transaction(account: Address) {
	prepare(acct: AuthAccount) {
		// Create a new empty Vault object
		let vaultA <- Nanobash.createEmptyVault()
			
		// Store the vault in the account storage
		acct.save<@Nanobash.Vault>(<-vaultA, to: /storage/MainVault)

        // Create a public Receiver capability to the Vault
		let ReceiverRef = acct.link<&Nanobash.Vault{Nanobash.Receiver, Nanobash.Balance}>(/public/MainReceiver, target: /storage/MainVault)
	}

    post {
        // Check that the capabilities were created correctly
        getAccount(account).getCapability<&Nanobash.Vault{Nanobash.Receiver}>(/public/MainReceiver)
                        .check():  
                        "Vault Receiver Reference was not created correctly"
    }
}
 
