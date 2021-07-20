import { RPCConnection, Network } from "./provider";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Address } from "./Cache";

export class Utils {

    private _provider: JsonRpcProvider;

    constructor(network: Network) {
        this._provider = (new RPCConnection(network)).connect();
    }

    async isContract(address: string): Promise<Boolean> {

        if (address.length < 42 || !address.toString().startsWith("0x"))
            return false;

        const res = await this._provider.getCode(address);

        return res != "0x" && res != "0x0";
    }

    cleanAddress(address: Address): Address {
        return address.substr(0, 42);
    }
}