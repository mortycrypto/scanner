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
exports.DBCache = void 0;
const Cache_1 = require("./Cache");
class DBCache extends Cache_1.Cache {
    static new() {
        const _super = Object.create(null, {
            new: { get: () => super.new }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.new.call(this, `${__dirname}/../../db.json`);
        });
    }
}
exports.DBCache = DBCache;
