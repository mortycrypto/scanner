#! /usr/bin/env node
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
const inquirer_1 = require("./lib/inquirer");
const provider_1 = require("./lib/provider");
const TokenScanner_1 = require("./lib/TokenScanner");
const MCScanner_1 = require("./lib/MCScanner");
const TimelockScanner_1 = require("./lib/TimelockScanner");
const chalk = require("chalk");
const figlet = require("figlet");
const Table = require("cli-table");
let cache;
let network;
let selected_network;
const printError = (msg) => {
    console.log(chalk.bold.bgRed.white(msg));
};
const print = () => {
    console.clear();
    console.log(chalk.green(figlet.textSync("RUGDOC - Scanner", { horizontalLayout: "full" })));
};
const printNetwork = () => {
    let text;
    switch (selected_network) {
        case "BSC":
            network = provider_1.Network.BSC;
            text = chalk.bgYellowBright.black("BSC NETWORK" //, { horizontalLayout: "full" })
            );
            break;
        case "POLYGON":
            network = provider_1.Network.POLYGON;
            text = chalk.bgCyanBright.black("POLYGON NETWORK" //, { horizontalLayout: "full" })
            );
            break;
        case "FTM":
            network = provider_1.Network.FTM;
            text = chalk.bgBlueBright.white("FTM NETWORK" //, { horizontalLayout: "full" })
            );
            break;
    }
    console.log(text);
};
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        print();
        const { _network } = yield inquirer_1.Inquirer.Network();
        if (_network === "Exit")
            process.exit(0);
        selected_network = _network;
        printNetwork();
        const { ScanType: _scanType } = yield inquirer_1.Inquirer.ScanType();
        print();
        printNetwork();
        let data;
        switch (_scanType) {
            case "MasterChef":
                const { mc: McAddress } = yield inquirer_1.Inquirer.MC();
                console.time('mark');
                if (McAddress == "0" || !McAddress.toString().startsWith("0x")) {
                    init();
                    return;
                }
                data = Object.assign(Object.assign({}, data), yield getMcData(McAddress, data, _network));
                break;
            case "Token":
                const { token: address } = yield inquirer_1.Inquirer.Token();
                console.time('mark');
                if (address == "0" || !address.toString().startsWith("0x")) {
                    init();
                    return;
                }
                data = Object.assign(Object.assign({}, data), yield getTokenData(address, data));
                break;
            case "Timelock":
                const { timelock } = yield inquirer_1.Inquirer.Timelock();
                const { block: from } = yield inquirer_1.Inquirer.Block("From");
                const { block: to } = yield inquirer_1.Inquirer.Block("To");
                if (timelock == "0" || !timelock.toString().startsWith("0x")) {
                    init();
                    return;
                }
                console.time('mark');
                // POLYGON => "0x93707607dB30758Cc612387216E10993971A9ad2|17143918"
                const tl = yield TimelockScanner_1.TimelockScanner.new(timelock, network);
                tl.setPeriod(from, to);
                data = Object.assign(Object.assign({}, data), yield tl.getProperties());
                break;
            case "Both":
                const { both: bothAddress } = yield inquirer_1.Inquirer.Both();
                if (address == "0" || !address.toString().startsWith("0x")) {
                    init();
                    return;
                }
                data = Object.assign(Object.assign({}, data), yield getMcData(bothAddress.toString().split("|")[0], data, _network));
                data = Object.assign(Object.assign({}, data), yield getTokenData(bothAddress.toString().split("|")[1], data));
                break;
            default:
                process.exit(0);
                break;
        }
        showData(data);
        console.timeEnd('mark');
    }
    catch (error) {
        printError(error);
    }
});
init();
function showData(data) {
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
function getTokenData(address, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const ERC20 = yield TokenScanner_1.TokenScanner.new(address, network);
        data = yield ERC20.getProperties();
        return data;
    });
}
function getMcData(McAddress, data, _network) {
    return __awaiter(this, void 0, void 0, function* () {
        const MC = yield MCScanner_1.MCScanner.new(McAddress, network, true);
        return Object.assign(Object.assign({}, yield MC.getProperties()), yield MC.getPoolsInfo());
    });
}
