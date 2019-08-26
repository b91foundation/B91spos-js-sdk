// import "babel-polyfill";
const base58_1 = require("base-58");
const convert_1 = require("../libs/utils/convert");
const Account = require('../libs/account');
const Blockchain = require('../libs/blockchain');
var constants = require("../libs/constants");

/*======= Change the below before run ==========*/
const SEED = "123";
const ACCOUNT_INDEX = 0;
const RECIPIENT_ADDR = "bLBViKY7dswNw2PfVKWW5ZEjdB736gJ5Cso";
/*================ Change end ==================*/

const nodeAddress = "https://xtestwallet.b91.com/api/";
const networkByte = constants.TESTNET_BYTE;

async function sendPaymentTx(chain, tx) {
    const result = await chain.sendPaymentTx(tx);
    console.log(result);
}

// Create Account
const acc = new Account(networkByte);
acc.buildFromSeed(SEED, ACCOUNT_INDEX);

var attachmentText = "Test Payment";
var attachmentBytes = Uint8Array.from(convert_1.default.stringToByteArray(attachmentText));
var attachmentBase58 = base58_1.encode(attachmentBytes);

// Create Transaction Object (send 1 B91)
var dataInfo = acc.buildPayment(RECIPIENT_ADDR, 1.2, attachmentBase58);
dataInfo["signature"] = acc.getSignature(dataInfo, constants.PAYMENT_TX);
console.log("Request:");
console.log(JSON.stringify(dataInfo));

// Send Transaction
const chain = new Blockchain(networkByte, nodeAddress);
sendPaymentTx(chain, dataInfo);
