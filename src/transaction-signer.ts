
export class TransactionSigner {
    public readonly accounts: string[]
    public readonly privateKeys: {value: string}
    public readonly hasAddress: Function
    public readonly signTransaction: Function

    constructor(accounts: string[], privateKeys: {value: string}, hasAddress: Function, signTransaction: Function) {
        this.accounts = accounts
        this.privateKeys = privateKeys
        this.hasAddress = hasAddress
        this.signTransaction = signTransaction
    }
}