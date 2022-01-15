"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const fs = require("fs");
const fss = fs.promises;
const ethers_1 = require("ethers");
const axios_1 = require("axios");
const provider_1 = require("./provider");
const utils_1 = require("./utils");
const DBCache_1 = require("./DBCache");
class Scanner {
    constructor(address, network, noCache) {
        this.abi = '';
        this.code = '';
        this.StaticProperties = [];
        this.FunctionProperties = [];
        this.address = address;
        this.network = network;
        this.noCache = noCache || false;
        for (const [value, name] of Object.entries(provider_1.Network)) {
            if (this.network === name) {
                this.domain = provider_1.Domains[value];
                this.apiKey = provider_1.ApiKeys[value];
            }
        }
        this.utils = new utils_1.Utils(network);
    }
    isValid() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.utils.isContract(this.address);
        });
    }
    static new(address, network) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = new Scanner(address, network);
            r.init();
            return r;
        });
    }
    at(address) {
        return new Scanner(address, this.network);
    }
    getAbi() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.abi.length > 0)
                    return this.abi;
                const file_path = `${__dirname}/../../temp/${this.address}.json`;
                if (!this.noCache) {
                    if (fs.existsSync(file_path)) {
                        const content = yield fss.readFile(file_path);
                        if (content.toString().startsWith('[')) {
                            this.abi = JSON.parse(content.toString());
                            return this.abi;
                        }
                    }
                }
                const _abi = (yield axios_1.default.get(`https://api.${this.domain}.com/api?module=contract&action=getabi&address=${this.address}&apikey=${this.apiKey}`)).data.result;
                if (!this.noCache)
                    yield fss.writeFile(file_path, _abi);
                this.abi = _abi;
                return this.abi;
            }
            catch (error) {
                throw Error(`${error} (!Verified?)`);
            }
        });
    }
    getCode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.code.length > 0)
                    return this.code;
                const file_path = `${__dirname}/../../temp/codes/${this.address}.txt`;
                if (!this.noCache) {
                    if (fs.existsSync(file_path)) {
                        const content = yield fss.readFile(file_path);
                        if (content.toString() !== '') {
                            this.code = content.toString();
                            return this.code;
                        }
                    }
                }
                const _code = (yield axios_1.default.get(`https://api.${this.domain}.com/api?module=contract&action=getsourcecode&address=${this.address}&apikey=${this.apiKey}`)).data.result[0].SourceCode;
                if (!this.noCache)
                    yield fss.writeFile(file_path, _code);
                this.code = _code;
                return this.code;
            }
            catch (error) {
                throw Error(`${error} (!Verified?)`);
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance) {
                let predata = [
                    this.getAbi(),
                    this.getCode(),
                    (new provider_1.RPCConnection(this.network)).connect(),
                    DBCache_1.DBCache.new()
                ];
                let _initials = yield Promise.all(predata);
                this.abi = _initials[0]; //await this.getAbi();
                this.code = _initials[1]; //await this.getCode();
                this._provider = _initials[2]; //await (new RPCConnection(this.network)).connect();
                this.instance = new ethers_1.ethers.Contract(this.address, this.abi, this._provider);
                this._cache = _initials[3]; //await DBCache.new();
            }
        });
    }
    getInstance() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance)
                yield this.init();
            return this.instance;
        });
    }
    getProvider() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._provider)
                yield this.init();
            return this._provider;
        });
    }
    getProperties() {
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let obj = {
                address: this.address
            };
            const _instance = yield this.getInstance();
            let predata = [];
            for (const prop of this.StaticProperties) {
                if (_instance[prop] && !prop.endsWith('|iseoa'))
                    predata.push(_instance[prop]());
            }
            let _data = yield Promise.all(predata);
            let cont = 0;
            for (let i = 0; i < this.StaticProperties.length; i++) {
                const prop = this.StaticProperties[i];
                if (_instance[prop] && !prop.endsWith('|iseoa')) {
                    obj[prop] = _data[cont].toString();
                    cont += 1;
                }
            }
            try {
                for (var _c = __asyncValues(this.StaticProperties), _d; _d = yield _c.next(), !_d.done;) {
                    const prop = _d.value;
                    if (this.isContractCheck(_instance, prop)) {
                        const _prop = prop.replace('|iseoa', '');
                        obj[_prop] += (yield this.utils.isContract(obj[_prop])) ? ' (✅!EOA)' : ' (⚠️ EOA)';
                    }
                    if (prop.includes('|timelock')) {
                        const _prop = prop.split('|')[0];
                        if (obj[_prop] && obj[_prop].includes('!EOA)')) {
                            const addr = obj[_prop].split(' ')[0];
                            const tl = new ethers_1.ethers.Contract(addr, ['function delay() public view returns (uint256)'], this._provider);
                            obj['Timelock'] = `${yield tl.delay()}`;
                        }
                    }
                    if (prop.includes("|div:")) {
                        const divisor = prop.split(':')[1];
                        const _prop = prop.split('|')[0];
                        if (this.Exists(_instance, _prop)) {
                            obj[_prop] = ethers_1.BigNumber.from(yield _instance[_prop]()).div(divisor).toString();
                        }
                        else if (obj[_prop]) {
                            obj[_prop] = ethers_1.BigNumber.from(obj[_prop]).div(divisor).toString();
                        }
                    }
                    if (prop.includes('|unit:')) {
                        const unit = prop.split(':')[1];
                        const _prop = prop.split('|')[0];
                        if (obj[_prop])
                            obj[_prop] += ` ${unit}`;
                    }
                    if (prop.endsWith("|exists")) {
                        const _prop = prop.replace('|exists', '');
                        obj[_prop] = !this.Exists(_instance, _prop) ? '✅ All Clear' : '🚨 WARNING! EXISTS!!';
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                for (var _e = __asyncValues(this.FunctionProperties), _f; _f = yield _e.next(), !_f.done;) {
                    const prop = _f.value;
                    const p = prop.indexOf('(');
                    const fun = prop.substr(0, p);
                    if (_instance[fun]) {
                        const param = prop.substr(p, prop.length - p).replace('(', '').replace(')', '').replace(' ', '');
                        if (obj[param]) {
                            obj[`${fun}(${param})`] = `${yield _instance[fun](this.utils.cleanAddress(obj[param]))}`;
                        }
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // Lo agregamos al cache.
            if (obj["symbol"]) {
                yield this._updateCacheHook({ symbol: obj["symbol"], address: this.address });
            }
            if (obj['startBlock'] || obj['startTime'])
                obj['Countdown'] = `https://${this.domain}.com/block/countdown/${obj['startBlock'] || obj['startTime']}`;
            if (obj['address'])
                obj["Code"] = `https://${this.domain}.com/address/${obj['address']}#code`;
            if (obj['Timelock'] && obj['owner'])
                obj["TL Code"] = `https://${this.domain}.com/address/${obj['owner'].split(' ')[0]}#code`;
            return obj;
        });
    }
    _updateCacheHook(token) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    ;
    isContractCheck(_instance, prop) {
        return _instance[prop.replace('|iseoa', '')] && prop.endsWith('|iseoa');
    }
    Exists(_instance, prop) {
        return _instance[prop];
    }
}
exports.Scanner = Scanner;
