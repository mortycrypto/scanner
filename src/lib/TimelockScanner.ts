import * as fs from "fs";
const fss = fs.promises;
import { BigNumber, Contract, ethers } from "ethers";
import axios from "axios";

import { ApiKeys, Domains, Network, RPCConnection } from "./provider";
import { Utils } from "./utils";
import { Address, Token } from "./Cache";
import { DBCache } from "./DBCache";

export class TimelockScanner {
    readonly address: Address;
    private from: number;
    private to:number;
    readonly utils: Utils;
    readonly network: Network;
    private abi: string = '';
    private code: string = '';
    private _provider: ethers.providers.JsonRpcProvider;
    private instance: ethers.Contract;
    protected _cache: DBCache;
    readonly domain: string;
    readonly apiKey: string;

    protected StaticProperties: string[] = [
        'delay',
        'delay|div:3600',
        'delay|unit:hs',
        'admin'
    ];
    protected FunctionProperties: string[] = [];

    protected constructor(address: Address, from: number, to: number, network: Network) {
        this.address = address;
        this.network = network;

        for (const [value, name] of Object.entries(Network)) {
            if (this.network === name) {
                this.domain = Domains[value];
                this.apiKey = ApiKeys[value];
            }
        }

        this.utils = new Utils(network);
    }

    public async isValid(): Promise<Boolean> {
        return await this.utils.isContract(this.address)
    }

    public static async new(address: Address, from: number, to: number, network: Network): Promise<TimelockScanner> {
        const r = new TimelockScanner(address, from, to, network);
        await r.init();
        return r;
    }

    private async getAbi(): Promise<string> {
        try {
            if (this.abi.length > 0) return this.abi;

            // const file_path = `${process.cwd()}/temp/${this.address}.json`;
            const file_path = `${__dirname}/../../temp/${this.address}.json`;

            if (fs.existsSync(file_path)) {
                const content = await fss.readFile(file_path);
                if (content.toString().startsWith('[')) {
                    this.abi = JSON.parse(content.toString());
                    return this.abi;
                }
            }

            const _abi = (
                await axios.get(
                    `https://api.${this.domain}.com/api?module=contract&action=getabi&address=${this.address}&apikey=${this.apiKey}`
                )
            ).data.result;

            await fss.writeFile(file_path, _abi);

            this.abi = _abi;

            return this.abi;

        } catch (error) {
            throw Error(`${error} (!Verified?)`)
        }
    }

    protected async getCode(): Promise<string> {
        try {

            if (this.code.length > 0) return this.code;

            const file_path = `${__dirname}/../../temp/codes/${this.address}.txt`;

            if (fs.existsSync(file_path)) {
                const content = await fss.readFile(file_path);
                if (content.toString() !== '') {
                    this.code = content.toString();
                    return this.code;
                }
            }

            const _code = (
                await axios.get(
                    `https://api.${this.domain}.com/api?module=contract&action=getsourcecode&address=${this.address}&apikey=${this.apiKey}`
                )
            ).data.result[0].SourceCode;

            await fss.writeFile(file_path, _code);
            
            this.code = _code;
            
            return this.code;
        } catch (error) {
            throw Error(`${error} (!Verified?)`)
        }
    }
            
    protected async init(): Promise<void> {
        if (!this.instance) {
            this.abi = await this.getAbi();
            this.code = await this.getCode();
            this._provider = await (new RPCConnection(this.network)).connect();
            this.instance = new ethers.Contract(this.address, this.abi, this._provider);
            this._cache = await DBCache.new();
        }
    }

    public async getInstance(): Promise<ethers.Contract> {
        if (!this.instance) await this.init();
        return this.instance;
    }

    public async getProvider(): Promise<ethers.providers.JsonRpcProvider> {
        if (!this._provider) await this.init();
        return this._provider;
    }

    private async getCurrentBlock():Promise<number>{
        return await this._provider.getBlockNumber();
    }

    public async getProperties(): Promise<Object> {

        if (this.from < 800000) throw new Error(`From too back {FROM: ${this.from}}`);
        if (this.to < this.from && this.to > 0) throw new Error(`BAD {FROM: ${this.from} TO: ${this.to}}`);
        
        let obj = {
            address: this.address,
            fromBlock: this.from,
            toBlock: this.to > 0 ? this.to : await this.getCurrentBlock()
        };

        const _instance = await this.getInstance();

        for await (const prop of this.StaticProperties) {
            if (_instance[prop] && !prop.endsWith('|iseoa')) obj[prop] = (await _instance[prop]()).toString();

            if (prop.includes("|div:")) {
                const divisor = prop.split(':')[1];
                const _prop = prop.split('|')[0];
                if (this.Exists(_instance, _prop)) {
                    obj[_prop] = BigNumber.from(await _instance[_prop]()).div(divisor).toString()
                } else if (obj[_prop]) {
                    obj[_prop] = BigNumber.from(obj[_prop]).div(divisor).toString();
                }
            }

            if (prop.includes('|unit:')) {
                const unit = prop.split(':')[1];
                const _prop = prop.split('|')[0];
                if (obj[_prop]) obj[_prop] += ` ${unit}`
            }

            if (prop.endsWith("|exists")) {
                const _prop = prop.replace('|exists', '');
                obj[_prop] = !this.Exists(_instance, _prop) ? '✅ All Clear' : '🚨 WARNING! EXISTS!!';
            }

        }

        return obj;

    }

    protected async _updateCacheHook(token: Token): Promise<void> { };

    private isContractCheck(_instance: Contract, prop: string): boolean {
        return _instance[prop.replace('|iseoa', '')] && prop.endsWith('|iseoa');
    }

    private Exists(_instance: Contract, prop: string): boolean {
        return _instance[prop];
    }

}