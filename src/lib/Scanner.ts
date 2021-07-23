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
    protected _provider: ethers.providers.JsonRpcProvider;
    protected instance: ethers.Contract;
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
            let predata = [
                this.getAbi(),
                this.getCode(),
                (new RPCConnection(this.network)).connect(),
                DBCache.new()
            ];

            let _initials = await Promise.all(<any>predata);

            this.abi = <string>_initials[0]; //await this.getAbi();
            this.code = <string>_initials[1]; //await this.getCode();
            this._provider = <ethers.providers.JsonRpcProvider>_initials[2]; //await (new RPCConnection(this.network)).connect();
            this.instance = new ethers.Contract(this.address, this.abi, this._provider);
            this._cache = <DBCache>_initials[3]; //await DBCache.new();
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

        let predata = [];
        for (const prop of this.StaticProperties) {
            if (_instance[prop] && !prop.endsWith('|iseoa')) predata.push(_instance[prop]());
        }

        let _data = await Promise.all(predata);
        let cont = 0;

        for (let i = 0; i < this.StaticProperties.length; i++) {

            const prop = this.StaticProperties[i];

            if (_instance[prop] && !prop.endsWith('|iseoa')) {
                obj[prop] = _data[cont].toString();
                cont += 1;
            }

        }

        for await (const prop of this.StaticProperties) {

            if (this.isContractCheck(_instance, prop)) {
                const _prop = prop.replace('|iseoa', '');
                obj[_prop] += (await this.utils.isContract(obj[_prop])) ? ' (✅!EOA)' : ' (⚠️ EOA)';
            }

            if (prop.includes('|timelock')) {
                const _prop = prop.split('|')[0];
                if (obj[_prop] && obj[_prop].includes('!EOA)')) {
                    const addr = obj[_prop].split(' ')[0]
                    const tl = new ethers.Contract(addr, ['function delay() public view returns (uint256)'], this._provider);
                    obj['Timelock'] = `${await tl.delay()}`
                }
            }

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
        if (obj['Timelock'] && obj['owner']) obj["TL Code"] = `https://${this.domain}.com/address/${obj['owner'].split(' ')[0]}#code`

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