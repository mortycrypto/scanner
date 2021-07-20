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
exports.TokenScanner = void 0;
const Scanner_1 = require("./Scanner");
class TokenScanner extends Scanner_1.Scanner {
    constructor(address, network) {
        super(address, network);
        this.StaticProperties = [
            'name',
            'symbol',
            'owner',
            'owner_iseoa',
            'operator',
            'operator_iseoa',
            'transferTaxRate',
            'MAXIMUM_TRANSFER_TAX_RATE',
            'maxTransferAmount',
            'maxTransferAmountRate',
            'maxTransferAmountRateMinValue',
            'burnRate',
            'swapAndLiquifyEnabled',
        ];
    }
    static new(address, network) {
        return __awaiter(this, void 0, void 0, function* () {
            return new TokenScanner(address, network);
        });
    }
    _updateCacheHook(token) {
        return __awaiter(this, void 0, void 0, function* () {
            this._cache.addToken(token);
            this._cache.save();
        });
    }
}
exports.TokenScanner = TokenScanner;
