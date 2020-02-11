class MainNet {
    constructor(){
        this._ip = 'http://35.236.208.175'
    }

    getTendermintRPC() {
        return this._ip + ':26657'
    }
    getTendermintPeers() {
        return this._ip + ':26657'
    }
    getPOKTRPC() {
        return this._ip + ':8081'
    }
}
module.exports = {MainNet}