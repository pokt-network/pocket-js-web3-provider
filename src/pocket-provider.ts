import {
  Pocket,
  Configuration,
  RpcErrorResponse,
  RelayHeaders,
  typeGuard,
  PocketAAT,
  Hex
} from "pocket-js-core"
import { TransactionSigner } from "./transaction-signer"
import { HttpProvider, HttpProviderOptions } from 'web3-providers-2.x'

/**
 * Pocket Web3 Provider
 * Sends Relays to a service node in the Pocket Network
 * @param {string} activeBlockchain - Blockchain hash.
 * @param {Configuration} configuration - Pocket Configuration.
 * @param {TransactionSigner} transactionSigner - (optional) Transaction signer object.
 */
export class PocketProvider extends HttpProvider {
  public readonly pocket: Pocket
  public readonly pocketAAT: PocketAAT
  public readonly transactionSigner?: TransactionSigner
  public activeBlockchain: string
  public isConnected = true

  constructor(
    activeBlockchain: string,
    pocketAAT: PocketAAT,
    configuration: Configuration,
    transactionSigner?: TransactionSigner,
    host: string = "",
    timeout: HttpProviderOptions = { timeout: 10000 }
  ) {
    
    super(host, timeout)
    try {
      this.pocket = new Pocket(configuration)
      this.activeBlockchain = activeBlockchain
      this.pocketAAT = pocketAAT
      this.transactionSigner = transactionSigner
    } catch (error) {
      throw error
    }
  }
  /**
   * activeBlockchain property setter
   * @method setActiveBlockchain
   * @param {string} - Blockchain hex representation.
   * @memberof PocketProvider
   */
  public set setActiveBlockchain(blockchain: string) {
    if (blockchain.length !== 0 && Hex.isHex(blockchain)) {
      this.activeBlockchain = blockchain
    }
  }
  // TODO: For testing please remove
  send2(method: string, parameters: any[]): Promise<any> {
    super.send(method, parameters)
    console.log("CUSTOM SEND")
    return Promise.resolve("")
  }
  /**
   * 
   * @method send
   * @param {{}} payload - Object containing the payload.
   * @returns {RelayResponse} - Relay response object.
   * @memberof PocketProvider
   */
  public async send(payload: {}): Promise<any> {
    // Check the relay request
    console.log('PAYLOAD = '+payload)
    
    const relayData = await this._generateRelayData(payload)
    if (typeGuard(relayData, Error)) {
      throw relayData
    }
    super.send(relayData.method, relayData.parameters)
    const relayHeaders: RelayHeaders = { [""]: "" }

    try {
      // Send relay to the network
      const result = await this.pocket.sendRelay(
        JSON.stringify(relayData),
        this.activeBlockchain,
        relayHeaders,
        this.pocketAAT,
      )
      // Handle the result
      if (typeGuard(result, Error)) {
        this.isConnected = false
        // Throw error result
        throw result
      } else {
        return JSON.parse(result.response)
      }
    } catch (error) {
      this.isConnected = false
      throw error
    }
  }
  /**
   * Verifies the Pocket Provider minimum requirements
   * @method isValid
   * @memberof PocketProvider
   */
  public isValid() {
    return this.activeBlockchain.length !== 0 &&
      Hex.isHex(this.activeBlockchain) &&
      this.pocketAAT.isValid()
  }
  /**
   * Method to get the nonce for a given address
   * @method _getNonce
   * @param {string} sender - Sender's address.
   * @returns {RelayResponse} - A relay response object.
   * @memberof PocketProvider
   */
  private async _getNonce(
    sender: string
  ): Promise<{} | Error> {
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
  private async _generateRelayData(
    payload: any = {}
  ): Promise<any | Error> {
    // Retrieve method from payload
    const method = payload.method
    // Check rpc method
    if (method !== undefined && method === "eth_sendTransaction") {
      const relayData = await this._parseRelayParams(payload)
      return relayData
    } else {
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
  private async _parseRelayParams(
    payload: any = {}
  ): Promise<any | Error> {
    const txParams = payload.params
    const sender = payload.from

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
