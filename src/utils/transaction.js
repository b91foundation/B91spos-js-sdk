"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var ByteProcessor_1 = require("../../libs/utils/byteProcessor");
var crypto_1 = require("../../libs/utils/crypto");
var concat_1 = require("../../libs/utils/concat");
var base58_1 = require("../../libs/utils/base58");
var remap_1 = require("../../libs/utils/remap");
var convert_1 = require("../../libs/utils/convert");

var constants = require("../../libs/constants");
var INT_TYPE = constants.INT_TYPE
var ACCOUNT_TYPE = constants.ACCOUNT_ADDR_TYPE
var CONTRACT_TYPE = constants.CONTRACT_TYPE
var AMOUNT_TYPE = constants.AMOUNT_TYPE
var SHORTTEXT_TYPE = constants.SHORTTEXT_TYPE
// Fields of the original data object
var paymentField = {
    timestamp: new ByteProcessor_1.Long('timestamp'),
    amount: new ByteProcessor_1.Long('amount'),
    fee: new ByteProcessor_1.Long('fee'),
    feeScale: new ByteProcessor_1.Short('feeScale'),
    recipient: new ByteProcessor_1.Recipient('recipient'),
    attachment: new ByteProcessor_1.Attachment('attachment')
}
var leaseField = {
    recipient: new ByteProcessor_1.Recipient('recipient'),
    amount: new ByteProcessor_1.Long('amount'),
    fee: new ByteProcessor_1.Long('fee'),
    feeScale: new ByteProcessor_1.Short('feeScale'),
    timestamp: new ByteProcessor_1.Long('timestamp')
}
var cancelLeasingField = {
    fee: new ByteProcessor_1.Long('fee'),
    feeScale: new ByteProcessor_1.Short('feeScale'),
    timestamp: new ByteProcessor_1.Long('timestamp'),
    txId: new ByteProcessor_1.Base58('transactionId')
}
var storedFields = {};



function getFields(type) {
    switch (type) {
        case constants.PAYMENT_TX:
            storedFields = paymentField;
            break;
        case constants.LEASE_TX:
            storedFields = leaseField;
            break;
        case constants.CANCEL_LEASE_TX:
            storedFields = cancelLeasingField;
            break;
    }
}

function makeByteProviders(tx_type) {
    var byteProviders = [];
    byteProviders.push(Uint8Array.from([tx_type]));
    for(let name in storedFields) {
        if (storedFields[name] instanceof ByteProcessor_1.ByteProcessor) {
            // All user data must be represented as bytes
            byteProviders.push(function (data) { return storedFields[name].process(data[name]); });
        }
        else {
            throw new Error('Invalid field is passed to the createTransactionClass function');
        }
    }
    return byteProviders;
}

var userData;
// Save all needed values from user data
function getData(transferData) {
    userData = {}
    userData = Object.keys(storedFields).reduce(function (store, key) {
        store[key] = transferData[key];
        return store;
    }, {});
}

function getBytes(transferData, tx_type) {
    var byteProviders = makeByteProviders(tx_type);
    if (transferData === void 0) { transferData = {}; }
    // Save all needed values from user data
    getData(transferData);
    var _dataHolders = byteProviders.map(function (provider) {
        if (typeof provider === 'function') {
            return provider(userData);
        }
        else {
            return provider;
        }
    });
    return concat_1.concatUint8Arrays.apply(void 0, _dataHolders);
}

function getExactBytes(fieldName) {
    if (!(fieldName in storedFields)) {
        throw new Error("There is no field '" + fieldName + "' in transfer transaction");
    }
    return storedFields[fieldName].process(userData[fieldName]);
}

function getSignature(transferData, keyPair, tx_type) {
    return crypto_1.default.buildTransactionSignature(getBytes(__assign({}, transferData), tx_type), keyPair.privateKey);
}

function transformAttachment() {
    return base58_1.default.encode(Uint8Array.from(Array.prototype.slice.call(getExactBytes('attachment'), 2)));
}

function transformRecipient() {
    return remap_1.addRecipientPrefix(userData['recipient']);
}

function castToAPISchema(data, tx_type) {
    var apiSchema = data

    if (tx_type === constants.PAYMENT_TX) {
        __assign(apiSchema, {attachment: transformAttachment()})
    }
    __assign(apiSchema, { recipient : transformRecipient() })
    return apiSchema
}
function transferContract(contractId) {
    var contractArr = base58_1.default.decode(contractId)
    var typeArr = [CONTRACT_TYPE]
    typeArr = typeArr.concat(Array.from(contractArr))
    return typeArr
}
function transferAmount(amountData) {
    var byteArr = convert_1.default.bigNumberToByteArray(amountData)
    var typeArr = new Array(1);
    typeArr[0] = AMOUNT_TYPE;
    var dataArr = typeArr.concat(byteArr);
    return dataArr
}
function transferAccount(account) {
    var accountArr = base58_1.default.decode(account)
    var typeArr = [ACCOUNT_TYPE]
    typeArr = typeArr.concat(Array.from(accountArr))
    return typeArr
}
function transferShortTxt(description) {
    var byteArr = convert_1.default.stringToByteArray(description)

    var typeArr = new Array(1);
    typeArr[0] = SHORTTEXT_TYPE ;

    var length = byteArr.length
    var lengthArr = convert_1.default.shortToByteArray(length)

    return typeArr.concat(lengthArr.concat(byteArr))
}
exports.default = {
    toBytes: function (transferData, tx_type) {
        getFields(tx_type);
        return getBytes(__assign(tx_type ? { transactionType: tx_type } : {}, transferData), tx_type);
    },
    prepareForAPI: function(transferData, keyPair, tx_type) {
        getFields(tx_type)
        var signature = getSignature(transferData, keyPair, tx_type);
        return  __assign({}, (tx_type ? {transactionType: tx_type} : {}), {senderPublicKey: keyPair.publicKey}, castToAPISchema(userData, tx_type), {signature: signature});
    },
    isValidSignature: function(data, signature, publicKey, tx_type) {
        getFields(tx_type)
        return crypto_1.default.isValidTransactionSignature(getBytes(data, tx_type), signature, publicKey)
    },
    prepareColdForAPI: function(transferData, signature, publicKey, tx_type) {
        getFields(tx_type)
        getData(transferData);
        return __assign({}, (tx_type ? {transactionType: tx_type} : {}), {senderPublicKey: publicKey}, castToAPISchema(userData, tx_type), {signature:signature})
    }
};
