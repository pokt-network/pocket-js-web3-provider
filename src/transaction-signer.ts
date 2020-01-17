export class TransactionSigner {
  public readonly accounts: string[]
  public readonly privateKeys: string[]
  public readonly hasAddress: (address: string) => Promise<boolean>
  public readonly signTransaction: (txParams: {}) => Promise<string>

  constructor(
    accounts: string[],
    privateKeys: string[],
    hasAddress: (address: string) => Promise<boolean>,
    signTransaction: (txParams: {}) => Promise<string>
  ) {
    this.accounts = accounts
    this.privateKeys = privateKeys
    this.hasAddress = hasAddress
    this.signTransaction = signTransaction
  }
}
