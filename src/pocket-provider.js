const pocket_core = require('pocket-js-core')
const Pocket = pocket_core.Pocket
const typeGuard = pocket_core.typeGuard
const Hex = pocket_core.Hex

class PocketProvider {
  constructor(activeBlockchain, pocketAAT, configuration, rpcProvider, transactionSigner) {
    this.pocket = new Pocket(configuration, rpcProvider)
    this.activeBlockchain = activeBlockchain
    this.pocketAAT = pocketAAT
    this.transactionSigner = transactionSigner
    this.isConnected = true

    if (!this.isValid()) {
      throw new Error("Invalid PocketProvider properties.");
    }
  }
  /**
   * activeBlockchain property setter
   * @method setActiveBlockchain
   * @param {string} - Blockchain hex representation.
   * @memberof PocketProvider
   */
  set setActiveBlockchain(blockchain) {
    if (blockchain.length !== 0 && Hex.isHex(blockchain)) {
      this.activeBlockchain = blockchain
    }
  }
  /**
   * 
   * @method send
   * @param {{}} payload - Object containing the payload.
   * @returns {RelayResponse} - Relay response object.
   * @memberof PocketProvider
   */
  async send(payload, callback) {
    // Check the relay request
    const relayData = await this._generateRelayData(payload)
    if (typeGuard(relayData, Error)) {
      throw relayData
    }
    
    try {
      // Send relay to the network
      const result = await this.pocket.sendRelay(
        JSON.stringify(relayData),
        this.activeBlockchain,
        this.pocketAAT,
      )
      // Handle the result if is an Error
      if (typeGuard(result, Error)) {
        this.isConnected = false
        // Return error result
        if (callback) {
          callback(result)
          return
        }
        return result
      }
      // Result is SendResponse
      if (callback) {
        callback(null, JSON.parse(result.response))
        return
      }
      // return if async
      return JSON.parse(result.response)
    } catch (error) {
      this.isConnected = false
      if (callback) {
        callback(error)
        return
      }
      // return if async
      return error
    }
  }

  /**
   * Verifies the Pocket Provider minimum requirements
   * @method isValid
   * @memberof PocketProvider
   */
  isValid() {
    return this.activeBlockchain.length !== 0 &&
      this.pocketAAT.isValid()
  }
  /**
   * Method to get the nonce for a given address
   * @method _getNonce
   * @param {string} sender - Sender's address.
   * @returns {RelayResponse} - A relay response object.
   * @memberof PocketProvider
   */
  async _getNonce(sender) {
    const data = JSON.stringify({
      "id": new Date().getTime(),
      "jsonrpc": "2.0",
      "method": "eth_getTransactionCount",
      "params": [sender, "latest"]
    })
    try {
      const result = await this.send(data)

      if (typeGuard(result, RpcErrorResponse)) {
        return new Error(result.message)
      }
      return result
    } catch (error) {
      return error
    }
  }

  /**
   * Method to generate the relay data according to the given JSON-RPC payload
   * @method _generateRelayData
   * @param {any} relay - Provided relay payload object.
   * @returns {any} - Relay request data object.
   * @memberof PocketProvider
   */
  async _generateRelayData(payload) {
    try {
      // Retrieve method from payload
      const method = payload.method
      // Check rpc method
      if (method !== undefined && method === "eth_sendTransaction") {
        const relayData = await this._parseRelayParams(payload)
        return relayData
      } else {
        return payload
      }
    } catch {
      return payload
    }
  }

  /**
   * Method to parse the relay payload
   * @method _parseRelayParams
   * @param {RelayPayload} payload - Relay payload object.
   * @returns {RelayRequest} - Relay request.
   * @memberof PocketProvider
   */
  async _parseRelayParams(payload) {
    const txParams = payload.params[0]
    const sender = txParams.from

    // Verify address exists in the TransactionSigner
    if (this.transactionSigner === undefined) {
      return new Error(
        "Error: TransactionSigner is undefined"
      )
    }
    const hasAddress = await this.transactionSigner.hasAddress(sender)
    // Handle errors
    if (hasAddress === false || hasAddress === undefined) {
      return new Error("Address doesn't exist in the provided transactionSigner")
    }
    // Get the nonce for the sender
    const nonce = await this._getNonce(sender)
    // Handle errors
    if (typeGuard(nonce, RpcErrorResponse)) {
      return nonce
    }
    // Assign the nonce value to the tx params
    txParams.nonce = nonce

    // Signs the transaction with the updated nonce
    const signedTx = await this.transactionSigner.signTransaction(txParams)
    if (typeGuard(signedTx, RpcErrorResponse)) {
      return signedTx
    }
    // Create relay data object
    const relayData = {
      "id": new Date().getTime(),
      "jsonrpc": "2.0",
      "method": "eth_sendRawTransaction",
      "params": [signedTx]
    }
    return relayData
  }
}

module.exports = PocketProvider