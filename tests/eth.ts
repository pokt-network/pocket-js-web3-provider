/**
 * @author Pabel Nunez Landestoy <pabel@pokt.network>
 * @description Unit test for the Pocket Web3 Provider
 */
import { expect } from "chai"
import { PocketProvider } from "../src/index"
import { TransactionSigner } from "../src/transaction-signer"
import { Transaction } from "ethereumjs-tx"
import { numberToHex } from "web3-utils"
import { Configuration, RelayHeaders, typeGuard, RpcErrorResponse } from "pocket-js-core"
import { PocketAAT } from "pocket-aat-js"


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

    const provider = new PocketProvider(blockchain, configuration, undefined, ethTransactionSigner)

    it('should create a new instance of the PocketProvider', function () {
        const pocketProvider = new PocketProvider(blockchain, configuration, undefined, ethTransactionSigner)

        expect(pocketProvider).to.be.an.instanceof(PocketProvider)
    })

    it('should send a new request', async () => {
        const data = JSON.stringify({
            "id": (new Date()).getTime(),
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [ethTransactionSigner.accounts[0], "latest"],
        })
        const relayHeaders: RelayHeaders = {[""]: ""}

        const relay = await provider.pocket.createRelayRequest(data,
            blockchain,
            relayHeaders,
            undefined,
            true,
            undefined,
            undefined
        )
        if (typeGuard(relay, RpcErrorResponse)) {
            throw new Error('Expected relay to be of type RelayRequest')
        }
        expect(relay).to.be.a('RelayRequest')
        const response = await provider.send(relay)
        expect(response).to.not.be.an.instanceof(Error)
    })

    it('should submit transactions using eth_sendTransaction', async () => {
        // Transfers eth from accounts[0] to accounts[1]
        const tx = {
            "from": ethTransactionSigner.accounts[0],
            "gas": "0x5208",
            "gasPrice": "0x3B9ACA00",
            "to": ethTransactionSigner.accounts[1],
            "value": numberToHex(10000), // Change value for the amount being sent
        }

        const data = JSON.stringify({
            "id": (new Date()).getTime(),
            "jsonrpc": "2.0",
            "method": "eth_sendTransaction",
            "params": [tx]
        })
        
        const relayHeaders: RelayHeaders = {[""]: ""}

        const relay = await provider.pocket.createRelayRequest(data,
            blockchain,
            relayHeaders,
            undefined,
            true,
            undefined,
            undefined
        )
        if (typeGuard(relay, RpcErrorResponse)) {
            throw new Error('Expected relay to be of type RelayRequest')
        }

        const response = await provider.send(relay)
        expect(relay).to.be.a('RelayRequest')
        expect(response).to.not.be.an.instanceof(Error)
    })
})