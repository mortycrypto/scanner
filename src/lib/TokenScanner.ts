import { Address, Token } from "./Cache";
import { Network } from "./provider";
import { Scanner } from "./Scanner";

export class TokenScanner extends Scanner {
    protected StaticProperties = [
        'name',
        'symbol',
        'owner',
        'owner|iseoa',
        'operator',
        'operator|iseoa',
        'governance',
        'governance|iseoa',
        'transferTaxRate',
        'MAXIMUM_TRANSFER_TAX_RATE',
        'maxTransferAmount',
        'maxTransferAmountRate',
        'maxTransferAmountRateMinValue',
        'minAmountToLiquify',
        'minAmountToLiquifyRate',
        'reducedTransferTaxRate',
        'reducedtransferTaxRate',
        'burnRate',
        'swapAndLiquifyEnabled',
        'totalSupply',
        'totalTokensLocked',
        'totaltokensLocked'
    ];

    protected FunctionProperties = [
        'minters(owner)',
        'minters(operator)',
        'minters(governance)',
        'isExcludedFromAntiWhale(owner)',
        'isExcludedFromAntiWhale(operator)',
        'isExcludedFromAntiWhale(governance)',
        'isExcludedFromFees(owner)',
        'isExcludedFromFees(operator)',
        'isExcludedFromFees(governance)',
        'isReducedFromFees(owner)',
        'isReducedFromFees(operator)',
        'isReducedFromFees(governance)',
    ];

    protected constructor(address: Address, network: Network, noCache?: boolean) {
        super(address, network, noCache);
    }

    public static async new(address: Address, network: Network, noCache?: boolean): Promise<TokenScanner> {
        return new TokenScanner(address, network, noCache);
    }

    protected async _updateCacheHook(token: Token): Promise<void> {
        this._cache.addToken(token);
        this._cache.save();
    }
}