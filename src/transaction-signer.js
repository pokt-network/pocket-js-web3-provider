class TransactionSigner {
  constructor(
    accounts,
    privateKeys,
    hasAddress,
    signTransaction
  ) {
    this.accounts = accounts
    this.privateKeys = privateKeys
    this.hasAddress = hasAddress
    this.signTransaction = signTransaction
  }
}

module.exports.TransactionSigner = TransactionSigner
