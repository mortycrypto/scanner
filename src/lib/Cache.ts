import * as fs from "fs";
const fss = fs.promises;

export type Address = string;

export interface Token {
    address: Address;
    symbol: string;
}

export interface Pair extends Token {
    token0: Address;
    token1: Address;
}

export class Cache {

    private file: JSON;
    readonly path: string;

    protected constructor(path: string) {
        this.path = path;
    }

    private async init(): Promise<void> {
        this.file = await this.read_file(this.path);
    }

    protected static async new(path: string): Promise<Cache> {
        const r = new Cache(path);
        r.init()
        return r;
    }

    private async read_file(path: string): Promise<JSON> {
        const content = await fss.readFile(path);
        return JSON.parse(content.toString());
    }

    public async addToken(token: Token): Promise<void> {
        this.file["tokens"][token.address] = { symbol: token.symbol };
    }

    public async getToken(token: Address): Promise<Token> {
        return this.file["tokens"][token] || {};
    }

    public async addPair(pair: Pair): Promise<void> {
        this.file["pairs"][pair.address] = {
            symbol: pair.symbol,
            token0: pair.token0,
            token1: pair.token1,
        };
    }

    public async getPair(pair: Address): Promise<Pair> {
        return this.file["pairs"][pair] || { symbol: '', token0: '', token1: '' };
    }

    public async save(): Promise<void> {
        await fss.writeFile(`${this.path}`, JSON.stringify(this.file));
    }
}