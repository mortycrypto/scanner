import { Address } from "./Cache";
import { Network } from "./provider";
import { Scanner } from "./Scanner";

export class MCScanner extends Scanner {
    protected StaticProperties = [
        'startBlock',
        'owner',
        'owner|iseoa',
        'owner|timelock',
        'Timelock|div:3600',
        'Timelock|unit:hs',
        'migrator|exists',
        'MAXIMUM_HARVEST_INTERVAL|div:3600',
        'MAXIMUM_HARVEST_INTERVAL|unit:hs',
        'harvestTime',
        'startBlockHarvest',
        'MAXIMUM_DEPOSIT_FEE_BP|div:100',
        'MAXIMUM_DEPOSIT_FEE_BP|unit:%',
        'MAXIMUM_DEPOSIT_FEE|div:100',
        'MAXIMUM_DEPOSIT_FEE|unit:%',
        'MAXIMUM_REFERRAL_COMMISSION_RATE|div:100',
        'EMISSION_REDUCTION_PERIOD_BLOCKS',
        'EMISSION-REDUTION_RATE_PER_PERIOD',
        'devAddress',
        'devaddr',
        'feeAddress',
        'feeaddr',
        'poolLength',
        'referralCommissionRate',
        'totalAllocPoint',
    ];

    protected constructor(address: Address, network: Network) {
        super(address, network);
    }

    public static async new(address: Address, network: Network): Promise<MCScanner> {
        return new MCScanner(address, network);
    }
}