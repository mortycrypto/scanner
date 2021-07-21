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
exports.Utils = void 0;
const provider_1 = require("./provider");
class Utils {
    constructor(network) {
        this._provider = (new provider_1.RPCConnection(network)).connect();
    }
    isContract(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (address.length < 42 || !address.toString().startsWith("0x"))
                return false;
            const res = yield this._provider.getCode(address);
            return res != "0x" && res != "0x0";
        });
    }
    cleanAddress(address) {
        return address.substr(0, 42);
    }
}
exports.Utils = Utils;
