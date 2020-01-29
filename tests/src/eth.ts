/**
 * @author Pabel Nunez Landestoy <pabel@pokt.network>
 * @description Unit test for the Pocket Web3 Provider
 */
import { expect, assert } from "chai"
import { PocketProvider } from "../../src/pocket-provider"
import { TransactionSigner } from "../../src/transaction-signer"
import { Transaction } from "ethereumjs-tx"
import { numberToHex } from "web3-utils"
import { Configuration, PocketAAT, Node, BondStatus } from "pocket-js-core"
import { NockUtil } from '../utils/nock-util'
// To test with Web3 2.x use 'web3-2.x' and for Web3 1.x use 'web3-1.x'
import Web3 from 'web3-2.x'
import { TransactionConfig } from 'web3-core'
import { HttpProvider } from "web3-providers-2.x"

// For Testing we are using dummy data, none of the following information is real.
const version = '0.0.1'
const addressHex = "84871BAF5B4E01BE52E5007EACF7048F24BF57E0"
const clientPublicKey = 'f6d04ee2490e85f3f9ade95b80948816bd9b2986d5554aae347e7d21d93b6fb5'
const applicationPublicKey = 'd9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'
const applicationPrivateKey = '15f53145bfa6efdde6e65ce5ebfd330ac0a2591ae451a8a03ace99eff894b9eed9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'
const passphrase = "passphrase123"
// Ethereum data setup for test
const ethTxSigner = {
    // Needs at least 2 accounts in the node to run all tests
    accounts: ["0xf892400Dc3C5a5eeBc96070ccd575D6A720F0F9f", "0xF0BE394Fb2Def90824D11C7Ea189E75a8e868fA6"],
    hasAddress: async (address: string): Promise<boolean> => {
        return ethTransactionSigner.accounts.includes(address)
    },
    // Update this object with the address - private keys for each account in the same order they are declared
    privateKeys: ["330D1AD67A9E44E15F5B7EBD20514865CBCE363B2E95FFC9D9C95198EF2893F3"],
    signTransaction: async (txParams: {}): Promise<string> => {
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
const node01 = new Node(addressHex, applicationPublicKey, false, BondStatus.bonded, BigInt(100), "http://127.0.0.1:80/", [blockchain])
const configuration = new Configuration([node01], 5, 40000, 200)

describe('Ethereum PocketProvider', function () {
    describe("Success scenarios", async () => {
        const provider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)

        it('should create a new instance of the PocketProvider', function () {
            expect(function(){
                const pocketProvider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)
            }).to.not.throw(Error)
        })

        it('should send a new request', async () => {
            // Import and Unlock an account
            provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
            // 
            var payload = {
                "jsonrpc": "2.0",
                "method": "eth_getBalance",
                "params": [ethTransactionSigner.accounts[0], "latest"],
                "id": (new Date()).getTime()
            }
            // Retrieve the balance of one of the accounts
            NockUtil.mockRelay()
            const web3Ins = new Web3(provider)
            web3Ins.setProvider(provider as PocketProvider)
            // const response = await web3Ins.eth.getBalance(ethTransactionSigner.accounts[0])
            console.log(web3Ins.currentProvider as PocketProvider)
            // provider.send = function send(payload: {}): Promise<any> {
            //         console.log("CUSTOM SEND")
            //         return Promise.resolve("")
            // }
            const response = await provider.send(payload)
            
            expect(response).to.not.be.instanceOf(Error)
            // const response = await provider.send("eth_getBalance", [ethTransactionSigner.accounts[0], "latest"])
            // const response = await provider.send(payload)
            
        })

        // it('should submit transactions using eth_sendTransaction', async () => {
        //     // Import and Unlock an account
        //     provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
        //     // Instantiate the Web3 client with the Pocket Provider
        //     const web3Client = new Web3(provider)
        //     expect(web3Client).to.be.an.instanceof(Web3)
        //     // Transfers eth from accounts[0] to accounts[1]
        //     const tx: TransactionConfig = {
        //         "from": ethTransactionSigner.accounts[0],
        //         "gas": "0x5208",
        //         "gasPrice": "0x3B9ACA00",
        //         "to": ethTransactionSigner.accounts[1],
        //         "value": numberToHex(10000), // Change value for the amount being sent
        //     }
        //     // NockUtil.mockRelay()
        //     const response = await web3Client.eth.sendTransaction(tx)
        //     expect(response).to.not.be.an.instanceof(Error)
        // })
    })
    // describe("Error scenarios", async () => {
    //     const emptyBlockchainHex = ""
    //     const invalidBlockchainHex = "ETH04ZZ"
    //     it('should fail to send a new request due to empty blockchain string', async () => {
    //         const provider = new PocketProvider(emptyBlockchainHex, pocketAAT, configuration, ethTransactionSigner)
    //         // Import and Unlock an account
    //         provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
    //         // Instantiate the Web3 client with the Pocket Provider
    //         const web3Client = new Web3(provider)
    //         expect(web3Client).to.be.an.instanceof(Web3)
    //         // Retrieve the balance of one of the accounts
    //         const response = await web3Client.eth.getBalance(ethTransactionSigner.accounts[0])
    //         expect(response).to.be.an.instanceof(Error)
    //     })
    //     it('should fail to send a new request due to invalid blockchain hex', async () => {
    //         const provider = new PocketProvider(invalidBlockchainHex, pocketAAT, configuration, ethTransactionSigner)
    //         // Import and Unlock an account
    //         provider.pocket.importAndUnlockAccount(passphrase, applicationPrivateKey)
    //         // Instantiate the Web3 client with the Pocket Provider
    //         const web3Client = new Web3(provider)
    //         expect(web3Client).to.be.an.instanceof(Web3)
    //         // Retrieve the balance of one of the accounts
    //         const response = await web3Client.eth.getBalance(ethTransactionSigner.accounts[0])
    //         expect(response).to.be.an.instanceof(Error)
    //     })

    //     it('should fail to send a new request due to no account imported and unlocked', async () => {
    //         const provider = new PocketProvider(blockchain, pocketAAT, configuration, ethTransactionSigner)
    //         // Import and Unlock an account
    //         // No Imports or unlock

    //         // Instantiate the Web3 client with the Pocket Provider
    //         const web3Client = new Web3(provider)
    //         expect(web3Client).to.be.an.instanceof(Web3)
    //         // Retrieve the balance of one of the accounts
    //         const response = await web3Client.eth.getBalance(ethTransactionSigner.accounts[0])
    //         expect(response).to.be.an.instanceof(Error)
    //     })
    // })
})