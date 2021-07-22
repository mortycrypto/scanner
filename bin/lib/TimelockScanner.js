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
exports.TimelockScanner = void 0;
const fs = require("fs");
const fss = fs.promises;
const ethers_1 = require("ethers");
const axios_1 = require("axios");
const provider_1 = require("./provider");
const utils_1 = require("./utils");
const DBCache_1 = require("./DBCache");
class TimelockScanner {
    constructor(address, from, to, network) {
        this.abi = '';
        this.code = '';
        this.StaticProperties = [
            'delay',
            'delay|div:3600',
            'delay|unit:hs',
            'admin'
        ];
        this.FunctionProperties = [];
        this.address = address;
        this.network = network;
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
    static new(address, from, to, network) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = new TimelockScanner(address, from, to, network);
            yield r.init();
            return r;
        });
    }
    getAbi() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.abi.length > 0)
                    return this.abi;
                // const file_path = `${process.cwd()}/temp/${this.address}.json`;
                const file_path = `${__dirname}/../../temp/${this.address}.json`;
                if (fs.existsSync(file_path)) {
                    const content = yield fss.readFile(file_path);
                    if (content.toString().startsWith('[')) {
                        this.abi = JSON.parse(content.toString());
                        return this.abi;
                    }
                }
                const _abi = (yield axios_1.default.get(`https://api.${this.domain}.com/api?module=contract&action=getabi&address=${this.address}&apikey=${this.apiKey}`)).data.result;
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
                if (fs.existsSync(file_path)) {
                    const content = yield fss.readFile(file_path);
                    if (content.toString() !== '') {
                        this.code = content.toString();
                        return this.code;
                    }
                }
                const _code = (yield axios_1.default.get(`https://api.${this.domain}.com/api?module=contract&action=getsourcecode&address=${this.address}&apikey=${this.apiKey}`)).data.result[0].SourceCode;
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
                this.abi = yield this.getAbi();
                this.code = yield this.getCode();
                this._provider = yield (new provider_1.RPCConnection(this.network)).connect();
                this.instance = new ethers_1.ethers.Contract(this.address, this.abi, this._provider);
                this._cache = yield DBCache_1.DBCache.new();
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
    getCurrentBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._provider.getBlockNumber();
        });
    }
    getProperties() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.from < 800000)
                throw new Error(`From too back {FROM: ${this.from}}`);
            if (this.to < this.from && this.to > 0)
                throw new Error(`BAD {FROM: ${this.from} TO: ${this.to}}`);
            let obj = {
                address: this.address,
                fromBlock: this.from,
                toBlock: this.to > 0 ? this.to : yield this.getCurrentBlock()
            };
            const _instance = yield this.getInstance();
            try {
                for (var _b = __asyncValues(this.StaticProperties), _c; _c = yield _b.next(), !_c.done;) {
                    const prop = _c.value;
                    if (_instance[prop] && !prop.endsWith('|iseoa'))
                        obj[prop] = (yield _instance[prop]()).toString();
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
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
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
exports.TimelockScanner = TimelockScanner;
