#! /usr/bin/env node
const ethers = require("ethers");
const moment = require("moment");
const axios = require("axios");
const chalk = require("chalk");
const figlet = require("figlet");
const Table = require("cli-table");
const inquirer = require("../lib/inquirer");

const fs = require("fs");
const fss = fs.promises;

let network = "";
let provider;
let cache;

const read_file = async (name_file) => {
  const content = await fss.readFile(name_file);
  return JSON.parse(content.toString());
};

const networks = {
  BSC: "https://bsc-dataseed3.ninicoin.io",
  POLYGON:
    "https://rpc-waultfinance-mainnet.maticvigil.com/v1/0bc1bb1691429f1eeee66b2a4b919c279d83d6b0",
};

const weths = {
  BSC: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  POLYGON: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
};

// const _provider = new ethers.providers.JsonRpcProvider(networks[network]);

const print = () => {
  console.clear();

  console.log(
    chalk.green(
      figlet.textSync("RUGDOC - Scanner", { horizontalLayout: "full" })
    )
  );
};

const printNetwork = ({ _network }) => {
  if (_network === "Exit") {
    process.exit(0);
  }

  let text;

  network = _network;

  switch (_network) {
    case "BSC":
      text = chalk.bgYellowBright.black(
        "BSC NETWORK" //, { horizontalLayout: "full" })
      );
      break;
    case "POLYGON":
      text = chalk.bgMagentaBright.black(
        "POLYGON NETWORK" //, { horizontalLayout: "full" })
      );
      break;
  }
  console.log(text);
};

const getAbi = async (address) => {
  const file_path = `${process.cwd()}/temp/${address}.json`;

  if (fs.existsSync(file_path)) {
    return read_file(file_path);
  }

  console.log("leyendo");
  const _abi = (
    await axios.get(
      `https://api.${
        network == "BSC" ? "bscscan" : "polygonscan"
      }.com/api?module=contract&action=getabi&address=${address}`
    )
  ).data.result;

  await fss.writeFile(file_path, _abi);

  return _abi;
};

const _extractTokenInfo = async (address) => {
  let info = {};

  if (!(await isContract(address))) {
    throw new Error(
      "wut? Invalid Token Contract. (MasterChef maybe? Wrong network?)"
    );
  }

  const abi = await getAbi(address);

  const pair_cached = cache["pairs"][address];
  const pair = pair_cached || new ethers.Contract(address, abi, provider);

  if (pair.token0) {
    info["isLp"] = true;

    const _token0Address = pair_cached
      ? pair_cached.token0
      : await pair.token0();
    const _token1Address = pair_cached
      ? pair_cached.token1
      : await pair.token1();

    const token0cached = cache["tokens"][_token0Address];
    const token1cached = cache["tokens"][_token1Address];

    const token0 =
      token0cached ||
      new ethers.Contract(
        _token0Address,
        ["function symbol() view returns (string)"],
        provider
      );

    const token1 =
      token1cached ||
      new ethers.Contract(
        _token1Address,
        ["function symbol() view returns (string)"],
        provider
      );

    const _token0Symbol = token0cached ? token0.symbol : await token0.symbol();
    const _token1Symbol = token1cached ? token1.symbol : await token1.symbol();

    const _symbol = `${_token0Symbol}-${_token1Symbol}`;

    cache["pairs"][address] = {
      symbol: _symbol,
      token0: _token0Address,
      token1: _token1Address,
    };
    cache["tokens"][_token0Address] = { symbol: _token0Symbol };
    cache["tokens"][_token1Address] = { symbol: _token1Symbol };
  } else {
    const _symbol = `${await pair.symbol()}`;
    cache["tokens"][address] = { symbol: _symbol };
    info["isLp"] = false;
    info["transferTaxRate"] = pair.transferTaxRate
      ? (await pair.transferTaxRate()).toString()
      : "Sin transferTaxRate";
    info["transferTax"] = pair.transferTax
      ? (await pair.transferTax()).toString()
      : "Sin transferTax";
    info["owner"] = await pair.owner();
    info["operator"] = pair.operator ? await pair.operator() : "Sin Operador";
    info["burnAddress"] = pair.BURN_ADDRESS
      ? await pair.BURN_ADDRESS()
      : "Sin BURN ADDRESS";
    info["burnRate"] = pair.burnRate
      ? (await pair.burnRate()).toString()
      : "Sin burnRate";
    if (
      (await isContract(info["operator"])) &&
      (await isContract(info["owner"]))
    ) {
      if (info["operator"] == info["owner"]) {
        info["operator is "] = "MC";
      } else if (info["operator"] == info["burnAddress"]) {
        info["operator is "] = "Burn Address";
      } else {
        info["operator is "] = "Other SC";
      }
    } else if (info["operator"].toString().startsWith("0x")) {
      info["operator is "] = "An EOA";
    }
    info["maxTransferAmountRate"] = pair.maxTransferAmountRate
      ? (await pair.maxTransferAmountRate()).toString()
      : "Sin maxTransferAmountRate";
    info["MaximumTaxRate"] = pair.MAXIMUM_TAX_RATE
      ? ethers.utils.formatEther(await pair.MAXIMUM_TAX_RATE())
      : "Sin MAXIMUM_TAX_RATE";
    info["MaximumTransferTaxRate"] = pair.MAXIMUM_TRANSFER_TAX_RATE
      ? (await pair.MAXIMUM_TRANSFER_TAX_RATE()).toString()
      : "Sin MAXIMUM_TRANSFER_TAX_RATE";
    info["MaximumDepositFee"] = pair.MAXIMUM_DEPOSIT_RATE
      ? (await pair.MAXIMUM_DEPOSIT_RATE()).toString()
      : "Sin MAXIMUM_DEPOSIT_RATE";
    info["MaximumHarvestInterval"] = pair.MAXIMUM_HARVEST_INTERVAL
      ? (await pair.MAXIMUM_HARVEST_INTERVAL()).toString()
      : "Sin MAXIMUM_HARVEST_INTERVAL";
    info["MaximumReferralComissionRate"] = pair.MAXIMUM_REFERRAL_COMISSION_RATE
      ? (await pair.MAXIMUM_REFERRAL_COMISSION_RATE()).toString()
      : "Sin MAXIMUM_REFERRAL_COMISSION_RATE";
  }

  info["address"] = address;

  updateCache();

  return info;
};

const processToken = async () => {
  try {
    const { token: address } = await inquirer.Token();

    if (address == "0" || !address.toString().startsWith("0x")) {
      init();
      return;
    }

    const data = await _extractTokenInfo(address);

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

    processToken();
  } catch (error) {
    printError(error);
    processToken();
  }
};

const printError = (msg) => {
  console.log(chalk.bold.bgRed.white(msg));
};

const isContract = async (address) => {
  if (address.length < 42 || !address.toString().startsWith("0x")) return false;

  const res = await provider.getCode(address);
  return res != "0x" && res != "0x0";
};

const updateCache = async () => {
  await fss.writeFile(process.cwd() + "/db.json", JSON.stringify(cache));
};

const _extractMCInfo = async (address) => {
  let info = {};

  if (!(await isContract(address))) {
    throw new Error("wut? Invalid MC Contract. (Token maybe? Wrong network?)");
  }

  const abi = await getAbi(address);

  const mc = new ethers.Contract(address, _abi, provider);

  const _startBlock = (await mc.startBlock()).toString();
  const _owner = await mc.owner();
  const _isAContract = await isContract(_owner);

  info["Start Block"] = _startBlock;

  info["Onwer Address"] = _owner;
  info["Onwer"] = _isAContract ? "IS NOT A EOA" : "IS AN EOA";

  let delay = 0;

  // Check for timelock implementation.
  if (_isAContract) {
    const _timelock = new ethers.Contract(
      _owner,
      ["function delay() public view returns (uint256)"],
      provider
    );

    delay = (await _timelock.delay()).toString();

    info["Timelock Delay"] = `~ ${Math.floor(delay / 3600)} Hs`;
  }

  const _poolLength = await mc.poolLength();
  info["Pool length"] = _poolLength.toString();

  // // Buscamos la info de los pooles.
  // let erc20 =  new ethers.Contract(
  //     weths[network],
  //     [
  //         "function name() view returns (string)",
  //         "function symbol() external view returns (string memory)",
  //     ],
  //     provider
  // );

  for (let i = 0; i < _poolLength; i++) {
    let _poolInfo = mc.poolInfo ? await mc.poolInfo(i) : mc.getPoolInfo(i);
    const erc20_cached =
      cache["pairs"][_poolInfo[0]] || cache["tokens"][_poolInfo[0]];
    const _pool =
      erc20_cached ||
      new ethers.Contract(
        _poolInfo[0],
        [
          "function name() view returns (string)",
          "function symbol() external view returns (string memory)",
        ],
        provider
      );
    // let _pool = await erc20.attach(_poolInfo[0]);
    const name = erc20_cached ? _pool.name : await _pool.name();

    if (
      name.toString().endsWith("LPs") ||
      name.toString().endsWith("LP") ||
      name.toString().startsWith("Uniswap")
    ) {
      let _pair = new ethers.Contract(
        _pool.address,
        [
          "function token0() view returns (address)",
          "function token1() view returns (address)",
        ],
        provider
      );

      const token0 = await _pair.token0();
      const token1 = await _pair.token1();

      const _token0 = await erc20.attach(token0);
      const _token1 = await erc20.attach(token1);

      const _pairName0 = _token0.symbol ? await _token0.symbol() : "";
      const _pairName1 = _token1.symbol ? await _token1.symbol() : "";

      _newMcInfo.push([
        `#${i} ${_pairName0}-${_pairName1}`,
        _pool.address,
        `allocPoint: ${_poolInfo[1].toString()}
                        lastRewardBlock: ${_poolInfo[2].toString()}
                        accTokenPerShare: ${_poolInfo[3].toString()}
                        `,
      ]);
    } else {
      const symbol = _pool.symbol ? await _pool.symbol() : "";
      _newMcInfo.push([
        `Pool # ${i} ${symbol}`,
        _poolInfo[0],
        `allocPoint: ${_poolInfo[1].toString()}
                        lastRewardBlock: ${_poolInfo[2].toString()}
                        accTokenPerShare: ${_poolInfo[3].toString()}
                        ${
                          _poolInfo.length > 4
                            ? " DepositFee:" + _poolInfo[4].toString()
                            : ""
                        }`,
      ]);
    }
  }
};

const processMC = async () => {
  try {
    const { mc: address } = await inquirer.MC();

    if (address == "0" || !address.toString().startsWith("0x")) {
      init();
      return;
    }

    const data = await _extractMCInfo(address);

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

    processMC();
  } catch (error) {
    printError(error);
    processMC();
  }
};

const init = async () => {
  print();

  const _network = await inquirer.Network();

  printNetwork(_network);

  const _scanType = await inquirer.ScanType();

  print();
  printNetwork(_network);

  provider = new ethers.providers.JsonRpcProvider(networks[network]);

  if (_scanType["scanType"] !== "Exit") {
    cache = await read_file(process.cwd() + "/db.json");
  }

  switch (_scanType["ScanType"]) {
    case "Token":
      processToken();
      break;
    case "MasterChef":
      processMC();
      break;
    case "Change Network":
      init();
      return;
      break;
    case "Exit":
      console.clear();
      return process.exit(0);
      break;
  }
};

init();
