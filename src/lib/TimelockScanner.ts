import { Address } from './Cache';
import { Network } from './provider';
import {Scanner} from './Scanner';

export class TimelockScanner extends Scanner {
    private from: number;
    private to:number;

    protected StaticProperties: string[] = [
        'delay',
        'delay|div:3600',
        'delay|unit:hs',
        'admin'
    ];

    protected constructor(address: Address, network: Network) {
        super(address, network);
    }

    public static async new(address: Address, network: Network): Promise<TimelockScanner> {
        return new TimelockScanner(address, network);
    }

    public setPeriod(from:number, to:number):void{
        console.log(from,to);
        this.from = from;
        this.to = to;
    }

    private async getCurrentBlock():Promise<number>{
        return await this._provider.getBlockNumber();
    }
    
    public async getProperties(): Promise<Object> {

        if (this.from < 800000) throw new Error(`From too back {FROM: ${this.from}}`);
        if (this.to < this.from && this.to > 0) throw new Error(`BAD {FROM: ${this.from} TO: ${this.to}}`);

        const data:Object = await super.getProperties();
        
        let obj = {
            address: this.address,
            fromBlock: this.from,
            toBlock: this.to > 0 ? this.to : await this.getCurrentBlock(),
            ...data
        };

        return obj;

    }
}