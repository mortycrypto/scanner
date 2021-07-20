#! /usr/bin/env node
import { Moment } from "moment";

import { Inquirer } from "./inquirer";
import { Network } from './provider';
import { TokenScanner } from "./TokenScanner";
import { MCScanner } from "./MCScanner";
import chalk = require("chalk");
import figlet = require("figlet");
import Table = require("cli-table");

let cache;
let network: Network;
let selected_network: string;

const printError = (msg) => {
    console.log(chalk.bold.bgRed.white(msg));
};

const print = () => {
    console.clear();

    console.log(
        chalk.green(
            figlet.textSync("RUGDOC - Scanner", { horizontalLayout: "full" })
        )
    );
};

const printNetwork = () => {
    let text;

    switch (selected_network) {
        case "BSC":
            network = Network.BSC;

            text = chalk.bgYellowBright.black(
                "BSC NETWORK" //, { horizontalLayout: "full" })
            );
            break;
        case "POLYGON":
            network = Network.POLYGON2;

            text = chalk.bgCyanBright.black(
                "POLYGON NETWORK" //, { horizontalLayout: "full" })
            );
            break;
        case "FTM":
            network = Network.FTM;

            text = chalk.bgBlueBright.white(
                "FTM NETWORK" //, { horizontalLayout: "full" })
            );
            break;
    }
    console.log(text);
};

const init = async () => {

    print();

    const { _network } = await Inquirer.Network();
    if (_network === "Exit") process.exit(0);
    selected_network = _network;

    printNetwork();

    const { ScanType: _scanType } = await Inquirer.ScanType();

    print();
    printNetwork();

    let data: Object;

    switch (_scanType) {
        case "MasterChef":
            const { mc: McAddress } = await Inquirer.MC();

            if (McAddress == "0" || !McAddress.toString().startsWith("0x")) {
                init();
                return;
            }

            data = { ...data, ... await getMcData(McAddress, data, _network) };

            break;
        case "Token":
            const { token: address } = await Inquirer.Token();

            if (address == "0" || !address.toString().startsWith("0x")) {
                init();
                return;
            }

            data = { ...data, ... await getTokenData(address, data) };
            break;
        case "Both":
            const { both: bothAddress } = await Inquirer.Both();

            if (address == "0" || !address.toString().startsWith("0x")) {
                init();
                return;
            }

            data = { ...data, ... await getMcData(bothAddress.toString().split("|")[0], data, _network) };
            data = { ...data, ... await getTokenData(bothAddress.toString().split("|")[1], data) };

            break;
        default:
            process.exit(0)
            break;
    }

    if (data) {

        const table = new Table({
            head: ["Property", "Result"],
            chars: {
                top: "═",
                "top-mid": "╤",
                "top-left": "╔",
                "top-right": "╗",
                bottom: "═",
                "bottom-mid": "╧",
                "bottom-left": "╚",
                "bottom-right": "╝",
                left: "║",
                "left-mid": "╟",
                mid: "─",
                "mid-mid": "┼",
                right: "║",
                "right-mid": "╢",
                middle: "│",
            },
        });

        for (const key in data) {
            table.push([key, data[key]]);
        }

        console.log(table.toString());

    }

}

init();

async function getTokenData(address: any, data: Object): Promise<Object> {
    const ERC20 = await TokenScanner.new(address, network);
    data = await ERC20.getProperties();
    return data;
}

async function getMcData(McAddress: string, data: Object, _network: string): Promise<Object> {
    const MC = await MCScanner.new(McAddress, network);
    data = await MC.getProperties();

    const domains = {
        BSC: "bscscan",
        POLYGON: "polygonscan",
        FTM: "ftmscan",
    };

    if (data['startBlock'])
        data['Countdown'] = `https://${domains[_network]}.com/block/countdown/${data['startBlock']}`;

    if (data['address']) data["Code"] = `https://${domains[_network]}.com/address/${data['address']}#code`

    return data;
}
