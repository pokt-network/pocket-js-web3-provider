/**
 * @author Pabel Nunez Landestoy <pabel@pokt.network>
 * @description Unit test for the Pocket Web3 Provider
 */
const expect = require('chai').expect
const assert = require('chai').assert
const PocketProvider = require('../../src/pocket-provider.js')
const TransactionSigner = require('../../src/transaction-signer.js')
const Transaction = require('ethereumjs-tx').Transaction
const numberToHex = require('web3-utils').numberToHex
const pocket_core = require('pocket-js-core')
const Configuration = pocket_core.Configuration
const PocketAAT = pocket_core.PocketAAT
const Node = pocket_core.Node
const BondStatus = pocket_core.BondStatus
const LocalNet = pocket_core.LocalNet
const NockUtil = require('../utils/nock-util.js')
// To test with Web3 2.x use 'web3-2.x' and for Web3 1.x use 'web3-1.x'
const Web3 = require('web3-2.x')

// For Testing we are using dummy data, none of the following information is real.
const env = new LocalNet()
const version = '0.0.1'
const addressHex = "84871BAF5B4E01BE52E5007EACF7048F24BF57E0"
const clientPublicKey = 'f6d04ee2490e85f3f9ade95b80948816bd9b2986d5554aae347e7d21d93b6fb5'
const applicationPublicKey = 'd9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'
const applicationPrivateKey = '15f53145bfa6efdde6e65ce5ebfd330ac0a2591ae451a8a03ace99eff894b9eed9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'
const passphrase = "passphrase123"

// Ethereum data setup for test
const ethTxSigner = {
    // Needs at least 2 accounts in the node to run all tests
    accounts: ["0xf892400Dc3C5a5eeBc96070ccd575D6A720F0F9f".toLowerCase(), "0xF0BE394Fb2Def90824D11C7Ea189E75a8e868fA6".toLowerCase()],
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

// Transaction Signer
const ethTransactionSigner = new TransactionSigner(ethTxSigner.accounts, ethTxSigner.privateKeys, ethTxSigner.hasAddress, ethTxSigner.signTransaction)
// PocketAAT
const pocketAAT = PocketAAT.from(version, clientPublicKey, applicationPublicKey, applicationPrivateKey)
// Active blockchain
const blockchain = "ETH04"
// Configuration
const node01 = new Node(addressHex, applicationPublicKey, false, BondStatus.bonded, BigInt(100), env.getPOKTRPC(), [blockchain])
const configuration = new Configuration([node01], 5, 40000, 200)

describe('Ethereum PocketProvider', function () {
    describe("Success scenarios", async () => {
        const provider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)

        it('should create a new instance of the PocketProvider', function () {
            expect(function () {
                const pocketProvider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)
            }).to.not.throw(Error)
        })

        it('should send a new request', async () => {
            try {
                // Import and Unlock an account
                const account = await provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)

                // Web3
                const web3Ins = new Web3(provider)
                // Retrieve the balance of one of the accounts
                NockUtil.mockDispatch()
                NockUtil.mockGetHeight()
                NockUtil.mockGetNodeParams()
                NockUtil.mockRelay()

                const response = await web3Ins.eth.getBalance(account.addressHex)
                expect(response).to.not.be.instanceOf(Error)
            } catch (error) {
                expect(error).to.not.be.instanceOf(Error)
            }
        }).timeout(0)

        it('should submit transactions using eth_sendTransaction', async () => {
            // Import and Unlock an account
            provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
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
            expect(response).to.not.be.an.instanceof(Error)
        }).timeout(0)
    })
    describe("Error scenarios", async () => {
        const emptyBlockchainHex = ""

        it('should fail to instantiate the PocketProvider due to empty blockchain string', async () => {
            try {
                const provider = new PocketProvider(emptyBlockchainHex, pocketAAT, configuration, ethTransactionSigner)
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
                // provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
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