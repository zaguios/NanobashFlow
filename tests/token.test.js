const transferTokens = require('../transactions/javascripts/transferTokens');
const createToken = require('../transactions/javascripts/createToken');
const fetchTransaction = require('../scripts/javascripts/fetchTransaction');
const getTokenMetadata = require('../scripts/javascripts/getTokenMetadata');
const mintTokens = require('../transactions/javascripts/mintTokens');
const getBalance = require('../scripts/javascripts/getBalance');
const addAccount = require('../transactions/javascripts/addAccount')
const createAccount = require('../transactions/javascripts/createAccount');
const linkAccount = require('../transactions/javascripts/linkAccount');

const getNumberMinted = require('../scripts/javascripts/getNumberMinted');
const getMaxEditions = require('../scripts/javascripts/getMaxEditions');
const lockToken = require('../transactions/javascripts/lockToken');
const isTokenLocked = require('../scripts/javascripts/isTokenLocked')

const mainContractAddress = '0xf8d6e0586b0a20c7'
const secondAccountAddress = '0x01cf0e2f2f715450'

// TODO: Remember errors are caused because accounts aren't linked

describe('Token', () => {
    let token

    beforeAll(() => {
        return new Promise(async(resolve) => {
            let linkedTransactionID = await linkAccount(mainContractAddress)
            let transactionID = await createToken({name: 'something', ipfs: 'something', quantity: '1000'})
            token = await fetchTransaction(transactionID)
            let mintTransactionID = await mintTokens(mainContractAddress, token.tokenID, 100) // Mints FT and returns transaction ID for the mint
            resolve()
        });
    })

    it('Should be able to create a new vault for an account', async() => {
        let accountAddress = await addAccount()
        let createTransactionID = await createAccount(secondAccountAddress, 'second-account')
        let linkedTransactionID = await linkAccount(secondAccountAddress, 'second-account')
    });

    it('Should be able to retrieve metadata', async() => {
        let metadata = await getTokenMetadata(token.tokenID) // Retrieves the metadata on the piece

        expect(metadata.name).toBe('something');
        expect(metadata.ipfs).toBe('something');
    });

    it('Should not allow unauthorized accounts to create pieces', async() => {
        let failedTransaction = await createToken({name: 'other', ipfs: 'other', quantity: '1'}, null, 'second-account')
        let res = await fetchTransaction(failedTransaction)
        expect(res.success).toBeFalsy()
    });

    it('Should not allow authorized accounts to lock pieces', async() => {
        let failedTransaction = await lockToken(token.tokenID, 'second-account')
        let res = await fetchTransaction(failedTransaction)
        expect(res.success).toBeFalsy()
    })

    it('Should not allow locked pieces to be minted', async() => {
        let secondTransactionID = await createToken({name: 'other', ipfs: 'other', quantity: '10'})
        let token2 = await fetchTransaction(secondTransactionID) // Retrieves the piece from the transaction
        let initialMinted = await getNumberMinted(token2.tokenID)
        await lockToken(token2.tokenID)

        await mintTokens(mainContractAddress, token2.tokenID, 2) // Should fail
        let afterLockMinted = await getNumberMinted(token2.tokenID)

        let locked = await isTokenLocked(token2.tokenID)

        expect(initialMinted).toBe(0)
        expect(afterLockMinted).toBe(0) // Should no longer increase since minting is locked
        expect(locked).toBeTruthy()
    });

    it('Should be able to retrieve maxEditions', async() => {
        let maxEditions = await getMaxEditions(token.tokenID)

        expect(maxEditions).toBe(1000)
    });

    it('Should not allow unauthorized accounts to mint', async() => {
        let numberMinted = await getNumberMinted(token.tokenID)
        await mintTokens(mainContractAddress, token.tokenID, 'second-account', 1) // Mints NFT and returns transaction ID for the mint
        let newNumberMinted = await getNumberMinted(token.tokenID)

        // A new edition should not have been minted
        expect(newNumberMinted).toBe(numberMinted)
    });

    it('Should be able to mint different items', async() => {
        let secondTransactionID = await createToken({name: 'other', ipfs: 'other', quantity: '10'})
        let token2 = await fetchTransaction(secondTransactionID) // Retrieves the piece from the transaction

        expect(token.tokenID === token2.tokenID).toBeFalsy()

        let metadata = await getTokenMetadata(token.tokenID) // Retrieves the metadata on the piece

        let metadata2 = await getTokenMetadata(token2.tokenID) // Retrieves the metadata on the piece

        expect(metadata.name).toBe('something');
        expect(metadata2.name).toBe('other');
    });

    it('Should not allow over maxEditions to be minted', async() => {
        let secondTransactionID = await createToken({name: 'other', ipfs: 'other', quantity: '10'})
        let token2 = await fetchTransaction(secondTransactionID) // Retrieves the piece from the transaction

        await mintTokens(mainContractAddress, token2.tokenID, 5) // Should succeed
        let afterNoLockMinted = await getNumberMinted(token2.tokenID)
        expect(afterNoLockMinted).toBe(5) // Should increase by 1 since minting before max editions reached

        await mintTokens(mainContractAddress, token2.tokenID, 6) // Should fail due to max editions hit
        let afterLockMinted = await getNumberMinted(token2.tokenID)

        expect(afterLockMinted).toBe(5) // Should no longer increase since max editions reached
    });

    it('Should allow tokens to be minted multiple times', async() => {
        let secondTransactionID = await createToken({name: 'other', ipfs: 'other', quantity: '10'})
        let token2 = await fetchTransaction(secondTransactionID) // Retrieves the piece from the transaction

        await mintTokens(mainContractAddress, token2.tokenID, 5) // Should succeed
        let afterNoLockMinted = await getNumberMinted(token2.tokenID)
        expect(afterNoLockMinted).toBe(5) // Should increase by 1 since minting before max editions reached

        await mintTokens(mainContractAddress, token2.tokenID, 5) // Should fail due to max editions hit
        let afterLockMinted = await getNumberMinted(token2.tokenID)

        expect(afterLockMinted).toBe(10) // Should no longer increase since max editions reached
    });

    it('Should be able to send a Token between users', async() => {
        let senderBalance = await getBalance(mainContractAddress, token.tokenID)
        let receiverBalance = await getBalance(secondAccountAddress, token.tokenID)

        expect(senderBalance).toBe(100)
        expect(receiverBalance).toBe(0)

        let sendTransactionID = await transferTokens(secondAccountAddress, token.tokenID, 10, 'emulator-account')
        senderBalance = await getBalance(mainContractAddress, token.tokenID)
        receiverBalance = await getBalance(secondAccountAddress, token.tokenID)

        expect(senderBalance).toBe(90)
        expect(receiverBalance).toBe(10)
    });

    it('Should not be able to send more than your balance to other users', async() => {
        let senderBalance = await getBalance(mainContractAddress, token.tokenID)
        let receiverBalance = await getBalance(secondAccountAddress, token.tokenID)

        expect(senderBalance).toBe(90)
        expect(receiverBalance).toBe(10)

        let sendTransactionID = await transferTokens(secondAccountAddress, token.tokenID, 100, 'emulator-account')
        senderBalance = await getBalance(mainContractAddress, token.tokenID)
        receiverBalance = await getBalance(secondAccountAddress, token.tokenID)

        expect(senderBalance).toBe(90)
        expect(receiverBalance).toBe(10)
    });


})