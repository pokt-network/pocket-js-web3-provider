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
const EnvironmentHelper = require('../utils/env/helper').EnvironmentHelper
const NockUtil = require('../utils/nock-util.js')
// To test with Web3 2.x use 'web3-2.x' and for Web3 1.x use 'web3-1.x'
const Web3 = require('web3-1.x')

// For Testing we are using dummy data, none of the following information is real.
const env = EnvironmentHelper.getTestNet()

// Ethereum data setup for test
const ethTxSigner = {
    // Needs at least 2 accounts in the node to run all tests
    accounts: ["0x2a14D313F58bA0bd4e8Fa282082D11DA24b1DaA3".toUpperCase(), "0xF0BE394Fb2Def90824D11C7Ea189E75a8e868fA6".toUpperCase()],
    hasAddress: async function (address) {
        return ethTransactionSigner.accounts.includes(address.toUpperCase())
    },
    // Update this object with the address - private keys for each account in the same order they are declared
    privateKeys: ["F3D7A8A15A23E2689511A7505D389960D007925119DEC14892466F0EDB0876B8"],
    signTransaction: async function (txParams) {
        try {
            const pkString = ethTransactionSigner.privateKeys[0]
            const privateKeyBuffer = Buffer.from(pkString, 'hex')
            const tx = new Transaction(txParams, {
                chain: 'rinkeby'
            })
            tx.sign(privateKeyBuffer)
            return '0x' + tx.serialize().toString('hex')
        } catch (error) {
            console.error(error)
            return error
        }
    }
}

// Relay requirements
const version = '0.0.1'
const appPubKeyHex = "73f765cb848f9d40aa9a16a3726f1ec5703f77bad22b2487cd4baaaf777f6e90"
const appPrivKeyHex = "dfd4ae8742a5d07f1e59fc5b41b5f7d04f026c14ce2c273e0da0e8d2f36df79273f765cb848f9d40aa9a16a3726f1ec5703f77bad22b2487cd4baaaf777f6e90"
// Client account
const clientPubKey = "076cd88affc8e9bc255b2b44d948031b2d9066f5e9ae5b2efba32138e246219e"
// Transaction Signer
const ethTransactionSigner = new TransactionSigner(ethTxSigner.accounts, ethTxSigner.privateKeys, ethTxSigner.hasAddress, ethTxSigner.signTransaction)
// Active blockchain
const blockchain = "8cf7f8799c5b30d36c86d18f0f4ca041cf1803e0414ed9e9fd3a19ba2f0938ff"
// Pocket instance requirements
const dispatchURL = new URL("http://35.245.7.53:8081")
const configuration = new Configuration(5, 100000, undefined, 1000000)
const rpcProvider = new HttpRpcProvider(dispatchURL)
const pocket = new Pocket([dispatchURL], rpcProvider, configuration, )

describe('Ethereum PocketProvider', function () {
    describe("Success scenarios", async () => {
        it('should create a new instance of the PocketProvider', async () => {
            expect(function () {
                PocketAAT.from(version, clientPubKey, appPubKeyHex, appPrivKeyHex).then(function (pocketAAT) {
                    const pocketProvider = new PocketProvider(blockchain, pocketAAT, pocket, ethTransactionSigner)
                })
            }).to.not.throw(Error)
        })

        it('should retrieve an account balance', async () => {
            try {
                // Generate client account
                const clientPassphrase = "1234"
                const clientAccountOrError = await pocket.keybase.createAccount(clientPassphrase)

                const clientAccount = clientAccountOrError
                const error = await pocket.keybase.unlockAccount(clientAccount.addressHex, clientPassphrase, 0)
                expect(error).to.be.undefined
                // Generate AAT
                PocketAAT.from("0.0.1", clientAccount.publicKey.toString("hex"), appPubKeyHex, appPrivKeyHex).then(function (aat) {
                    // Creae Pocket Provider
                    const provider = new PocketProvider(blockchain, aat, pocket, ethTransactionSigner)

                    // Web3
                    const web3Ins = new Web3(provider)
                    web3Ins.eth.getBalance(clientAccount.addressHex).then(function (response, error) {
                        expect(response).to.not.be.undefined.true
                        expect(response).to.not.be.instanceOf(Error)
                    })
                })

            } catch (error) {
                expect(error).to.not.be.instanceOf(Error)
            }
        }).timeout(0)

        it('should send a new transaction', async () => {
            try {
                // Generate client account
                const clientPassphrase = "1234"
                const clientAccountOrError = await pocket.keybase.createAccount(clientPassphrase)

                const clientAccount = clientAccountOrError
                const error = await pocket.keybase.unlockAccount(clientAccount.addressHex, clientPassphrase, 0)
                expect(error).to.be.undefined
                // Generate AAT
                const aat = await PocketAAT.from(version, clientAccount.publicKey.toString("hex"), appPubKeyHex, appPrivKeyHex)
                // Creae Pocket Provider
                const provider = new PocketProvider(blockchain, aat, pocket, ethTransactionSigner)

                // Web3
                const web3Ins = new Web3(provider)

                // Transfers eth from accounts[0] to accounts[1]
                const tx = {
                    "from": ethTxSigner.accounts[0],
                    "to": ethTxSigner.accounts[1],
                    "value": numberToHex(10000), // Change value for the amount being sent
                    "gas": "0x5208",
                    "gasPrice": "0x3B9ACA00",
                    "chainId": 4
                }

                const response = await web3Ins.eth.sendTransaction(tx)

                expect(response).to.not.be.undefined.true
                expect(response).to.not.be.instanceOf(Error)
                expect(error).to.be.undefined
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
                const response = await web3Ins.eth.getBalance("")
                expect(response).to.be.instanceOf(Error)
            } catch (error) {
                expect(error).to.be.instanceOf(Error)
            }
        })

        it('should fail to send a new transaction due to missing "from" property', async () => {
            try {
                // Generate client account
                const clientPassphrase = "1234"
                const clientAccountOrError = await pocket.keybase.createAccount(clientPassphrase)

                const clientAccount = clientAccountOrError
                const error = await pocket.keybase.unlockAccount(clientAccount.addressHex, clientPassphrase, 0)
                expect(error).to.be.undefined
                // Generate AAT
                const aat = await PocketAAT.from(version, clientAccount.publicKey.toString("hex"), appPubKeyHex, appPrivKeyHex)
                // Creae Pocket Provider
                const provider = new PocketProvider(blockchain, aat, pocket, ethTransactionSigner)

                // Web3
                const web3Ins = new Web3(provider)

                // Transfers eth from accounts[0] to accounts[1]
                const tx = {
                    "to": ethTxSigner.accounts[1],
                    "value": numberToHex(10000), // Change value for the amount being sent
                    "gas": "0x5208",
                    "gasPrice": "0x3B9ACA00",
                    "chainId": 4
                }

                const response = await web3Ins.eth.sendTransaction(tx)

                expect(response).to.not.be.undefined.true
                expect(response).to.be.instanceOf(Error)
            } catch (error) {
                expect(error.message).to.be.equal('The send transactions "from" field must be defined!')
            }
        }).timeout(0)
    })
})