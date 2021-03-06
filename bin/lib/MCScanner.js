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
exports.MCScanner = void 0;
const Scanner_1 = require("./Scanner");
class MCScanner extends Scanner_1.Scanner {
    constructor(address, network, noCache) {
        super(address, network, noCache);
        this.StaticProperties = [
            'startBlock',
            'startTime',
            'owner',
            'owner|iseoa',
            'owner|timelock',
            'Timelock|div:3600',
            'Timelock|unit:hs',
            'migrator|exists',
            'MAXIMUM_HARVEST_INTERVAL|div:3600',
            'MAXIMUM_HARVEST_INTERVAL|unit:hs',
            'harvestTime',
            'startBlockHarvest',
            'MAXIMUM_DEPOSIT_FEE_BP|div:100',
            'MAXIMUM_DEPOSIT_FEE_BP|unit:%',
            'MAXIMUM_DEPOSIT_FEE|div:100',
            'MAXIMUM_DEPOSIT_FEE|unit:%',
            'MAXIMUM_REFERRAL_COMMISSION_RATE|div:100',
            'EMISSION_REDUCTION_PERIOD_BLOCKS',
            'EMISSION-REDUTION_RATE_PER_PERIOD',
            'devAddress',
            'devaddr',
            'feeAddress',
            'feeaddr',
            'poolLength',
            'referralCommissionRate',
            'totalAllocPoint',
        ];
    }
    static new(address, network, noCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return new MCScanner(address, network, noCache);
        });
    }
    getPoolsInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance["poolLength"])
                return {};
            const poolLength = yield this.instance["poolLength"]();
            let predata = [];
            for (let i = 0; i < poolLength; i++) {
                predata.push(this.instance["poolInfo"](i));
            }
            let data = yield Promise.all(predata);
            let obj = {};
            for (let i = 0; i < data.length; i++) {
                let _pool = data[i].join(" | ");
                obj[`Pool #${i}`] = _pool;
            }
            return obj;
        });
    }
}
exports.MCScanner = MCScanner;
