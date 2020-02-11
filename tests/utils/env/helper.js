const networks = require('./index')
const LocalNet = networks.LocalNet
const TestNet = networks.TestNet
const MainNet = networks.MainNet

/**
 * Enum indicating all the environment networks
 */

const Network = Object.freeze({
    LocalNet: "localNet",
    TestNet: "testNet",
    MainNet: "mainNet"
})

/**
 * Class that will return the environment based on the Network provided
 */
class EnvironmentHelper {
    static get(network = Network.LocalNet) {
        const test = network
        switch (test) {
            case "localNet":
                return new LocalNet()
            case "testNet":
                return new TestNet()
            case "mainNet":
                return new MainNet()
            default:
                return new LocalNet()
        }
    }
    static getLocalNet() {
        return new LocalNet()
    }
    static getTestNet() {
        return new TestNet()
    }
    static getMainNet() {
        return new MainNet()
    }
}

module.exports = {EnvironmentHelper}