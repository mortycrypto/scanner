"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCConnection = exports.Network = void 0;
const ethers_1 = require("ethers");
var Network;
(function (Network) {
    Network["BSC"] = "https://bsc-dataseed3.ninicoin.io";
    Network["POLYGON"] = "https://rpc-waultfinance-mainnet.maticvigil.com/v1/0bc1bb1691429f1eeee66b2a4b919c279d83d6b0";
    Network["POLYGON2"] = "https://rpc-mainnet.matic.quiknode.pro";
    Network["FTM"] = "https://rpcapi.fantom.network";
})(Network = exports.Network || (exports.Network = {}));
class RPCConnection {
    constructor(network) {
        this.url = network;
    }
    connect() {
        return new ethers_1.ethers.providers.JsonRpcProvider(this.url);
    }
}
exports.RPCConnection = RPCConnection;
