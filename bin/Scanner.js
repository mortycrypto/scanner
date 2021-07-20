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
    constructor(address, network) {
        this.abi = '';
        this.StaticProperties = [];
        this.FunctionProperties = [];
        this.address = address;
        this.network = network;
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
            if (this.abi.length > 0)
                return this.abi;
            // const file_path = `${process.cwd()}/temp/${this.address}.json`;
            const file_path = `${__dirname}/../temp/${this.address}.json`;
            if (fs.existsSync(file_path)) {
                const content = yield fss.readFile(file_path);
                this.abi = JSON.parse(content.toString());
            }
            const _abi = (yield axios_1.default.get(`https://api.${this.network === provider_1.Network.BSC ? "bscscan" : "polygonscan"}.com/api?module=contract&action=getabi&address=${this.address}&apikey=${this.network === provider_1.Network.BSC ? 'HVUJ1ZG4KNVTDCMQQBJA711QMFKJXPWNQT' : 'T2Q3CVQQK8B1G7I29I1CM1V7M767WHZCZT'}`)).data.result;
            yield fss.writeFile(file_path, _abi);
            this.abi = _abi;
            return this.abi;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance) {
                this.abi = yield this.getAbi();
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
    getProperties() {
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let obj = {
                address: this.address
            };
            const _instance = yield this.getInstance();
            try {
                for (var _c = __asyncValues(this.StaticProperties), _d; _d = yield _c.next(), !_d.done;) {
                    const prop = _d.value;
                    if (_instance[prop] && !prop.endsWith('|iseoa'))
                        obj[prop] = (yield _instance[prop]()).toString();
                    if (this.TimelockCheck(_instance, prop)) {
                        const _prop = prop.replace('|iseoa', '');
                        obj[_prop] += (yield this.utils.isContract(obj[_prop])) ? ' (✅!EOA)' : ' (⚠️ EOA)';
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
                    if (prop.includes("|div:")) {
                        const divisor = prop.split(':')[1];
                        const _prop = prop.split('|')[0];
                        if (this.Exists(_instance, _prop))
                            obj[_prop] = ethers_1.BigNumber.from(yield _instance[_prop]()).div(divisor).toString();
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
            return obj;
        });
    }
    _updateCacheHook(token) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    ;
    TimelockCheck(_instance, prop) {
        return _instance[prop.replace('|iseoa', '')] && prop.endsWith('|iseoa');
    }
    Exists(_instance, prop) {
        return _instance[prop];
    }
}
exports.Scanner = Scanner;
