"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCConnection = exports.ApiKeys = exports.Domains = exports.Network = void 0;
const ethers_1 = require("ethers");
var Network;
(function (Network) {
    Network["BSC"] = "https://bsc-dataseed3.ninicoin.io";
    // POLYGON = "https://rpc-waultfinance-mainnet.maticvigil.com/v1/0bc1bb1691429f1eeee66b2a4b919c279d83d6b0",
    Network["POLYGON"] = "https://rpc-mainnet.matic.quiknode.pro";
    Network["FTM"] = "https://rpcapi.fantom.network";
})(Network = exports.Network || (exports.Network = {}));
var Domains;
(function (Domains) {
    Domains["BSC"] = "bscscan";
    Domains["POLYGON"] = "polygonscan";
    Domains["FTM"] = "ftmscan";
})(Domains = exports.Domains || (exports.Domains = {}));
var ApiKeys;
(function (ApiKeys) {
    ApiKeys["BSC"] = "HVUJ1ZG4KNVTDCMQQBJA711QMFKJXPWNQT";
    ApiKeys["POLYGON"] = "T2Q3CVQQK8B1G7I29I1CM1V7M767WHZCZT";
    ApiKeys["FTM"] = "";
})(ApiKeys = exports.ApiKeys || (exports.ApiKeys = {}));
class RPCConnection {
    constructor(network) {
        this.url = network;
    }
    connect() {
        return new ethers_1.ethers.providers.JsonRpcProvider(this.url);
    }
}
exports.RPCConnection = RPCConnection;
