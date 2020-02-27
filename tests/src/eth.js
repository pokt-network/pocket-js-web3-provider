/**
 * @author Pabel Nunez Landestoy <pabel@pokt.network>
 * @description Unit test for the Pocket Web3 Provider
 */
const expect = require('chai').expect
const assert = require('chai').assert
const PocketProvider = require('../../src/pocket-provider.js').PocketProvider
const TransactionSigner = require('../../src/transaction-signer.js').TransactionSigner
const Transaction = require('ethereumjs-tx').Transaction
const numberToHex = require('web3-utils').numberToHex
const pocket_core = require('@pokt-network/pocket-js')
const Configuration = pocket_core.Configuration
const Pocket = pocket_core.Pocket
const PocketAAT = pocket_core.PocketAAT
const HttpRpcProvider = pocket_core.HttpRpcProvider
const Node = pocket_core.Node
const EnvironmentHelper = require('../utils/env/helper').EnvironmentHelper
const NockUtil = require('../utils/nock-util.js')
// To test with Web3 2.x use 'web3-2.x' and for Web3 1.x use 'web3-1.x'
const Web3 = require('web3-2.x')

// For Testing we are using dummy data, none of the following information is real.
const env = EnvironmentHelper.getTestNet()

// Ethereum data setup for test
const ethTxSigner = {
    // Needs at least 2 accounts in the node to run all tests
    accounts: ["0xf892400Dc3C5a5eeBc96070ccd575D6A720F0F9f", "0xF0BE394Fb2Def90824D11C7Ea189E75a8e868fA6"],
    hasAddress: async function (address) {
        return ethTransactionSigner.accounts.includes(address)
    },
    // Update this object with the address - private keys for each account in the same order they are declared
    privateKeys: ["330D1AD67A9E44E15F5B7EBD20514865CBCE363B2E95FFC9D9C95198EF2893F3"],
    signTransaction: async function (txParams) {
        const pkString = ethTransactionSigner.privateKeys[0]
        const privateKeyBuffer = Buffer.from(pkString, 'hex')
        const tx = new Transaction(txParams)
        tx.sign(privateKeyBuffer)
        return '0x' + tx.serialize().toString('hex')
    }
}

// Relay requirements
const version = '0.0.1'
const appPubKeyHex = "25e433add38bee8bf9d5236267f6c9b8f3d224a0f164f142c351f441792f2b2e"
const appPrivKeyHex = "640d19b8bfb1cd70fe565ead88e705beaab34fe18fb0879d32539ebfe5ba511725e433add38bee8bf9d5236267f6c9b8f3d224a0f164f142c351f441792f2b2e"
// Client account
const clientPubKey = "076cd88affc8e9bc255b2b44d948031b2d9066f5e9ae5b2efba32138e246219e"
// Transaction Signer
const ethTransactionSigner = new TransactionSigner(ethTxSigner.accounts, ethTxSigner.privateKeys, ethTxSigner.hasAddress, ethTxSigner.signTransaction)
// Active blockchain
const blockchain = "8cf7f8799c5b30d36c86d18f0f4ca041cf1803e0414ed9e9fd3a19ba2f0938ff"
// Pocket instance requirements
const dispatcherUrl = new URL("http://35.245.90.148:8081")
const configuration = new Configuration(5, 60000, 1000000)
const pocket = new Pocket([dispatcherUrl], undefined, configuration)

describe('Ethereum PocketProvider', function () {
    describe("Success scenarios", async () => {
        it('should create a new instance of the PocketProvider', function () {
            expect(function () {
                const pocketAAT = PocketAAT.from(version, clientPubKey, appPubKeyHex, appPrivKeyHex)
                const pocketProvider = new PocketProvider(blockchain, pocketAAT, pocket, ethTransactionSigner)
            }).to.not.throw(Error)
        })

        it('should send a new request', async () => {
            try {
                // Generate client account
                const clientPassphrase = "1234"
                const clientAccountOrError = await pocket.keybase.createAccount(clientPassphrase)

                const clientAccount = clientAccountOrError
                const error = await pocket.keybase.unlockAccount(clientAccount.addressHex, clientPassphrase, 0)
                expect(error).to.be.undefined
                // Generate AAT
                const aat = PocketAAT.from("0.0.1", clientAccount.publicKey.toString("hex"), appPubKeyHex, appPrivKeyHex)
                // Creae Pocket Provider
                const provider = new PocketProvider(blockchain, aat, pocket, ethTransactionSigner)

                // Web3
                const web3Ins = new Web3(provider)

                web3Ins.eth.getBalance(clientAccount.addressHex).then(function(response, error){
                    expect(response).to.not.be.undefined.true
                    expect(response).to.not.be.instanceOf(Error)
                })
            } catch (error) {
                expect(error).to.not.be.instanceOf(Error)
            }
        }).timeout(0)
    })
    describe("Error scenarios", async () => {
        const emptyBlockchainHex = ""

        it('should fail to instantiate the PocketProvider due to empty blockchain string', async () => {
            try {
                const provider = new PocketProvider(emptyBlockchainHex, pocketAAT, pocket, ethTransactionSigner)
                expect(provider).to.be.an.instanceof(Error)
            } catch (error) {
                expect(error).to.be.an.instanceof(Error)
            }
        })

        it('should fail to retrieve the account balance due to empty account address string', async () => {
            try {
                // Web3
                const web3Ins = new Web3(provider)
                // Retrieve the balance of one of the accounts
                NockUtil.mockDispatch()
                NockUtil.mockGetHeight()
                NockUtil.mockGetNodeParams()
                NockUtil.mockRelay()

                const response = await web3Ins.eth.getBalance("")
                expect(response).to.be.instanceOf(Error)
            } catch (error) {
                expect(error).to.be.instanceOf(Error)
            }
        })

        it('should fail to send a new transaction due to no account imported and unlocked', async () => {
            try {
                // Import and Unlock an account
                // provider.provider.pocket.importAndUnlockAccount(passphrase, appPrivKeyHex)
                // Transfers eth from accounts[0] to accounts[1]
                var tx = {
                    from: ethTransactionSigner.accounts[0],
                    to: ethTransactionSigner.accounts[1],
                    value: numberToHex(10000), // Change value for the amount being sent
                    gas: "0x5208",
                    gasPrice: "0x3B9ACA00",
                    nonce: numberToHex(12345)
                }

                var payload = {
                    jsonrpc: "2.0",
                    method: "eth_sendTransaction",
                    params: [tx],
                    id: (new Date()).getTime()
                }
                // Mock responses
                NockUtil.mockDispatch()
                NockUtil.mockGetHeight()
                NockUtil.mockGetNodeParams()
                NockUtil.mockTransactionRelay()

                const response = await provider.send(payload)
                expect(response).to.be.instanceOf(Error)
            } catch (error) {
                expect(error).to.be.instanceOf(Error)
            }
        })
    })
})