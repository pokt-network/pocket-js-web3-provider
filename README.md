<div align="center">
  <a href="https://www.pokt.network">
    <img src="https://user-images.githubusercontent.com/16605170/74199287-94f17680-4c18-11ea-9de2-b094fab91431.png" alt="Pocket Network logo" width="340"/>
  </a>
</div>

# Pocket-JS-Web3-Provider
Official Javascript Web3 Provider to use with the Pocket Network
<div align="lef">
  <a  href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference">
    <img src="https://img.shields.io/badge/js-reference-yellow.svg"/>
  </a>
  <a href="https://nodejs.org/"><img  src="https://img.shields.io/badge/node-%3E%3D%2010.19.0-brightgreen"/></a>
  <a href="https://npmjs.com/"><img  src="https://img.shields.io/badge/npm-%3E%3D%206.9-brightgreen"/></a>
</div>

<h1 align="left">Overview</h1>
  <div align="left">
    <a  href="https://github.com/pokt-network/pocket-js-web3-provider/releases">
      <img src="https://img.shields.io/github/release-pre/pokt-network/pocket-js-web3-provider.svg"/>
    </a>
    <a href="https://circleci.com/gh/pokt-network/pocket-js-web3-provider/tree/master">
      <img src="https://circleci.com/gh/pokt-network/pocket-js-web3-provider/tree/master.svg?style=svg"/>
    </a>
    <a  href="https://github.com/pokt-network/pocket-js-web3-provider/pulse">
      <img src="https://img.shields.io/github/contributors/pokt-network/pocket-js-web3-provider.svg"/>
    </a>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg"/>
    </a>
    <br >
    <a href="https://github.com/pokt-network/pocket-js-web3-provider/pulse">
      <img src="https://img.shields.io/github/last-commit/pokt-network/pocket-js-web3-provider.svg"/>
    </a>
    <a href="https://github.com/pokt-network/pocket-js-web3-provider/pulls">
      <img src="https://img.shields.io/github/issues-pr/pokt-network/pocket-js-web3-provider.svg"/>
    </a>
    <a href="https://github.com/pokt-network/pocket-js-web3-provider/issues">
      <img src="https://img.shields.io/github/issues-closed/pokt-network/pocket-js-web3-provider.svg"/>
    </a>
</div>

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Requirements

You should have at least have a basic knowledge of blockchain technology and know your way around JavaScript. You will also need to install the [NPM tool](https://www.npmjs.com/get-npm).

### Installation

```
npm install --save @pokt-network/web3-provider
```

## Documentation

If you would like to know how to integrate Pocket-JS-Web3-Provider into your DApp, [visit our developer portal](https://pocket-network.readme.io) that has a lot of useful tutorials and material about the Pocket Network.

```javascript
const lib = require('@pokt-network/web3-provider')
const Pocket = lib.Pocket
const Configuration = lib.Configuration
const HttpRpcProvider = lib.HttpRpcProvider
const Node = lib.Node
const BondStatus = lib.BondStatus
const PocketProvider = lib.PocketProvider

const node = new Node(
    nodeAddress, publiKey,
    jailedStatus, BondStatus.bonded,
    stakedTokens, serviceURL, chains
)

const configuration = new Configuration([node], 5, 60000, 1000000)
const rpcProvider = new HttpRpcProvider(new URL(node.serviceURL))
const pocket = new Pocket(configuration, rpcProvider)

const pocketProvider = new PocketProvider(blockchainHash, pocketAAT, pocket, ethTransactionSigner | undefined)
const web3Ins = new Web3(pocketProvider)

web3Ins.eth.getBalance(clientAccount.addressHex).then(function(response, error){
    console.log("Account balance = "+response)
})

```

## Running the tests

```
npm run test
```

## Contributing

Please read [CONTRIBUTING.md](https://github.com/pokt-network/pocket-js-web3-provider/blob/staging/CONTRIBUTING.md) for details on contributions and the process of submitting pull requests.

## Support & Contact

<div>
  <a  href="https://twitter.com/poktnetwork" ><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"></a>
  <a href="https://t.me/POKTnetwork"><img src="https://img.shields.io/badge/Telegram-blue.svg"></a>
  <a href="https://www.facebook.com/POKTnetwork" ><img src="https://img.shields.io/badge/Facebook-red.svg"></a>
  <a href="https://research.pokt.network"><img src="https://img.shields.io/discourse/https/research.pokt.network/posts.svg"></a>
</div>

## License

This project is licensed under the MIT License; see the [LICENSE.md](LICENSE.md) file for details.
