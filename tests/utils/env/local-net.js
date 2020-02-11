
class LocalNet {
    constructor(){
        this._ip = 'http://127.0.0.1'
    }

    getTendermintRPC() {
        return this._ip + ':80'
    }
    getTendermintPeers() {
        return this._ip + ':80'
    }
    getPOKTRPC() {
        return this._ip + ':80'
    }
}
module.exports = {LocalNet}