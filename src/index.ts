import {
  Pocket,
  Configuration,
  RelayResponse,
  RpcErrorResponse,
  RelayHeaders,
  RelayRequest,
  typeGuard
} from "pocket-js-core"
import { TransactionSigner } from "./transaction-signer"
import {AbstractSocketProvider} from 'web3-providers';

/**
 * Pocket Web3 Provider
 * Sends Relays to a service node in the Pocket Network
 * @param {string} activeBlockchain - Blockchain hash.
 * @param {Configuration} configuration - Pocket Configuration.
 * @param {TransactionSigner} transactionSigner - (optional) Transaction signer object.
 */
export class PocketProvider extends AbstractSocketProvider {
  public readonly pocket: Pocket
  public readonly transactionSigner?: TransactionSigner
  public activeBlockchain: string
  public isConnected = true

  constructor(
    activeBlockchain: string,
    configuration: Configuration,
    transactionSigner?: TransactionSigner
  ) {
    super(undefined, 40000)

    this.pocket = new Pocket(configuration)
    this.activeBlockchain = activeBlockchain
    this.transactionSigner = transactionSigner
  }
  /**
   *
   * @method send
   * @param {RelayRequest} relay - Object containing the relay request.
   * @returns {RelayResponse} - Relay response object.
   * @memberof PocketProvider
   */
  public async send(payload: {}): Promise<RelayResponse | RpcErrorResponse> {
    // Check for the pocket instance
    if (!typeGuard(this.pocket, Pocket)) {
      return new RpcErrorResponse(
        "101",
        "Unable to retrieve the Pocket instance, verify if is properly instatiated."
      )
    }

    // Check the relay request
    const relayData = await this._generateRelayData(payload)

    if (typeGuard(relayData, RpcErrorResponse)) {
      return relayData
    }

    const relayHeaders: RelayHeaders = { [""]: "" }

    const relayRequest = await this.pocket.createRelayRequest(
      JSON.stringify(relayData),
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

    try {
      // Send relay to the network
      const result = await this.pocket.sendRelay(relayRequest)
      // Handle the result
      if (!typeGuard(result, RelayResponse)) {
        this.isConnected = false
        return result
      } else {
        return result
      }
    } catch (error) {
      this.isConnected = false
      return error
    }
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
  ): Promise<any | RpcErrorResponse> {
    const data = JSON.stringify({
      "id": new Date().getTime(),
      "jsonrpc": "2.0",
      "method": "eth_getTransactionCount",
      "params": [sender, "latest"]
    })

    const result = await this.send(data)

    if (typeGuard(result, RpcErrorResponse)) {
      return result
    }

    return result
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
  ): Promise<any | RpcErrorResponse> {
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
  ): Promise<any | RpcErrorResponse> {
    const txParams = payload.params
    const sender = payload.from

    // Verify address exists in the TransactionSigner
    if (this.transactionSigner === undefined) {
      return new RpcErrorResponse(
        "101",
        "Error: TransactionSigner is undefined"
      )
    }
    const hasAddress = await this.transactionSigner.hasAddress(sender)
    // Handle errors
    if (hasAddress === false) {
      return new RpcErrorResponse("101", "Address doesn't exist in the provided transactionSigner")
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
