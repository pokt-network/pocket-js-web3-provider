const nock = require('nock')

class NockUtil {
    static mockRelay(code = 200) {
        const data = this.createData(code, {
            proof: 'proof',
            response: 'response',
            signature: 'signature'
        })
        return this.nockRoute("/v1/client/relay", code, data)
    }
    
    // Private functions
    static nockRoute(path = "", code = 200, data) {
        return nock('http://127.0.0.1:80/').get(path).reply(code, data)
    }

    static getError() {
        return {
            code: 500,
            message: 'Internal Server Error.'
        }
    }

    static createData(code, payload) {
        let data
        switch(true) {
            case (code > 190 && code < 204):
                data = payload
            default:
                data = this.getError()
        }
        return data
    }
}
module.exports = NockUtil