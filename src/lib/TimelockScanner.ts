import { Address } from './Cache';
import { Network } from './provider';
import { Scanner } from './Scanner';

interface Tx {
    hash: string,
    type: number,
    accessList: any,
    blockHash: string,
    blockNumber: number,
    transactionIndex: number,
    confirmations: number,
    from: string,
    gasPrice: number,
    gasLimit: number,
    to: string,
    value: number,
    nonce: number,
    data: string,
    r: string,
    s: string,
    v: number,
    creates: any,
    chainId: number
}

interface IndividualTx {
    from: string,
    to: string,
    data: string
}

export class TimelockScanner extends Scanner {
    private from: number = 0;
    private to: number = 0;

    protected StaticProperties: string[] = [
        'delay',
        'delay|div:3600',
        'delay|unit:hs',
        'minDelay',
        'minDelay|div:3600',
        'minDelay|unit:hs',
        'admin',
        'devWalletAddress'
    ];

    protected constructor(address: Address, network: Network, noCache?: boolean) {
        super(address, network, noCache);
    }

    public static async new(address: Address, network: Network, noCache?: boolean): Promise<TimelockScanner> {
        return new TimelockScanner(address, network, noCache);
    }

    public setPeriod(from: number, to: number): void {
        console.log('from type: ', typeof from, 'this.from type: ', typeof this.from)
        this.from = from;
        this.to = to;
    }

    private async getCurrentBlock(): Promise<number> {
        return await this._provider.getBlockNumber();
    }

    public async getProperties(): Promise<Object> {

        if (this.from < 800000) throw new Error(`From too back {FROM: ${this.from}}`);
        if (this.to < this.from && this.to > 0) throw new Error(`BAD {FROM: ${this.from} TO: ${this.to}}`);

        const data: Object = await super.getProperties();

        let obj = {
            address: this.address,
            fromBlock: this.from,
            toBlock: this.to > 0 ? this.to : await this.getCurrentBlock(),
            ...data
        };

        this.to = obj.toBlock;

        console.log(`Fetching Txs from ${this.from} to ${this.to}...`)

        let predata = [];

        for (let i = this.from; i <= this.to; i++) {
            predata.push(
                this._provider.getBlockWithTransactions(i)
            );
        }

        const blocks = await Promise.all(predata);

        const txs = blocks.map(block => { return block.transactions })

        let _txs = [];

        const t = txs.map(tx => tx.forEach(_t => {
            console.log(_t.to)
            if (_t.to === this.address) _txs.push(_t)
        }))

        console.log(_txs)



        //     .filter((tx: Tx) => {
        //     console.log(tx.to, typeof tx.to, this.address, typeof this.address)
        //     return tx.to === <string>this.address
        // })

        // console.log(txs, txs.length)

        // console.log(blocks)

        return obj;

    }
}