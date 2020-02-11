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
const passphrase = "passphrase123"
const appPubKeyHex = "d3814cf87d0d0b249dc9727d2e124a03cbb4d23e37c169833ef88562546f0958"
const appPrivKeyHex = "2dec343f5d225be87663194f5ce61611ee585ab68baf1046694b0045124bd1a5d3814cf87d0d0b249dc9727d2e124a03cbb4d23e37c169833ef88562546f0958"
// Transaction Signer
const ethTransactionSigner = new TransactionSigner(ethTxSigner.accounts, ethTxSigner.privateKeys, ethTxSigner.hasAddress, ethTxSigner.signTransaction)
// Active blockchain
const blockchain = "49aff8a9f51b268f6fc485ec14fb08466c3ec68c8d86d9b5810ad80546b65f29"
// Pocket instance requirements
const dispatchNodeJSON = "{\"address\":\"189ceb72c06b99e15a53fd437b81d4500f7a01f1\",\"public_key\":\"1839f4836f22d438692355b2ee34e47d396f6eb23b423bf3a1e623137ddbf7e3\",\"jailed\":false,\"status\":2,\"tokens\":\"1000000000\",\"service_url\":\"http:\/\/35.245.90.148:8081\",\"chains\":[\"6d3ce011e06e27a74cfa7d774228c52597ef5ef26f4a4afa9ad3cebefb5f3ca8\",\"49aff8a9f51b268f6fc485ec14fb08466c3ec68c8d86d9b5810ad80546b65f29\"],\"unstaking_time\":\"0001-01-01T00:00:00Z\"}"
const dispatchNode = Node.fromJSON(dispatchNodeJSON)
const configuration = new Configuration([dispatchNode], 5, 60000, 1000000)
const rpcProvider = new HttpRpcProvider(new URL(dispatchNode.serviceURL))

describe('Ethereum PocketProvider', function () {
    describe("Success scenarios", async () => {
        it('should create a new instance of the PocketProvider', function () {
            expect(function () {
                const pocketProvider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)
            }).to.not.throw(Error)
        })

        it('should send a new request', async () => {
            try {
                // Generate AAT
                const clientPassphrase = "1234"
                const pocket = new Pocket(configuration, rpcProvider)
                const account = await pocket.keybase.createAccount(clientPassphrase)
                const error = await pocket.keybase.unlockAccount(account.addressHex, clientPassphrase, 0)
                expect(error).to.not.be.instanceOf(Error)
                const pocketAAT = PocketAAT.from(version, account.publicKey.toString("hex"), appPubKeyHex, appPrivKeyHex)

                // Creae Pocket Provider
                const provider = new PocketProvider(blockchain, pocketAAT, configuration, rpcProvider, ethTransactionSigner)
                
                // Web3
                const web3Ins = new Web3(provider)
                // Retrieve the balance of one of the accounts
                // NockUtil.mockDispatch()
                // NockUtil.mockGetHeight()
                // NockUtil.mockGetNodeParams()
                // NockUtil.mockRelay()

                const response = await web3Ins.eth.getBalance(account.addressHex)
                expect(response).to.not.be.instanceOf(Error)
            } catch (error) {
                expect(error).to.not.be.instanceOf(Error)
            }
        }).timeout(0)

        // it('should submit transactions using eth_sendTransaction', async () => {
        //     // Import and Unlock an account
        //     provider.provider.pocket.importAndUnlockAccount(passphrase, appPrivKeyHex)
        //     // Transfers eth from accounts[0] to accounts[1]
        //     var tx = {
        //         from: ethTransactionSigner.accounts[0],
        //         to: ethTransactionSigner.accounts[1],
        //         value: numberToHex(10000), // Change value for the amount being sent
        //         gas: "0x5208",
        //         gasPrice: "0x3B9ACA00",
        //         nonce: numberToHex(12345)
        //     }

        //     var payload = {
        //         jsonrpc: "2.0",
        //         method: "eth_sendTransaction",
        //         params: [tx],
        //         id: (new Date()).getTime()
        //     }
        //     // Mock responses
        //     NockUtil.mockDispatch()
        //     NockUtil.mockGetHeight()
        //     NockUtil.mockGetNodeParams()
        //     NockUtil.mockTransactionRelay()

        //     const response = await provider.send(payload)
        //     expect(response).to.not.be.an.instanceof(Error)
        // }).timeout(0)
    })
    // describe("Error scenarios", async () => {
    //     const emptyBlockchainHex = ""

    //     it('should fail to instantiate the PocketProvider due to empty blockchain string', async () => {
    //         try {
    //             const provider = new PocketProvider(emptyBlockchainHex, pocketAAT, configuration, ethTransactionSigner)
    //             expect(provider).to.be.an.instanceof(Error)
    //         } catch (error) {
    //             expect(error).to.be.an.instanceof(Error)
    //         }
    //     })

    //     it('should fail to retrieve the account balance due to empty account address string', async () => {
    //         try {
    //             // Web3
    //             const web3Ins = new Web3(provider)
    //             // Retrieve the balance of one of the accounts
    //             NockUtil.mockDispatch()
    //             NockUtil.mockGetHeight()
    //             NockUtil.mockGetNodeParams()
    //             NockUtil.mockRelay()

    //             const response = await web3Ins.eth.getBalance("")
    //             expect(response).to.be.instanceOf(Error)
    //         } catch (error) {
    //             expect(error).to.be.instanceOf(Error)
    //         }
    //     })

    //     it('should fail to send a new transaction due to no account imported and unlocked', async () => {
    //         try {
    //             // Import and Unlock an account
    //             // provider.provider.pocket.importAndUnlockAccount(passphrase, appPrivKeyHex)
    //             // Transfers eth from accounts[0] to accounts[1]
    //             var tx = {
    //                 from: ethTransactionSigner.accounts[0],
    //                 to: ethTransactionSigner.accounts[1],
    //                 value: numberToHex(10000), // Change value for the amount being sent
    //                 gas: "0x5208",
    //                 gasPrice: "0x3B9ACA00",
    //                 nonce: numberToHex(12345)
    //             }

    //             var payload = {
    //                 jsonrpc: "2.0",
    //                 method: "eth_sendTransaction",
    //                 params: [tx],
    //                 id: (new Date()).getTime()
    //             }
    //             // Mock responses
    //             NockUtil.mockDispatch()
    //             NockUtil.mockGetHeight()
    //             NockUtil.mockGetNodeParams()
    //             NockUtil.mockTransactionRelay()

    //             const response = await provider.send(payload)
    //             expect(response).to.be.instanceOf(Error)
    //         } catch (error) {
    //             expect(error).to.be.instanceOf(Error)
    //         }
    //     })
    // })
})