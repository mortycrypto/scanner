import { Address } from "./Cache";
import { Network } from "./provider";
import { Scanner } from "./Scanner";

export class MCScanner extends Scanner {
    protected StaticProperties = [
        'startBlock',
        'startTime',
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

    protected constructor(address: Address, network: Network, noCache?: boolean) {
        super(address, network, noCache);
    }

    public static async new(address: Address, network: Network, noCache?: boolean): Promise<MCScanner> {
        return new MCScanner(address, network, noCache);
    }

    public async getPoolsInfo(): Promise<Object> {
        if (!this.instance["poolLength"]) return {}

        const poolLength = await this.instance["poolLength"]();

        let predata = [];

        for (let i = 0; i < poolLength; i++) {
            predata.push(this.instance["poolInfo"](i))
        }

        let data: any[] = await Promise.all(predata);

        let obj = {}

        for (let i = 0; i < data.length; i++) {
            let _pool = data[i].join(" | ");
            obj[`Pool #${i}`] = _pool;
        }

        return obj;

    }
}