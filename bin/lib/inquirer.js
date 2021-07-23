"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inquirer = void 0;
const inquirer = require("inquirer");
const timelock = () => {
    const question = [
        {
            name: "timelock",
            message: "Timelock Address (Enter 0 to return to main menu): ",
            type: "input",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a value.";
                }
            },
        },
    ];
    return inquirer.prompt(question);
};
const block = (desc) => {
    const question = [
        {
            name: "block",
            message: `${desc} Block (Enter 0 to return to main menu): `,
            type: "input",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a value.";
                }
            },
        },
    ];
    return inquirer.prompt(question);
};
const token = () => {
    const question = [
        {
            name: "token",
            message: "Token Address (Enter 0 to return to main menu): ",
            type: "input",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a value.";
                }
            },
        },
    ];
    return inquirer.prompt(question);
};
const both = () => {
    const question = [
        {
            name: "both",
            message: "Both Address (MC|Token) (Enter 0 to return to main menu): ",
            type: "input",
            validate: function (value) {
                if (value.length && value.includes("|")) {
                    return true;
                }
                else {
                    return "Please enter a value.";
                }
            },
        },
    ];
    return inquirer.prompt(question);
};
const mc = () => {
    const question = [
        {
            name: "mc",
            message: "MC Address (Enter 0 to return to main menu): ",
            type: "input",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a value.";
                }
            },
        },
    ];
    return inquirer.prompt(question);
};
const network = () => {
    const question = [
        {
            name: "_network",
            message: "Select Netowork",
            type: "list",
            choices: ["BSC", "POLYGON", "FTM", "Exit"],
        },
    ];
    return inquirer.prompt(question);
};
const scanType = () => {
    const question = [
        {
            name: "ScanType",
            message: "Scan Type",
            type: "list",
            choices: ["MasterChef", "Token", "Timelock", "Both", "Change Network", "Exit"],
        },
    ];
    return inquirer.prompt(question);
};
exports.Inquirer = {
    Network: network,
    ScanType: scanType,
    Token: token,
    MC: mc,
    Both: both,
    Timelock: timelock,
    Block: block
};
