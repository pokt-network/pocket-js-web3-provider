import { Pocket, Configuration, RelayResponse, RpcErrorResponse, RelayPayload, RelayHeaders, RelayRequest, Proof, typeGuard } from 'pocket-js-core'
import { TransactionSigner } from './transaction-signer'
/**
 * Pocket Web3 Provider
 * Sends Relays to a service node in the Pocket Network
 * @constructor
 * @param {string} activeBlockchain - Blockchain hash.
 * @param {Configuration} configuration - Pocket Configuration.
 * @param {Configuration} optionalConfiguration - (optional)  Pocket alternate Configuration.
 * @param {TransactionSigner} transactionSigner - (optional) Transaction signer object.
 */
export class PocketProvider {
    public readonly pocket: Pocket
    public readonly transactionSigner?: TransactionSigner
    public activeBlockchain: string
    public _isConnected = true

    constructor(activeBlockchain: string, configuration: Configuration, optionalConfiguration?: Configuration, transactionSigner?: TransactionSigner) {
        this.pocket = new Pocket(configuration, optionalConfiguration)
        this.activeBlockchain = activeBlockchain
        this.transactionSigner = transactionSigner
    }

    /**
     * Method to get the nonce for a given address
     * @method _getNonce
     * @param {string} sender - Sender's address.
     * @returns {RelayResponse} - A relay response object.
     * @memberof PocketProvider
     */
    public async _getNonce(sender: string): Promise<RelayResponse | RpcErrorResponse> {
        let data = JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [sender, "latest"],
            id: (new Date()).getTime()
        })
        let relayHeaders: RelayHeaders = {[""]: ""}

        const relayRequest = await this.pocket.createRelayRequest(data,
            this.activeBlockchain,
            relayHeaders,
            undefined,
            true,
            undefined,
            undefined
        )

        if (!typeGuard(relayRequest, RelayRequest)) {
            return relayRequest
        }

        let response = await this.send(relayRequest)
        
        return response
    }

    /**
     * Method to generate the relay data according to the given JSON-RPC payload
     * @method _generateRelayData
     * @param {RelayRequest} relay - Provided relay request.
     * @returns {RelayRequest} - Relay request.
     * @memberof PocketProvider
     */
    async _generateRelayData(relay: RelayRequest): Promise< RelayRequest | RpcErrorResponse > {
        // Retrieve method from payload
        const method = JSON.parse(relay.payload.data).method
        // Check rpc method
        if (method === 'eth_sendTransaction') {
            let relayRequest = await this._parseRelayParams(relay.payload)
            return relayRequest
        } else {
            return relay
        }
    }

    /**
     * Method to parse the relay payload
     * @method _parseRelayParams
     * @param {RelayPayload} payload - Relay payload object.
     * @returns {RelayRequest} - Relay request.
     * @memberof PocketProvider
     */
    async _parseRelayParams(payload: RelayPayload): Promise<RelayRequest |  RpcErrorResponse> {
        let txParams = JSON.parse(payload.data).params
        let sender = JSON.parse(payload.data).from
        let _this = this

        // Verify address exists in the TransactionSigner
        if (_this.transactionSigner == undefined) {
            return new RpcErrorResponse("101", "Error: TransactionSigner is undefined")
        }
        const hasAddress = await _this.transactionSigner.hasAddress(sender)
        // Handle errors
        if (hasAddress === false || hasAddress instanceof Error) {
            return hasAddress
        }
        // Get the nonce for the sender
        const nonce = await _this._getNonce(sender)
        // Handle errors
        if (typeGuard(nonce, RpcErrorResponse)) {
            return nonce
        }
        // Assign the nonce value to the tx params
        txParams.nonce = nonce

        // Signs the transaction with the updated nonce
        const signedTx = await _this.transactionSigner.signTransaction(txParams)
        if (typeGuard(signedTx, RpcErrorResponse)) {
            return signedTx
        }
        // Create relay data object
        let relayData = JSON.stringify({
            "jsonrpc": '2.0',
            "method": 'eth_sendRawTransaction',
            "params": [signedTx],
            "id": (new Date()).getTime()
        })

        let relayHeaders: RelayHeaders = {[""]: ""}
        
        const relayRequest = await this.pocket.createRelayRequest(relayData,
            this.activeBlockchain,
            relayHeaders,
            undefined,
            true,
            undefined,
            undefined
        )
        
        return relayRequest
    }
    /**
     * 
     * @method send
     * @param {RelayRequest} relay - Object containing the relay request.
     * @returns {RelayResponse} - Relay response object.
     * @memberof PocketProvider
     */
    async send(relay: RelayRequest): Promise<RelayResponse | RpcErrorResponse> {
        // Check for the pocket instance
        if (!typeGuard(this.pocket, Pocket)) {
            return new RpcErrorResponse("101", "Unable to retrieve the Pocket instance, verify if is properly instatiated.")
        }
        const _this = this

        // Check the relay request
        var relayRequest = await _this._generateRelayData(relay);
        
        if (!typeGuard(relayRequest, RelayRequest)) {
            return relayRequest
        }
        try {
            // Send relay to the network
            const result = await _this.pocket.sendRelay(relayRequest)
            // Handle the result
            if (!typeGuard(result, RelayResponse)) {
                _this._isConnected = false
                return result
            } else {
                return result
            }

        } catch (error) {
            _this._isConnected = false
            return error
        }
    }
}
