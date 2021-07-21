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
exports.Cache = void 0;
const fs = require("fs");
const fss = fs.promises;
class Cache {
    constructor(path) {
        this.path = path;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.file = yield this.read_file(this.path);
        });
    }
    static new(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = new Cache(path);
            r.init();
            return r;
        });
    }
    read_file(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield fss.readFile(path);
            return JSON.parse(content.toString());
        });
    }
    addToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.file["tokens"][token.address] = { symbol: token.symbol };
        });
    }
    getToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.file["tokens"][token] || {};
        });
    }
    addPair(pair) {
        return __awaiter(this, void 0, void 0, function* () {
            this.file["pairs"][pair.address] = {
                symbol: pair.symbol,
                token0: pair.token0,
                token1: pair.token1,
            };
        });
    }
    getPair(pair) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.file["pairs"][pair] || { symbol: '', token0: '', token1: '' };
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fss.writeFile(`${this.path}`, JSON.stringify(this.file));
        });
    }
}
exports.Cache = Cache;
