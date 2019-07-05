import "babel-polyfill";
const AccLib = require('../libs/account');
const Acc = AccLib.Account;
const ChainLib = require('../libs/blockchain');
const API = ChainLib.Blockchain;
var constants = require("../libs/constants");

const seed = "<please input your seed phrase>";
const nodeAddress = "http://test.v.systems:9922";
var accountIndex = 0;

async function sendLeasingTx(tx) {
    const result = await API.sendLeasingTx(nodeAddress, tx);
    console.log(result);
}

// Create Account
const acc = Acc.buildFromSeedOnTestnet(seed, accountIndex);

// Create Transaction Object (send 1 VSYS)
var dataInfo = Acc.buildLeasing("AU83FKKzTYCue5ZQPweCzJ68dQE4HtdMv5U", 1.0); //please change recipient
dataInfo["senderPublicKey"] = acc.publicKey;
dataInfo["signature"] = Acc.getSignature(dataInfo, constants.LEASE_TX, acc.privateKey);
console.log("Request:");
console.log(JSON.stringify(dataInfo));

// Send Transaction
sendLeasingTx(dataInfo);