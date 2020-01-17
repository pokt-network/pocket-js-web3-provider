/**
 * @author Pabel Nunez Landestoy <pabel@pokt.network>
 * @description Unit test for the Pocket Web3 Provider
 */
import { expect } from "chai"
import { PocketProvider } from "../src/index"
import { TransactionSigner } from "../src/transaction-signer"
import { Transaction } from "ethereumjs-tx"
import { numberToHex } from "web3-utils"
import { Configuration, RpcErrorResponse } from "pocket-js-core"
import { PocketAAT } from "pocket-aat-js"
// To test with Web3 2.x use 'web3-2.x' and for Web3 1.x use 'web3-1.x'
import Web3 from 'web3-2.x'
import { TransactionConfig } from 'web3-core'

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
const pocketAAT = new PocketAAT("0.1.0", "0x", "0x")
// Active blockchain
const blockchain = "ETH04"
// Configuration
const configuration = new Configuration([blockchain], pocketAAT, 5, 40000, true)

describe('Ethereum PocketProvider', function () {

    const provider = new PocketProvider(blockchain, configuration, ethTransactionSigner)

    it('should create a new instance of the PocketProvider', function () {
        const pocketProvider = new PocketProvider(blockchain, configuration, ethTransactionSigner)

        expect(pocketProvider).to.be.an.instanceof(PocketProvider)
    })

    it('should send a new request', async () => {
        // Instantiate the Web3 client with the Pocket Provider
        const web3Client = new Web3(provider)
        expect(web3Client).to.be.an.instanceof(Web3)
        // Retrieve the balance of one of the accounts
        const response = await web3Client.eth.getBalance(ethTransactionSigner.accounts[0])
        expect(response).to.not.be.an.instanceof(RpcErrorResponse)
    })

    it('should submit transactions using eth_sendTransaction', async () => {
        // Instantiate the Web3 client with the Pocket Provider
        const web3Client = new Web3(provider)
        expect(web3Client).to.be.an.instanceof(Web3)
        // Transfers eth from accounts[0] to accounts[1]
        const tx: TransactionConfig = {
            "from": ethTransactionSigner.accounts[0],
            "gas": "0x5208",
            "gasPrice": "0x3B9ACA00",
            "to": ethTransactionSigner.accounts[1],
            "value": numberToHex(10000), // Change value for the amount being sent
        }

        const response = await web3Client.eth.sendTransaction(tx)
        expect(response).to.not.be.an.instanceof(RpcErrorResponse)
    })
})