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
    constructor(address, network, noCache) {
        super(address, network, noCache);
        this.from = 0;
        this.to = 0;
        this.StaticProperties = [
            'delay',
            'delay|div:3600',
            'delay|unit:hs',
            'minDelay',
            'minDelay|div:3600',
            'minDelay|unit:hs',
            'admin',
            'devWalletAddress'
        ];
    }
    static new(address, network, noCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return new TimelockScanner(address, network, noCache);
        });
    }
    setPeriod(from, to) {
        console.log('from type: ', typeof from, 'this.from type: ', typeof this.from);
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
            this.to = obj.toBlock;
            console.log(`Fetching Txs from ${this.from} to ${this.to}...`);
            let predata = [];
            for (let i = this.from; i <= this.to; i++) {
                predata.push(this._provider.getBlockWithTransactions(i));
            }
            const blocks = yield Promise.all(predata);
            const txs = blocks.map(block => { return block.transactions; });
            let _txs = [];
            const t = txs.map(tx => tx.forEach(_t => {
                console.log(_t.to);
                if (_t.to === this.address)
                    _txs.push(_t);
            }));
            console.log(_txs);
            //     .filter((tx: Tx) => {
            //     console.log(tx.to, typeof tx.to, this.address, typeof this.address)
            //     return tx.to === <string>this.address
            // })
            // console.log(txs, txs.length)
            // console.log(blocks)
            return obj;
        });
    }
}
exports.TimelockScanner = TimelockScanner;
