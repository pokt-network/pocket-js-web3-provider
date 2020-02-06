const nock = require('nock')
const pocket_core = require('pocket-js-core')
const Environment = pocket_core.Environment
const Proof = pocket_core.Proof
const Node = pocket_core.Node
const SessionHeader = pocket_core.SessionHeader
const BondStatus = pocket_core.BondStatus
const Routes = pocket_core.Routes
const RPCRoutes = pocket_core.RPCRoutes
const PocketAAT = pocket_core.PocketAAT

const env = new Environment.LocalNet()
const version = '0.0.1'
const addressHex = "84871BAF5B4E01BE52E5007EACF7048F24BF57E0"
const clientPublicKey = 'f6d04ee2490e85f3f9ade95b80948816bd9b2986d5554aae347e7d21d93b6fb5'
const applicationPublicKey = 'd9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'
const applicationPrivateKey = '15f53145bfa6efdde6e65ce5ebfd330ac0a2591ae451a8a03ace99eff894b9eed9c7f275388ca1f87900945dba7f3a90fa9bba78f158c070aa12e3eccf53a2eb'

class NockUtil {
    static mockRelay(code = 200) {
        const pocketAAT = PocketAAT.from(version, clientPublicKey, applicationPublicKey, applicationPrivateKey)
        const proof = new Proof(BigInt(1), BigInt(5), applicationPublicKey, "ETH04", pocketAAT, pocketAAT.applicationSignature)
        const data = this.createData(code, {
            proof: proof.toJSON(),
            response: JSON.stringify({
                "id":1,
                "jsonrpc": "2.0",
                "result": "0x0234c8a3397aab58"
              }),
            signature: addressHex
        })
        
        const response = this.getResponseObject(data, code)
        return this.nockRoute(Routes.RELAY.toString(), code, response)
    }

    static mockTransactionCountRelay(code = 200) {
        const pocketAAT = PocketAAT.from(version, clientPublicKey, applicationPublicKey, applicationPrivateKey)
        const proof = new Proof(BigInt(1), BigInt(5), applicationPublicKey, "ETH04", pocketAAT, pocketAAT.applicationSignature)
        const data = this.createData(code, {
            proof: proof.toJSON(),
            response: JSON.stringify({
                "id":1,
                "jsonrpc": "2.0",
                "result": "0x4dc"
              }),
            signature: addressHex
        })
        
        const response = this.getResponseObject(data, code)
        return this.nockRoute(Routes.RELAY.toString(), code, response)
    }

    static mockTransactionRelay(code = 200) {
        const pocketAAT = PocketAAT.from(version, clientPublicKey, applicationPublicKey, applicationPrivateKey)
        const proof = new Proof(BigInt(1), BigInt(5), applicationPublicKey, "ETH04", pocketAAT, pocketAAT.applicationSignature)
        const data = this.createData(code, {
            proof: proof.toJSON(),
            response: JSON.stringify({
                "id":1,
                "jsonrpc": "2.0",
                "result": "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
              }),
            signature: addressHex
        })
        
        const response = this.getResponseObject(data, code)
        return this.nockRoute(Routes.RELAY.toString(), code, response)
    }

    static mockDispatch(code = 200) {
        const node01 = new Node(addressHex, applicationPublicKey, false, BondStatus.bonded,
            BigInt(100), env.getPOKTRPC(), ["ETH01", "ETH04"])
        const node02 = new Node(addressHex, applicationPublicKey, false, BondStatus.bonded,
            BigInt(100), env.getPOKTRPC(), ["ETH01", "ETH04"])
        const sessionHeader = new SessionHeader(applicationPublicKey, "ETH04", BigInt(5))

        const data = this.createData(code, {
            header: sessionHeader.toJSON(),
            key: 'key',
            nodes: [node01.toJSON(), node02.toJSON()]
        })
        
        const response = this.getResponseObject(data, code)
        return this.nockRoute(Routes.DISPATCH.toString(), code, response)
    }

    static mockGetHeight(code = 200) {
        const data = this.createData(code, {
            height: '5n'
        })
        
        const response = this.getResponseObject(data, code)
        return this.nockRoute(RPCRoutes.QueryHeight.toString(), code, response)
    }

    static mockGetNodeParams(code= 200) {
        const data = this.createData(code, {
            downtime_jail_duration: BigInt(101).toString(16),
            max_evidence_age: BigInt(111).toString(16),
            max_validator: BigInt(10).toString(16),
            min_signed_per_window: BigInt(1).toString(16),
            proposer_reward_percentage: 50,
            relays_to_tokens: BigInt(2).toString(16),
            session_block: BigInt(5).toString(16),
            signed_blocks_window: BigInt(3).toString(16),
            slash_fraction_double_sign: BigInt(1).toString(16),
            slash_fraction_downtime: BigInt(10).toString(16),
            stake_denom: 'stake_denom',
            stake_minimum: BigInt(1).toString(16),
            unstaking_time: BigInt(1000).toString(16)
        })

        const response = this.getResponseObject(data, code)
        return this.nockRoute(RPCRoutes.QueryNodeParams.toString(), code, response)
    }
    
    // Private functions
    static getResponseObject(data, code) {
        return {
            config: {},
            data: data,
            headers: { "Content-Type": "application/json" },
            status: code,
            statusText: code.toString()
        }
    }
    static nockRoute(path, code = 200, data) {
        return nock(env.getPOKTRPC()).persist().post(path).reply(code, data)
    }

    static getError() {
        const data = {
            code: 500,
            message: 'Internal Server Error.'
        }
        const response = this.getResponseObject(data, 500)
        return response
    }

    static createData(code, payload) {
        if (code === 200) {
            return payload
        }
        return this.getError()
    }
}
module.exports = NockUtil