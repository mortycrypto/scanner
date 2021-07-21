import * as fs from "fs";
const fss = fs.promises;
import { BigNumber, Contract, ethers } from "ethers";
import axios from "axios";

import { ApiKeys, Domains, Network, RPCConnection } from "./provider";
import { Utils } from "./utils";
import { Address, Token } from "./Cache";
import { DBCache } from "./DBCache";

export class Scanner {
    readonly address: Address;
    readonly utils: Utils;
    readonly network: Network;
    private abi: string = '';
    private code: string = '';
    private _provider: ethers.providers.JsonRpcProvider;
    private instance: ethers.Contract;
    protected _cache: DBCache;
    readonly domain: string;
    readonly apiKey: string;

    protected StaticProperties: string[] = [];
    protected FunctionProperties: string[] = [];

    protected constructor(address: Address, network: Network) {
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

    public static async new(address: Address, network: Network): Promise<Scanner> {
        const r = new Scanner(address, network);
        r.init();
        return r;
    }

    public at(address: Address) {
        return new Scanner(address, this.network);
    }

    private async getAbi(): Promise<string> {
        if (this.abi.length > 0) return this.abi;

        // const file_path = `${process.cwd()}/temp/${this.address}.json`;
        const file_path = `${__dirname}/../../temp/${this.address}.json`;

        if (fs.existsSync(file_path)) {
            const content = await fss.readFile(file_path);
            this.abi = JSON.parse(content.toString());
        }

        const _abi = (
            await axios.get(
                `https://api.${this.domain}.com/api?module=contract&action=getabi&address=${this.address}&apikey=${this.apiKey}`
            )
        ).data.result;

        await fss.writeFile(file_path, _abi);

        this.abi = _abi;

        return this.abi;

    }

    protected async getCode(): Promise<string> {
        if (this.code.length > 0) return this.code;

        const file_path = `${__dirname}/../../temp/codes/${this.address}.txt`;

        if (fs.existsSync(file_path)) {
            const content = await fss.readFile(file_path);
            this.code = content.toString();
        }

        const _code = (
            await axios.get(
                `https://api.${this.domain}.com/api?module=contract&action=getsourcecode&address=${this.address}&apikey=${this.apiKey}`
            )
        ).data.result[0].SourceCode;

        await fss.writeFile(file_path, _code);

        this.code = _code;

        return this.code;
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

    public async getProperties(): Promise<Object> {
        let obj = {
            address: this.address
        };

        const _instance = await this.getInstance();

        for await (const prop of this.StaticProperties) {

            if (_instance[prop] && !prop.endsWith('|iseoa')) obj[prop] = (await _instance[prop]()).toString();

            if (this.TimelockCheck(_instance, prop)) {
                const _prop = prop.replace('|iseoa', '');
                obj[_prop] += (await this.utils.isContract(obj[_prop])) ? ' (✅!EOA)' : ' (⚠️ EOA)';
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

            if (prop.includes("|div:")) {
                const divisor = prop.split(':')[1];
                const _prop = prop.split('|')[0];
                if (this.Exists(_instance, _prop)) obj[_prop] = BigNumber.from(await _instance[_prop]()).div(divisor).toString();
            }

        }

        for await (const prop of this.FunctionProperties) {
            const p = prop.indexOf('(');
            const fun: string = prop.substr(0, p);
            if (_instance[fun]) {
                const param: string = prop.substr(p, prop.length - p).replace('(', '').replace(')', '').replace(' ', '');
                if (obj[param]) {
                    obj[`${fun}(${param})`] = `${await _instance[fun](this.utils.cleanAddress(obj[param]))}`;
                }
            }
        }

        // Lo agregamos al cache.
        if (obj["symbol"]) {
            await this._updateCacheHook({ symbol: <string>obj["symbol"], address: this.address })
        }

        if (obj['startBlock'])
            obj['Countdown'] = `https://${this.domain}.com/block/countdown/${obj['startBlock']}`;

        if (obj['address']) obj["Code"] = `https://${this.domain}.com/address/${obj['address']}#code`

        return obj;
    }

    protected async _updateCacheHook(token: Token): Promise<void> { };

    private TimelockCheck(_instance: Contract, prop: string): boolean {
        return _instance[prop.replace('|iseoa', '')] && prop.endsWith('|iseoa');
    }

    private Exists(_instance: Contract, prop: string): boolean {
        return _instance[prop];
    }

}