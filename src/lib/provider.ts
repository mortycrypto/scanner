import { ethers } from "ethers";

export enum Network {
    BSC = "https://bsc-dataseed3.ninicoin.io",
    // POLYGON = "https://rpc-waultfinance-mainnet.maticvigil.com/v1/0bc1bb1691429f1eeee66b2a4b919c279d83d6b0",
    POLYGON = "https://rpc-mainnet.matic.quiknode.pro",
    FTM = "https://rpcapi.fantom.network",
}

export enum Domains {
    BSC = "bscscan",
    POLYGON = "polygonscan",
    FTM = "ftmscan",
}

export enum ApiKeys {
    BSC = "HVUJ1ZG4KNVTDCMQQBJA711QMFKJXPWNQT",
    POLYGON = "T2Q3CVQQK8B1G7I29I1CM1V7M767WHZCZT",
    FTM = "",
}

export class RPCConnection {
    private url: string;

    constructor(network: Network) {
        this.url = network;
    }

    public connect(): ethers.providers.JsonRpcProvider {
        return new ethers.providers.JsonRpcProvider(this.url);
    }
}