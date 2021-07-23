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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelockScanner = void 0;
const Scanner_1 = require("./Scanner");
class TimelockScanner extends Scanner_1.Scanner {
    constructor(address, network) {
        super(address, network);
        this.StaticProperties = [
            'delay',
            'delay|div:3600',
            'delay|unit:hs',
            'admin'
        ];
    }
    static new(address, network) {
        return __awaiter(this, void 0, void 0, function* () {
            return new TimelockScanner(address, network);
        });
    }
    setPeriod(from, to) {
        this.from = from;
        this.to = to;
    }
    getCurrentBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._provider.getBlockNumber();
        });
    }
    getProperties() {
        const _super = Object.create(null, {
            getProperties: { get: () => super.getProperties }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.from < 800000)
                throw new Error(`From too back {FROM: ${this.from}}`);
            if (this.to < this.from && this.to > 0)
                throw new Error(`BAD {FROM: ${this.from} TO: ${this.to}}`);
            const data = yield _super.getProperties.call(this);
            let obj = Object.assign({ address: this.address, fromBlock: this.from, toBlock: this.to > 0 ? this.to : yield this.getCurrentBlock() }, data);
            return obj;
        });
    }
}
exports.TimelockScanner = TimelockScanner;
