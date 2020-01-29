import nock from 'nock'

export class NockUtil {
    public static mockRelay(code: number = 200): nock.Scope{
        const data: any = this.createData(code, {
            proof: 'proof',
            response: 'response',
            signature: 'signature'
        })
        return this.nockRoute("/v1/client/relay", code, data)
    }
    
    // Private functions
    private static nockRoute(path: string = "", code: number = 200, data: any): nock.Scope{
        return nock('http://127.0.0.1:80/').get(path).reply(code, data)
    }

    private static getError(): any {
        return {
            code: 500,
            message: 'Internal Server Error.'
        }
    }

    private static createData(code: number, payload: any): any {
        let data: any
        switch(true) {
            case (code > 190 && code < 204):
                data = payload
            default:
                data = this.getError()
        }
        return data
    }
}