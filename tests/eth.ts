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
const EthTxSigner = {
    hasAddress: async function (address: string) {
        return ethTransactionSigner.accounts.includes(address)
    },
    signTransaction: async function (txParams: {}) {
        var pkString = Object.values(ethTransactionSigner.privateKeys)[0]
        var privateKeyBuffer = Buffer.from(pkString, 'hex')
        var tx = new Transaction(txParams)
        tx.sign(privateKeyBuffer)
        return '0x' + tx.serialize().toString('hex')
    },
    // Needs at least 2 accounts in the node to run all tests
    accounts: ["0xf892400Dc3C5a5eeBc96070ccd575D6A720F0F9f", "0xF0BE394Fb2Def90824D11C7Ea189E75a8e868fA6"],
    // Update this object with the address - private keys for each account in the same order they are declared
    privateKeys: {
        value: "330D1AD67A9E44E15F5B7EBD20514865CBCE363B2E95FFC9D9C95198EF2893F3"
    }
}
// Transaction Signer
const ethTransactionSigner = new TransactionSigner(EthTxSigner.accounts, EthTxSigner.privateKeys, EthTxSigner.hasAddress, EthTxSigner.signTransaction)
// PocketAAT
const pocketAAT = new PocketAAT("0.1.0", "0x", "0x")
// Active blockchain
const blockchain = "ETH04"
// Configuration
const configuration = new Configuration([blockchain], pocketAAT, 5, 40000, true)

describe('Ethereum PocketProvider', function () {

    var provider = new PocketProvider(blockchain, configuration, undefined, ethTransactionSigner)

    it('should create a new instance of the PocketProvider', function () {
        var pocketProvider = new PocketProvider(blockchain, configuration, undefined, ethTransactionSigner)

        expect(pocketProvider).to.not.be.an.instanceof(Error)
        expect(pocketProvider).to.be.an.instanceof(PocketProvider)
        expect(pocketProvider.transactionSigner).to.not.be.undefined
    })

    it('should send a new request', async () => {
        var data = JSON.stringify({
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [ethTransactionSigner.accounts[0], "latest"],
            "id": (new Date()).getTime()
        })
        let relayHeaders: RelayHeaders = {[""]: ""}

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
        var response = await provider.send(relay)
        expect(response).to.not.be.an.instanceof(Error)
    })

    it('should submit transactions using eth_sendTransaction', async () => {
        // Transfers eth from accounts[0] to accounts[1]
        var tx = {
            "from": ethTransactionSigner.accounts[0],
            "to": ethTransactionSigner.accounts[1],
            "value": numberToHex(10000), // Change value for the amount being sent
            "gas": "0x5208",
            "gasPrice": "0x3B9ACA00"
        }

        var data = JSON.stringify({
            "jsonrpc": "2.0",
            "method": "eth_sendTransaction",
            "params": [tx],
            "id": (new Date()).getTime()
        })
        
        let relayHeaders: RelayHeaders = {[""]: ""}

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

        var response = await provider.send(relay)
        expect(relay).to.be.a('RelayRequest')
        var response = await provider.send(relay)
        expect(response).to.not.be.an.instanceof(Error)
    })
})