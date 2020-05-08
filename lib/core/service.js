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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var PopDB_1 = require("../db/PopDB");
var tables_1 = require("./tables");
var utils_1 = require("jsuperzk/dist/utils/utils");
var axios_1 = require("axios");
var bignumber_js_1 = require("bignumber.js");
var jsuperzk = require("jsuperzk/dist/index");
var superzk = require("jsuperzk/dist/protocol/account");
var tx_1 = require("jsuperzk/dist/tx/tx");
var db = new Map();
var assets = new Map();
var isSyncing = new Map();
var latestSyncTime = new Date().getTime();
var latestBlock = 0;
var syncIntervalId = null;
var syncTime = 10 * 1000;
var rpc = null;
var rpcId = 0;
var operations = {
    "init": init,
    "healthyCheck": healthyCheck,
    "initAccount": initAccount,
    "clearData": clearData,
    "findUtxos": findUtxos,
    "balanceOf": balancesOf,
    "ticketsOf": ticketsOf,
    "getTxList": getTxList,
    "getTxDetail": getTxDetail,
    "getPKrIndex": getPKrIndex,
    "commitTx": commitTx,
    "getSeroPrice": getSeroPrice,
};
self.addEventListener('message', function (e) {
    if (e.data && e.data.method) {
        if (operations[e.data.method]) {
            operations[e.data.method](e.data);
        }
    }
});
function getSeroPrice(message) {
    var t = message.data;
    axios_1.default.get("https://data.gateio.co/api2/1/ticker/" + t).then(function (response) {
        if (response && response.data) {
            var price = response.data;
            message.data = price;
            _postMessage(message);
        }
    }).catch(function (err) {
    });
}
function commitTx(message) {
    var tx = message.data;
    // console.log("commitTx >>> ", message, tx)
    try {
        _commitTx(tx).then(function (hash) {
            // console.log("_commitTx hash:", hash)
            message.data = hash;
            _postMessage(message);
        }).catch(function (err) {
            // console.log("_commitTx err:", err)
            message.error = err;
            _postMessage(message);
        });
    }
    catch (e) {
        message.error = e.message;
        _postMessage(message);
    }
}
function _genPrePramas(tx, acInfo) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var From = tx.From, To = tx.To, Value = tx.Value, Cy = tx.Cy, Data = tx.Data, Gas = tx.Gas, GasPrice = tx.GasPrice, FeeCy = tx.FeeCy;
                    if (!Cy)
                        Cy = "SERO";
                    if (!FeeCy)
                        FeeCy = "SERO";
                    if (!Gas) {
                        Gas = "0x" + new bignumber_js_1.default("4700000").toString(16);
                    }
                    if (!GasPrice) {
                        GasPrice = "0x" + new bignumber_js_1.default("1000000000").toString(16);
                    }
                    var tkn = {
                        Currency: utils_1.default.cyToHex(Cy),
                        Value: utils_1.default.toBN(Value).toString(10)
                    };
                    var fee = {
                        Currency: utils_1.default.cyToHex(FeeCy),
                        Value: new bignumber_js_1.default(GasPrice, 16).multipliedBy(new bignumber_js_1.default(Gas, 16)).toString(10)
                    };
                    var asset = {
                        Tkn: tkn,
                    };
                    var reception = {
                        Addr: To,
                        Asset: asset
                    };
                    var tknReceptions = [reception];
                    var tktReceptions = [];
                    if (tx.Tkts.size > 0) {
                        var tkts = tx.Tkts;
                        var dbEntries = tkts.entries();
                        var dbRes = dbEntries.next();
                        while (!dbRes.done) {
                            var Tkt = {
                                Category: utils_1.default.cyToHex(dbRes.value[0]),
                                Value: dbRes.value[1]
                            };
                            var assetTkt = {
                                Tkt: Tkt
                            };
                            tktReceptions.push({
                                Addr: To,
                                Asset: assetTkt
                            });
                            dbRes = dbEntries.next();
                        }
                    }
                    var receptions = tknReceptions.concat(tktReceptions);
                    console.log(receptions);
                    // const fee = new BigNumber(tx.Gas).multipliedBy(tx.GasPrice).toString(10)
                    var preTxParam = {
                        From: From,
                        RefundTo: acInfo.PKr,
                        Fee: fee,
                        GasPrice: utils_1.default.toBN(GasPrice).toString(10),
                        Cmds: null,
                        Receptions: receptions,
                    };
                    // contract
                    if (Data) {
                        preTxParam.Receptions = [];
                        preTxParam.RefundTo = acInfo.MainPKr;
                        preTxParam.Cmds = {
                            Contract: {
                                Data: Data,
                                To: utils_1.default.bs58ToHex(To) + "0000000000000000000000000000000000000000000000000000000000000000",
                                Asset: {
                                    Tkn: { Currency: utils_1.default.cyToHex(Cy), Value: utils_1.default.toBN(Value).toString() },
                                }
                            }
                        };
                        if (tx.Tkts.size > 0) {
                            if (tx.Tkts.size > 1) {
                                reject("Not support more tickets to contract!");
                            }
                            else {
                                var key = tx.Tkts.keys()[0];
                                var value = tx.Tkts.get(key);
                                preTxParam.Cmds.Contract.Asset.Tkt = {
                                    Category: utils_1.default.cyToHex(key),
                                    Value: value
                                };
                            }
                        }
                    }
                    resolve(preTxParam);
                })];
        });
    });
}
function _storePending(tk, signRet, tx, _db) {
    return __awaiter(this, void 0, void 0, function () {
        var txInfo, asset, txBase, txCurrency;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    txInfo = {
                        TK: tk,
                        TxHash: signRet.Hash,
                        Num_TxHash: "99999999999_" + signRet.Hash,
                        BlockHash: "",
                        From: tx.From,
                        Gas: new bignumber_js_1.default(tx.Gas, 16).toNumber(),
                        GasPrice: new bignumber_js_1.default(tx.GasPrice, 16).toNumber(),
                        GasUsed: new bignumber_js_1.default(tx.Gas, 16).toNumber(),
                        Num: 99999999999,
                        Time: Math.floor(new Date().getTime() / 1000),
                        To: tx.To,
                        State: "pending"
                    };
                    return [4 /*yield*/, _db.update(tables_1.tables.tx.name, txInfo)];
                case 1:
                    _a.sent();
                    asset = {
                        Tkn: {
                            Currency: utils_1.default.cyToHex(tx.Cy),
                            Value: new bignumber_js_1.default(tx.Value).toString(10),
                        }
                    };
                    txBase = {
                        TxHash: signRet.Hash,
                        TxType: tables_1.TxType.out,
                        Root: signRet.Hash,
                        TxHash_Root_TxType: [signRet.Hash, signRet.Hash, tables_1.TxType.out].join("_"),
                        Num_TxHash: [txInfo.Num, signRet.Hash].join("_"),
                        Asset: asset
                    };
                    return [4 /*yield*/, _db.update(tables_1.tables.txBase.name, txBase)];
                case 2:
                    _a.sent();
                    txCurrency = {
                        Num: txInfo.Num,
                        TxHash: txInfo.TxHash,
                        Currency: tx.Cy,
                        id: [txInfo.Num, txInfo.TxHash, tx.Cy].join("_"),
                    };
                    return [4 /*yield*/, db.get(tk).update(tables_1.tables.txCurrency.name, txCurrency)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function _commitTx(tx) {
    return __awaiter(this, void 0, void 0, function () {
        var tk, _db_1, acInfo_1, preTxParam, rest, signRet_1, resp_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tk = tx.From;
                    if (!(!db || !db.get(tk))) return [3 /*break*/, 1];
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            reject("Account is invalid! ");
                        })];
                case 1:
                    _db_1 = db.get(tk);
                    return [4 /*yield*/, _db_1.selectId(tables_1.tables.syncInfo.name, 1)];
                case 2:
                    acInfo_1 = _a.sent();
                    return [4 /*yield*/, _genPrePramas(tx, acInfo_1)];
                case 3:
                    preTxParam = _a.sent();
                    return [4 /*yield*/, tx_1.genTxParam(preTxParam, new TxGenerator(), new TxState())];
                case 4:
                    rest = _a.sent();
                    if (rest.Ins && rest.Ins.length > 1000) {
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                reject("Exceeded the maximum number of UTXOs");
                            })];
                    }
                    rest.Z = false;
                    signRet_1 = tx_1.signTx(tx.SK, rest);
                    return [4 /*yield*/, jsonRpcReq('sero_commitTx', [signRet_1])];
                case 5:
                    resp_1 = _a.sent();
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            // @ts-ignore
                            if (!resp_1.data.error) {
                                var txPending = tx;
                                txPending.From = acInfo_1.PKr;
                                if (tx.Data) {
                                    txPending.From = acInfo_1.MainPKr;
                                }
                                _storePending(tk, signRet_1, txPending, _db_1).then().catch(function (e) {
                                });
                                resolve(signRet_1.Hash);
                            }
                            else {
                                // @ts-ignore
                                reject(resp_1.data.error.message);
                            }
                        })];
            }
        });
    });
}
var TxGenerator = /** @class */ (function () {
    function TxGenerator() {
    }
    TxGenerator.prototype.findRoots = function (accountKey, currency, remain) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoAll;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.get(accountKey).select(tables_1.tables.utxo.name, { TK: accountKey })];
                    case 1:
                        utxoAll = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                var utxos = new Array();
                                for (var _i = 0, utxoAll_1 = utxoAll; _i < utxoAll_1.length; _i++) {
                                    var utxo_1 = utxoAll_1[_i];
                                    if (utxo_1.Asset && utxo_1.Asset.Tkn) {
                                        var tkn = utxo_1.Asset.Tkn;
                                        if (tkn) {
                                            if (utils_1.hexToCy(tkn.Currency) === currency) {
                                                // const now = new Date().getTime();
                                                // const latest = utxo["timestamp"];
                                                // if (latest && now - latest < 4 * 15 * 1000) {
                                                //     continue
                                                // }
                                                //set utxo has used
                                                // utxo["timestamp"] = now;
                                                db.get(accountKey).update(tables_1.tables.utxo.name, utxo_1);
                                                utxos.push(utxo_1);
                                                var amount = utils_1.default.toBN(tkn.Value);
                                                remain = remain.sub(amount);
                                                if (remain.isNeg() || remain.isZero()) {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                resolve({ utxos: utxos, remain: remain });
                            })];
                }
            });
        });
    };
    TxGenerator.prototype.findRootsByTicket = function (accountKey, tickets) {
        return __awaiter(this, void 0, void 0, function () {
            var utxos, dbEntries, dbRes, value, rests, utxoTkts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utxos = new Array();
                        if (!(tickets.size > 0)) return [3 /*break*/, 5];
                        dbEntries = tickets.entries();
                        dbRes = dbEntries.next();
                        _a.label = 1;
                    case 1:
                        if (!!dbRes.done) return [3 /*break*/, 5];
                        value = dbRes.value[0];
                        return [4 /*yield*/, db.get(accountKey).select(tables_1.tables.tickets.name, { Value: value })];
                    case 2:
                        rests = _a.sent();
                        if (!(rests && rests.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, db.get(accountKey).select(tables_1.tables.utxoTkt.name, { Root: rests[0].Root })];
                    case 3:
                        utxoTkts = _a.sent();
                        utxos.push(utxoTkts[0]);
                        _a.label = 4;
                    case 4:
                        dbRes = dbEntries.next();
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, new Promise(function (resolve) {
                            resolve({ utxos: utxos, remain: new Map() });
                        })];
                }
            });
        });
    };
    TxGenerator.prototype.getRoot = function (root) {
        return;
    };
    TxGenerator.prototype.defaultRefundTo = function (accountKey) {
        return '';
    };
    return TxGenerator;
}());
var TxState = /** @class */ (function () {
    function TxState() {
    }
    TxState.prototype.getAnchor = function (roots) {
        return __awaiter(this, void 0, void 0, function () {
            var resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, jsonRpcReq('sero_getAnchor', [roots])];
                    case 1:
                        resp = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                if (utils_1.default.isNotNull(resp.error)) {
                                    resolve(null);
                                }
                                else {
                                    resolve(resp.data.result);
                                }
                            })];
                }
            });
        });
    };
    TxState.prototype.getPkgById = function (id) {
        return;
    };
    TxState.prototype.getSeroGasLimit = function (to, tfee, gasPrice) {
        return utils_1.default.toBN(tfee.Value).div(gasPrice).toNumber();
    };
    return TxState;
}());
function getPKrIndex(message) {
    var tk = message.data;
    if (!db || !db.get(tk)) {
        return;
    }
    db.get(tk).selectId(tables_1.tables.syncInfo.name, 1).then(function (info) {
        info.TK = "";
        // let version = 1;
        // let isNew = isNewVersion(utils.toBuffer(tk));
        // if (isNew) {
        //     version = 2
        // }
        // info.PKr = jsuperzk.createPkrHash(tk, info.PkrIndex, version)
        message.data = info;
        _postMessage(message);
    }).catch(function (err) {
        message.error = err;
        _postMessage(message);
    });
}
// === message
function healthyCheck(message) {
    var health = false;
    if (!latestSyncTime) {
    }
    else {
        var now = new Date().getTime();
        health = (now - latestSyncTime) < 60 * 1000;
    }
    var tk = message.data;
    db.get(tk).selectId(tables_1.tables.syncInfo.name, 1).then(function (info) {
        message.data = { health: health, latestSyncTime: latestSyncTime, isSyncing: isSyncing.get(tk), latestBlock: info.CurrentBlock, pkrIndex: info.PkrIndex };
        _postMessage(message);
    }).catch(function (error) {
        message.data = { health: health, latestSyncTime: latestSyncTime, isSyncing: isSyncing.get(tk), latestBlock: 0, pkrIndex: 1 };
        _postMessage(message);
    });
}
function getTxList(message) {
    _getTxList(message).then(function (rest) {
        message.data = rest;
        _postMessage(message);
    }).catch(function (err) {
        message.error = err;
        _postMessage(message);
    });
}
function _genTxInfo(txBases, txInfo, cy) {
    return new Promise(function (resolve, reject) {
        if (txBases) {
            var TknMap = new Map();
            var TktMap = new Map();
            // @ts-ignore
            for (var _i = 0, txBases_1 = txBases; _i < txBases_1.length; _i++) {
                var txBase = txBases_1[_i];
                if (txBase.Asset && txBase.Asset.Tkn) {
                    var tkn = txBase.Asset.Tkn;
                    if (tkn) {
                        if (!cy || cy && utils_1.hexToCy(tkn.Currency) === cy) {
                            var amount = new bignumber_js_1.default(tkn.Value);
                            if (txBase.TxType === tables_1.TxType.out) {
                                amount = amount.multipliedBy(-1);
                            }
                            if (TknMap.has(utils_1.hexToCy(tkn.Currency))) {
                                var amountStr = amount.plus(new bignumber_js_1.default(TknMap.get(utils_1.hexToCy(tkn.Currency)))).toString(10);
                                TknMap.set(utils_1.hexToCy(tkn.Currency), amountStr);
                            }
                            else {
                                TknMap.set(utils_1.hexToCy(tkn.Currency), amount.toString(10));
                            }
                        }
                    }
                }
                if (txBase.Asset && txBase.Asset.Tkt) {
                    var key = utils_1.hexToCy(txBase.Asset.Tkt.Category);
                    if (TktMap.has(txBase.Asset.Tkt)) {
                        var val = TktMap.get(key);
                        // @ts-ignore
                        TktMap.set(key, val.push(txBase.Asset.Tkt.Value));
                    }
                    else {
                        TktMap.set(key, [txBase.Asset.Tkt.Value]);
                    }
                }
            }
            var TxDetail = txInfo;
            TxDetail["Tkn"] = TknMap;
            TxDetail["Tkt"] = TktMap;
            if (superzk.isMyPKr(TxDetail.TK, TxDetail.From)) {
                TxDetail["Type"] = "out";
            }
            else {
                TxDetail["Type"] = "in";
            }
            TxDetail.TK = "";
            TxDetail.Fee = new bignumber_js_1.default(txInfo.GasUsed).multipliedBy(new bignumber_js_1.default(txInfo.GasPrice)).dividedBy(new bignumber_js_1.default(10).pow(18)).toString(10);
            resolve(TxDetail);
        }
        else {
            reject(new Error("txBases not found!"));
        }
    });
}
function _getTxList(message) {
    return __awaiter(this, void 0, void 0, function () {
        var data, tk, count, rest, txList, i, txCurrency, txInfos, txInfo, txBases, txDetail;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = message.data;
                    tk = data.tk;
                    if (!db || !db.get(tk)) {
                        return [2 /*return*/];
                    }
                    count = 10;
                    if (data.count) {
                        count = data.count;
                    }
                    return [4 /*yield*/, db.get(tk).some(tables_1.tables.txCurrency.name, { Currency: data.cy }, count)];
                case 1:
                    rest = _a.sent();
                    txList = [];
                    if (!(rest && rest.length > 0)) return [3 /*break*/, 7];
                    i = rest.length - 1;
                    _a.label = 2;
                case 2:
                    if (!(i >= 0)) return [3 /*break*/, 7];
                    txCurrency = rest[i];
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.tx.name, { "Num_TxHash": [txCurrency.Num, txCurrency.TxHash].join("_") })];
                case 3:
                    txInfos = _a.sent();
                    if (!(txInfos && txInfos.length > 0)) return [3 /*break*/, 6];
                    txInfo = txInfos[0];
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.txBase.name, { "Num_TxHash": [txCurrency.Num, txInfo.TxHash].join("_") })];
                case 4:
                    txBases = _a.sent();
                    return [4 /*yield*/, _genTxInfo(txBases, txInfo, data.cy)];
                case 5:
                    txDetail = _a.sent();
                    if (txDetail.Tkn && txDetail.Tkn.size > 0 || txDetail.Tkt && txDetail.Tkt.size > 0) {
                        txList.push(txDetail);
                    }
                    _a.label = 6;
                case 6:
                    i--;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, new Promise(function (resolve) {
                        function compare(o1, o2) {
                            return o1.Time - o2.Time;
                        }
                        txList.sort(compare);
                        resolve(txList);
                    })];
            }
        });
    });
}
function getTxDetail(message) {
    if (!db) {
        return;
    }
    var data = message.data;
    _getTxBase(data.tk, data.hash).then(function (rest) {
        message.data = rest;
        _postMessage(message);
    }).catch(function (err) {
        message.error = err.message;
        _postMessage(message);
    });
}
function _getTxBase(tk, hash) {
    return __awaiter(this, void 0, void 0, function () {
        var txInfo, txBases;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.get(tk).select(tables_1.tables.tx.name, { TxHash: hash })];
                case 1:
                    txInfo = _a.sent();
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.txBase.name, { TxHash: hash })];
                case 2:
                    txBases = _a.sent();
                    return [4 /*yield*/, _genTxInfo(txBases, txInfo[0])];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function initAccount(message) {
    var tk = message.data;
    if (tk) {
        if (db && !db.get(tk)) {
            var version = 1;
            var isNew = utils_1.isNewVersion(utils_1.default.toBuffer(tk));
            if (isNew) {
                version = 2;
            }
            var mainPKr_1 = jsuperzk.createPkrHash(tk, 1, version);
            tables_1.dbConfig.databaseName = "popup" + "_" + tk;
            var newDb_1 = new PopDB_1.PopDB(tables_1.dbConfig);
            db.set(tk, newDb_1);
            newDb_1.select(tables_1.tables.syncInfo.name, { TK: tk }).then(function (rest) {
                // console.log("initAccount rest: ", rest)
                // @ts-ignore
                if (!rest || rest.length === 0) {
                    var data = {
                        TK: tk,
                        PkrIndex: 1,
                        CurrentBlock: 0,
                        LastCombineBlock: 0,
                        UseHashPKr: false,
                        MainPKr: mainPKr_1,
                        PKr: mainPKr_1
                    };
                    newDb_1.insert(tables_1.tables.syncInfo.name, data).then(function (rest) {
                        message.data = "success";
                    }).catch(function (err) {
                        console.log(err);
                        message.error = err.message;
                    });
                }
                _postMessage(message);
            }).catch(function (error) {
                var data = {
                    TK: tk,
                    PkrIndex: 1,
                    CurrentBlock: 0,
                    LastCombineBlock: 0,
                    UseHashPKr: false,
                    MainPKr: mainPKr_1,
                    PKr: mainPKr_1
                };
                newDb_1.insert(tables_1.tables.syncInfo.name, data).then(function (rest) {
                    message.data = "success";
                }).catch(function (err) {
                    console.log(err);
                    message.error = err.message;
                });
                _postMessage(message);
            });
        }
    }
}
function clearData(message) {
    _clearData(message.data).then(function (data) {
        console.log("data>>> ", data);
        isSyncing.clear();
        message.data = "Success";
        _postMessage(message);
    }).catch(function (e) {
        console.log("data e>>> ", e);
        isSyncing.clear();
        message.error = e;
        _postMessage(message);
    });
}
function _clearData(tk) {
    return __awaiter(this, void 0, void 0, function () {
        function _clear(_db) {
            return __awaiter(this, void 0, void 0, function () {
                var info, _isSyncing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, _db.selectId(tables_1.tables.syncInfo.name, 1)];
                        case 1:
                            info = _a.sent();
                            _isSyncing = isSyncing.get(info.TK);
                            if (!(_isSyncing === true)) return [3 /*break*/, 3];
                            return [4 /*yield*/, new Promise(function (resolve, reject) { reject("Data synchronization ..."); })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 15];
                        case 3:
                            isSyncing.set(tk, true);
                            assets.delete(tk);
                            info.CurrentBlock = 0;
                            info.PKr = info.MainPKr;
                            info.PkrIndex = 1;
                            info.UseHashPKr = false;
                            return [4 /*yield*/, _db.update(tables_1.tables.syncInfo.name, info)];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.utxo.name)];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.txBase.name)];
                        case 6:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.assets.name)];
                        case 7:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.assetUtxo.name)];
                        case 8:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.tx.name)];
                        case 9:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.nils.name)];
                        case 10:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.txCurrency.name)];
                        case 11:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.utxoTkt.name)];
                        case 12:
                            _a.sent();
                            return [4 /*yield*/, _db.clearTable(tables_1.tables.tickets.name)];
                        case 13:
                            _a.sent();
                            return [4 /*yield*/, new Promise(function (resolve) { resolve("Clear Data Success !"); })];
                        case 14:
                            _a.sent();
                            _a.label = 15;
                        case 15: return [2 /*return*/];
                    }
                });
            });
        }
        var dbEntries, dbRes, _db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!tk) return [3 /*break*/, 2];
                    return [4 /*yield*/, _clear(db.get(tk))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    dbEntries = db.entries();
                    dbRes = dbEntries.next();
                    _a.label = 3;
                case 3:
                    if (!!dbRes.done) return [3 /*break*/, 5];
                    _db = dbRes.value[1];
                    return [4 /*yield*/, _clear(_db)];
                case 4:
                    _a.sent();
                    dbRes = dbEntries.next();
                    return [3 /*break*/, 3];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function findUtxos(tk, cy, amount) {
}
function balancesOf(message) {
    var tk = message.data;
    if (!db) {
        return;
    }
    if (isSyncing.get(tk) === true && assets.get(tk)) { //get cache assets
        message.data = assets.get(tk);
        _postMessage(message);
    }
    else {
        if (db.get(tk)) {
            _getBalance();
        }
        else {
            setTimeout(function () {
                _getBalance();
            }, 500);
        }
    }
    function _getBalance() {
        db.get(tk).selectAll(tables_1.tables.assets.name).then(function (rest) {
            var TknRet = new Map();
            if (rest && rest.length > 0) {
                rest.forEach(function (value) {
                    TknRet.set(value.Currency, value.Amount);
                });
            }
            message.data = TknRet;
            assets.set(tk, TknRet);
            _postMessage(message);
        }).catch(function (err) {
            message.error = err.message;
            _postMessage(message);
        });
    }
}
function ticketsOf(message) {
    var tk = message.data;
    db.get(tk).selectAll(tables_1.tables.tickets.name).then(function (rests) {
        var utxoMap = new Map();
        for (var _i = 0, rests_1 = rests; _i < rests_1.length; _i++) {
            var data = rests_1[_i];
            var key = utils_1.hexToCy(data.Category);
            var value = data.Value;
            if (utxoMap.has(key)) {
                var o = utxoMap.get(key);
                o.push(value);
                utxoMap.set(key, o);
            }
            else {
                utxoMap.set(key, [value]);
            }
        }
        message.data = utxoMap;
        _postMessage(message);
    }).catch(function (e) {
        message.error = typeof e == 'string' ? e : e.message;
        _postMessage(message);
    });
}
function init(message) {
    var initParam = message.data;
    // console.log("init sync component ! ")
    if (initParam.rpc && initParam.syncTime) {
        rpc = initParam.rpc;
        syncTime = initParam.syncTime;
        // console.log("rpc: ", rpc, "syncTime: ", syncTime)
    }
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    _startSync();
    message.data = "success";
    _postMessage(message);
}
function _postMessage(message) {
    // console.log("popservice response >>>>>>", JSON.stringify(message));
    // @ts-ignore
    self.postMessage(message);
}
function _startSync() {
    _inner();
    syncIntervalId = setInterval(function () {
        // console.log("======= start sync data,isSyncing=",isSyncing);
        _inner();
    }, syncTime);
    function _inner() {
        fetchHandler().then(function (flag) {
        }).catch(function (error) {
            var syncEntries = isSyncing.entries();
            var syncRes = syncEntries.next();
            while (!syncRes.done) {
                if (syncRes.value[1]) {
                    console.log("======= recover syncing state >>> ", syncRes.value[0], false);
                    isSyncing.set(syncRes.value[0], false);
                }
                syncRes = syncEntries.next();
            }
            console.log("======= fetchHandler error>>> ", error);
        });
        _setLatestSyncTime();
    }
}
function fetchHandler() {
    return __awaiter(this, void 0, void 0, function () {
        var syncEntries, syncRes, dbEntries, dbRes, _db, info;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    syncEntries = isSyncing.entries();
                    syncRes = syncEntries.next();
                    while (!syncRes.done) {
                        if (syncRes.value[1]) {
                            return [2 /*return*/, new Promise(function (resolve) { resolve(); })];
                        }
                        syncRes = syncEntries.next();
                    }
                    dbEntries = db.entries();
                    dbRes = dbEntries.next();
                    _a.label = 1;
                case 1:
                    if (!!dbRes.done) return [3 /*break*/, 4];
                    _db = dbRes.value[1];
                    return [4 /*yield*/, _db.selectId(tables_1.tables.syncInfo.name, 1)];
                case 2:
                    info = _a.sent();
                    if (isSyncing.get(info.TK) === true) {
                        return [3 /*break*/, 1];
                    }
                    isSyncing.set(info.TK, true);
                    return [4 /*yield*/, _fetchOuts(_db, info)];
                case 3:
                    _a.sent();
                    isSyncing.set(info.TK, false);
                    dbRes = dbEntries.next();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, new Promise(function (resolve) {
                        resolve(isSyncing);
                    })];
            }
        });
    });
}
function changeAssets(assets, utxo, db, txType) {
    return __awaiter(this, void 0, void 0, function () {
        var rootType, assetsUtxo, asset, amount, aUtxo, aUtxo, amount, asset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!utxo.Asset.Tkn) return [3 /*break*/, 10];
                    rootType = [utxo.Root, txType].join("_");
                    return [4 /*yield*/, db.select(tables_1.tables.assetUtxo.name, { RootType: rootType })];
                case 1:
                    assetsUtxo = _a.sent();
                    if (!(assets && assets.length > 0)) return [3 /*break*/, 6];
                    if (!(assetsUtxo && assetsUtxo.length > 0)) return [3 /*break*/, 2];
                    console.log("asset utxo has set!!", utxo.Root);
                    return [3 /*break*/, 5];
                case 2:
                    asset = assets[0];
                    amount = new bignumber_js_1.default(utxo.Asset.Tkn.Value);
                    if (txType === tables_1.TxType.out) {
                        amount = amount.multipliedBy(-1);
                    }
                    asset.Amount = new bignumber_js_1.default(asset.Amount).plus(amount).toString(10);
                    aUtxo = utxo;
                    aUtxo["RootType"] = rootType;
                    return [4 /*yield*/, db.update(tables_1.tables.assetUtxo.name, aUtxo)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db.update(tables_1.tables.assets.name, asset)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [3 /*break*/, 10];
                case 6:
                    if (!(assetsUtxo && assetsUtxo.length > 0)) return [3 /*break*/, 7];
                    console.log("asset utxo has set!!!", utxo.Root);
                    return [3 /*break*/, 10];
                case 7:
                    aUtxo = utxo;
                    aUtxo["RootType"] = rootType;
                    return [4 /*yield*/, db.update(tables_1.tables.assetUtxo.name, aUtxo)];
                case 8:
                    _a.sent();
                    if (!utxo.Asset.Tkn) return [3 /*break*/, 10];
                    amount = utxo.Asset.Tkn.Value;
                    if (txType === tables_1.TxType.out) {
                        amount = new bignumber_js_1.default(utxo.Asset.Tkn.Value).multipliedBy(-1).toString(10);
                    }
                    asset = {
                        Currency: utils_1.default.hexToCy(utxo.Asset.Tkn.Currency),
                        Amount: amount
                    };
                    return [4 /*yield*/, db.insert(tables_1.tables.assets.name, asset)];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    });
}
function _deletePending(db, txData) {
    db.select(tables_1.tables.tx.name, { "Num_TxHash": ["99999999999", txData.TxHash].join("_") }).then(function (pendingTxs) {
        if (pendingTxs && pendingTxs.length > 0) {
            db.delete(tables_1.tables.txBase.name, { "TxHash_Root_TxType": [txData.TxHash, txData.TxHash, tables_1.TxType.out].join("_") }).then(function (res) {
            }).catch(function (err) {
                console.log(err.message);
            });
            db.delete(tables_1.tables.tx.name, { "Num_TxHash": ["99999999999", txData.TxHash].join("_") }).then(function (res) {
            }).catch(function (err) {
                console.log(err.message);
            });
            db.delete(tables_1.tables.txCurrency.name, { "TxHash": txData.TxHash }).then(function (res) {
            }).catch(function (err) {
                console.log(err.message);
            });
        }
    }).catch(function (err) {
        console.log(err.message);
    });
}
function _fetchOuts(db, info) {
    return __awaiter(this, void 0, void 0, function () {
        var syncInfo, start, end, pkrIndex, rtn, version, isNew;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!db) {
                        return [2 /*return*/, new Promise(function (resolve, reject) { reject("POPDB not init"); })];
                    }
                    syncInfo = info;
                    start = info.CurrentBlock;
                    end = null;
                    pkrIndex = info.PkrIndex;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetchAndIndex(info.TK, pkrIndex, info.UseHashPKr, start, end)];
                case 2:
                    rtn = _a.sent();
                    return [4 /*yield*/, _indexUtxos(rtn, info.TK, db)];
                case 3:
                    _a.sent();
                    if (rtn.useHashPKr) {
                        syncInfo.UseHashPKr = true;
                    }
                    if (!(rtn.again === true)) return [3 /*break*/, 5];
                    syncInfo.PkrIndex = syncInfo.PkrIndex + 1;
                    version = 1;
                    isNew = utils_1.isNewVersion(utils_1.default.toBuffer(info.TK));
                    if (isNew) {
                        version = 2;
                    }
                    syncInfo.PKr = jsuperzk.createPkrHash(info.TK, syncInfo.PkrIndex, version);
                    end = rtn.lastBlockNumber;
                    pkrIndex = syncInfo.PkrIndex;
                    syncInfo.CurrentBlock = rtn.lastBlockNumber;
                    return [4 /*yield*/, db.update(tables_1.tables.syncInfo.name, syncInfo)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    latestBlock = rtn.lastBlockNumber;
                    syncInfo.CurrentBlock = rtn.lastBlockNumber;
                    return [3 /*break*/, 7];
                case 6: return [3 /*break*/, 1];
                case 7: return [4 /*yield*/, db.update(tables_1.tables.syncInfo.name, syncInfo)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, _checkNil(info.TK)
                        // await _repair(db)
                    ];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function _indexUtxos(rtn, tk, db) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, utxo_2, _b, _c, nil, nils, currency, assets_1, data, _d, _e, txData;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!(rtn.utxos && rtn.utxos.length > 0)) return [3 /*break*/, 13];
                    _i = 0, _a = rtn.utxos;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 13];
                    utxo_2 = _a[_i];
                    utxo_2["TK"] = tk;
                    if (!utxo_2.Nils) return [3 /*break*/, 5];
                    _b = 0, _c = utxo_2.Nils;
                    _f.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 5];
                    nil = _c[_b];
                    nils = { Nil: nil, Root: utxo_2.Root };
                    return [4 /*yield*/, db.update(tables_1.tables.nils.name, nils)];
                case 3:
                    _f.sent();
                    _f.label = 4;
                case 4:
                    _b++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!utxo_2.Asset.Tkn) return [3 /*break*/, 9];
                    return [4 /*yield*/, db.update(tables_1.tables.utxo.name, utxo_2)];
                case 6:
                    _f.sent();
                    currency = utils_1.default.hexToCy(utxo_2.Asset.Tkn.Currency);
                    return [4 /*yield*/, db.select(tables_1.tables.assets.name, { Currency: currency })];
                case 7:
                    assets_1 = _f.sent();
                    return [4 /*yield*/, changeAssets(assets_1, utxo_2, db, tables_1.TxType.in)];
                case 8:
                    _f.sent();
                    _f.label = 9;
                case 9:
                    if (!utxo_2.Asset.Tkt) return [3 /*break*/, 12];
                    data = utxo_2;
                    return [4 /*yield*/, db.update(tables_1.tables.utxoTkt.name, data)];
                case 10:
                    _f.sent();
                    console.log("indexTickets>> ", { Root: data.Root, Value: utxo_2.Asset.Tkt.Value, Category: utxo_2.Asset.Tkt.Category });
                    return [4 /*yield*/, db.update(tables_1.tables.tickets.name, { Root: data.Root, Value: utxo_2.Asset.Tkt.Value, Category: utxo_2.Asset.Tkt.Category })];
                case 11:
                    _f.sent();
                    _f.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 1];
                case 13:
                    if (!(rtn.txInfos && rtn.txInfos.length > 0)) return [3 /*break*/, 17];
                    _d = 0, _e = rtn.txInfos;
                    _f.label = 14;
                case 14:
                    if (!(_d < _e.length)) return [3 /*break*/, 17];
                    txData = _e[_d];
                    txData.TK = tk;
                    txData.Num_TxHash = txData.Num + "_" + txData.TxHash;
                    _deletePending(db, txData);
                    return [4 /*yield*/, db.update(tables_1.tables.tx.name, txData)];
                case 15:
                    _f.sent();
                    _f.label = 16;
                case 16:
                    _d++;
                    return [3 /*break*/, 14];
                case 17: return [2 /*return*/];
            }
        });
    });
}
function fetchAndIndex(tk, pkrIndex, useHashPkr, start, end) {
    return __awaiter(this, void 0, void 0, function () {
        var pkrRest, param, currentPkr_1, response, data, rest, hasResWithHashPkr, hasResWithOldPkr, blocks, outs, txInfos, Utxos, _i, blocks_1, block, blockDatas, _a, blockDatas_1, blockData, txInfo, utxos, txBase, cy, txCurrency, _b, Utxos_1, utxo_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pkrRest = genPKrs(tk, pkrIndex, useHashPkr);
                    param = [];
                    if (end && end > 0) {
                        currentPkr_1 = [];
                        pkrRest.CurrentPKrMap.forEach((function (value, key) {
                            currentPkr_1.push(key);
                        }));
                        param = [currentPkr_1, start, end];
                    }
                    else {
                        param = [pkrRest.PKrs, start, null];
                    }
                    sendLog("(" + pkrRest.pkrMain + ")Fetch", JSON.stringify({ pkrIndex: pkrIndex, start: start }));
                    return [4 /*yield*/, jsonRpcReq("light_getOutsByPKr", param)];
                case 1:
                    response = _c.sent();
                    data = response.data;
                    rest = {
                        utxos: null,
                        again: false,
                        useHashPKr: false,
                        remoteNum: 0,
                        nextNum: 0,
                        lastBlockNumber: 0,
                        txInfos: null
                    };
                    hasResWithHashPkr = false;
                    hasResWithOldPkr = false;
                    if (!data.result) return [3 /*break*/, 10];
                    blocks = data.result.BlockOuts;
                    outs = [];
                    txInfos = [];
                    Utxos = [];
                    if (!(blocks && blocks.length > 0)) return [3 /*break*/, 9];
                    _i = 0, blocks_1 = blocks;
                    _c.label = 2;
                case 2:
                    if (!(_i < blocks_1.length)) return [3 /*break*/, 9];
                    block = blocks_1[_i];
                    blockDatas = block.Data;
                    _a = 0, blockDatas_1 = blockDatas;
                    _c.label = 3;
                case 3:
                    if (!(_a < blockDatas_1.length)) return [3 /*break*/, 8];
                    blockData = blockDatas_1[_a];
                    outs.push(blockData.Out);
                    txInfo = blockData.TxInfo;
                    utxos = jsuperzk.decOut(tk, [blockData.Out]);
                    txInfo.Root = blockData.Out.Root;
                    txBase = {
                        TxHash: txInfo.TxHash,
                        TxType: tables_1.TxType.in,
                        Root: blockData.Out.Root,
                        Asset: utxos[0].Asset,
                        TxHash_Root_TxType: [txInfo.TxHash, txInfo.Root, tables_1.TxType.in].join("_"),
                        Num_TxHash: [txInfo.Num, txInfo.TxHash].join("_"),
                    };
                    txInfos.push(txInfo);
                    if (!(utxos[0].Asset && utxos[0].Asset.Tkn)) return [3 /*break*/, 5];
                    cy = utils_1.default.hexToCy(utxos[0].Asset.Tkn.Currency);
                    txCurrency = {
                        Num: txInfo.Num,
                        TxHash: txInfo.TxHash,
                        Currency: cy,
                        id: [txInfo.Num, txInfo.TxHash, cy].join("_"),
                    };
                    return [4 /*yield*/, db.get(tk).update(tables_1.tables.txCurrency.name, txCurrency)];
                case 4:
                    _c.sent();
                    sendLog("(" + pkrRest.pkrMain + ") AddTx", JSON.stringify({ Block: txCurrency.Num, TxHash: txCurrency.TxHash }));
                    _c.label = 5;
                case 5: return [4 /*yield*/, db.get(tk).update(tables_1.tables.txBase.name, txBase)];
                case 6:
                    _c.sent();
                    Utxos = Utxos.concat(utxos);
                    _c.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 3];
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9:
                    for (_b = 0, Utxos_1 = Utxos; _b < Utxos_1.length; _b++) {
                        utxo_3 = Utxos_1[_b];
                        if (pkrRest.CurrentPKrMap.has(utxo_3.Pkr)) {
                            rest.again = true;
                        }
                        if (!useHashPkr) {
                            if (pkrRest.PKrTypeMap.get(utxo_3.Pkr) === PKrType.New) {
                                hasResWithHashPkr = true;
                            }
                            else if (pkrRest.PKrTypeMap.get(utxo_3.Pkr) === PKrType.Old) {
                                hasResWithOldPkr = true;
                            }
                        }
                    }
                    rest.txInfos = txInfos;
                    rest.utxos = Utxos;
                    rest.lastBlockNumber = data.result.CurrentNum;
                    rest.remoteNum = data.result.CurrentNum;
                    if (!useHashPkr && hasResWithHashPkr && !hasResWithOldPkr) {
                        rest.useHashPKr = true;
                    }
                    console.log("rest>>>", rest);
                    return [2 /*return*/, new Promise(function (resolve) {
                            resolve(rest);
                        })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function sendLog(operator, content) {
    var msg = {};
    msg.type = "ServiceLog";
    msg.operator = operator;
    msg.content = content;
    _postMessage(msg);
}
function jsonRpcReq(_method, params) {
    return new Promise(function (resolve, reject) {
        if (!rpc) {
            reject(new Error("rpc host not set!"));
        }
        var data = {
            id: rpcId++,
            jsonrpc: "2.0",
            method: _method,
            params: params
        };
        return axios_1.default.post(rpc, data).then(function (response) {
            resolve(response);
        }).catch(function (e) {
            reject(e);
        });
    });
}
function genPKrs(tk, index, useHashPkr) {
    var pkrs = new Array();
    var pkrTypeMap = new Map();
    var currentPKrMap = new Map();
    var version = 1;
    var isNew = utils_1.isNewVersion(utils_1.default.toBuffer(tk));
    if (isNew) {
        version = 2;
    }
    var pkrNum = 1;
    if (index > 5) {
        pkrNum = index - 5;
    }
    var pkrMain = jsuperzk.createPkrHash(tk, 1, version);
    for (var i = index; i >= pkrNum; i--) {
        var pkr = jsuperzk.createPkrHash(tk, i, version);
        pkrTypeMap.set(pkr, PKrType.New);
        pkrs.push(pkr);
        if (i === index) {
            currentPKrMap.set(pkr, true);
        }
    }
    if (pkrs.indexOf(pkrMain) === -1) {
        pkrs.push(pkrMain);
    }
    if (!isNew) {
        var pkrMainOld = jsuperzk.createOldPkrHash(tk, 1, version);
        if (!useHashPkr) {
            for (var i = index; i >= pkrNum; i--) {
                var pkrOld = jsuperzk.createOldPkrHash(tk, i, version);
                pkrTypeMap.set(pkrOld, PKrType.Old);
                pkrs.push(pkrOld);
                if (i === index) {
                    currentPKrMap.set(pkrOld, true);
                }
            }
        }
        if (pkrs.indexOf(pkrMainOld) === -1) {
            pkrs.push(pkrMainOld);
        }
    }
    return { PKrTypeMap: pkrTypeMap, CurrentPKrMap: currentPKrMap, PKrs: pkrs, pkrMain: ellipsisHash(pkrMain) };
}
function ellipsisHash(value) {
    try {
        return value.substring(0, 5) + "..." + value.substring(value.length - 5);
    }
    catch (e) {
        return value;
    }
}
var PKrType;
(function (PKrType) {
    PKrType[PKrType["New"] = 0] = "New";
    PKrType[PKrType["Old"] = 1] = "Old";
})(PKrType || (PKrType = {}));
function _checkNil(tk) {
    return __awaiter(this, void 0, void 0, function () {
        function _innerCheckNil(nilArr) {
            return __awaiter(this, void 0, void 0, function () {
                var resp, datas, _i, datas_1, data, txInfo, nil, nilDatas, _a, nilDatas_1, nilData, root, utxos, utxo_4, txBase, currency, assets_2, cy, txCurrency;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, jsonRpcReq('light_checkNil', [nilArr])
                            // @ts-ignore
                        ];
                        case 1:
                            resp = _b.sent();
                            if (!(resp && resp.data && resp.data.result)) return [3 /*break*/, 19];
                            datas = resp.data.result;
                            if (!datas) return [3 /*break*/, 19];
                            _i = 0, datas_1 = datas;
                            _b.label = 2;
                        case 2:
                            if (!(_i < datas_1.length)) return [3 /*break*/, 19];
                            data = datas_1[_i];
                            txInfo = data.TxInfo;
                            nil = { Nil: data.Nil };
                            txInfo.TK = tk;
                            txInfo.Num_TxHash = txInfo.Num + "_" + txInfo.TxHash;
                            _deletePending(db.get(tk), txInfo);
                            return [4 /*yield*/, db.get(tk).select(tables_1.tables.nils.name, nil)];
                        case 3:
                            nilDatas = _b.sent();
                            if (!(nilDatas && nilDatas.length > 0)) return [3 /*break*/, 16];
                            _a = 0, nilDatas_1 = nilDatas;
                            _b.label = 4;
                        case 4:
                            if (!(_a < nilDatas_1.length)) return [3 /*break*/, 16];
                            nilData = nilDatas_1[_a];
                            return [4 /*yield*/, db.get(tk).delete(tables_1.tables.nils.name, nil)
                                // @ts-ignore
                            ];
                        case 5:
                            _b.sent();
                            root = nilData.Root;
                            return [4 /*yield*/, db.get(tk).select(tables_1.tables.utxo.name, { Root: root })];
                        case 6:
                            utxos = _b.sent();
                            return [4 /*yield*/, db.get(tk).delete(tables_1.tables.tickets.name, { Root: root })];
                        case 7:
                            _b.sent();
                            return [4 /*yield*/, db.get(tk).delete(tables_1.tables.utxoTkt.name, { Root: root })];
                        case 8:
                            _b.sent();
                            if (!utxos) return [3 /*break*/, 15];
                            utxo_4 = utxos[0];
                            if (!utxo_4) return [3 /*break*/, 15];
                            txBase = {
                                TxHash: txInfo.TxHash,
                                TxType: tables_1.TxType.out,
                                Root: root,
                                // @ts-ignore
                                Asset: utxo_4.Asset,
                                TxHash_Root_TxType: [txInfo.TxHash, root, tables_1.TxType.out].join("_"),
                                Num_TxHash: [txInfo.Num, txInfo.TxHash].join("_"),
                            };
                            return [4 /*yield*/, db.get(tk).update(tables_1.tables.txBase.name, txBase)];
                        case 9:
                            _b.sent();
                            if (!utxo_4.Asset.Tkn) return [3 /*break*/, 12];
                            currency = utils_1.default.hexToCy(utxo_4.Asset.Tkn.Currency);
                            return [4 /*yield*/, db.get(tk).select(tables_1.tables.assets.name, { Currency: currency })];
                        case 10:
                            assets_2 = _b.sent();
                            return [4 /*yield*/, changeAssets(assets_2, utxo_4, db.get(tk), tables_1.TxType.out)];
                        case 11:
                            _b.sent();
                            _b.label = 12;
                        case 12: return [4 /*yield*/, db.get(tk).delete(tables_1.tables.utxo.name, { Root: root })];
                        case 13:
                            _b.sent();
                            sendLog("Remove UTXO", JSON.stringify({ Root: root }));
                            if (!(utxo_4.Asset && utxo_4.Asset.Tkn)) return [3 /*break*/, 15];
                            cy = utils_1.default.hexToCy(utxo_4.Asset.Tkn.Currency);
                            txCurrency = {
                                Num: txInfo.Num,
                                TxHash: txInfo.TxHash,
                                Currency: utils_1.default.hexToCy(utxo_4.Asset.Tkn.Currency),
                                id: [txInfo.Num, txInfo.TxHash, cy].join("_"),
                            };
                            return [4 /*yield*/, db.get(tk).update(tables_1.tables.txCurrency.name, txCurrency)];
                        case 14:
                            _b.sent();
                            _b.label = 15;
                        case 15:
                            _a++;
                            return [3 /*break*/, 4];
                        case 16: return [4 /*yield*/, db.get(tk).update(tables_1.tables.tx.name, txInfo)];
                        case 17:
                            _b.sent();
                            _b.label = 18;
                        case 18:
                            _i++;
                            return [3 /*break*/, 2];
                        case 19: return [2 /*return*/];
                    }
                });
            });
        }
        var nils, nilArr, _i, nils_1, nil;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.get(tk).selectAll(tables_1.tables.nils.name)];
                case 1:
                    nils = _a.sent();
                    nilArr = new Array();
                    _i = 0, nils_1 = nils;
                    _a.label = 2;
                case 2:
                    if (!(_i < nils_1.length)) return [3 /*break*/, 5];
                    nil = nils_1[_i];
                    nilArr.push(nil.Nil);
                    if (!(nilArr.length >= 1000)) return [3 /*break*/, 4];
                    return [4 /*yield*/, _innerCheckNil(nilArr)];
                case 3:
                    _a.sent();
                    nilArr = new Array();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    if (!(nilArr && nilArr.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, _innerCheckNil(nilArr)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function repairAssets() {
    return __awaiter(this, void 0, void 0, function () {
        var dbEntries, dbRes, _db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dbEntries = db.entries();
                    dbRes = dbEntries.next();
                    _a.label = 1;
                case 1:
                    if (!!dbRes.done) return [3 /*break*/, 3];
                    _db = dbRes.value[1];
                    return [4 /*yield*/, _repair(_db)];
                case 2:
                    _a.sent();
                    dbRes = dbEntries.next();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function _repair(db) {
    return __awaiter(this, void 0, void 0, function () {
        var assetsUtxos, tmpMap, i, assetsUtxo, Tkn, currency, value, asinf, amount, asinf, entry, res, assets_3, asset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Repair Data === ", db.name);
                    return [4 /*yield*/, db.selectAll(tables_1.tables.assetUtxo.name)];
                case 1:
                    assetsUtxos = _a.sent();
                    tmpMap = new Map();
                    for (i = 0; i < assetsUtxos.length; i++) {
                        assetsUtxo = assetsUtxos[i];
                        Tkn = assetsUtxo.Asset.Tkn;
                        currency = utils_1.hexToCy(Tkn.Currency);
                        value = Tkn.Value;
                        console.log(assetsUtxo.RootType, currency, value);
                        if (tmpMap.has(currency)) {
                            asinf = tmpMap.get(currency);
                            amount = void 0;
                            if (assetsUtxo.RootType.indexOf("_1") > -1) {
                                amount = new bignumber_js_1.default(asinf.Amount).minus(new bignumber_js_1.default(value)).toString(10);
                            }
                            else {
                                amount = new bignumber_js_1.default(asinf.Amount).plus(new bignumber_js_1.default(value)).toString(10);
                            }
                            asinf.Amount = amount;
                            tmpMap.set(currency, asinf);
                        }
                        else {
                            asinf = new /** @class */ (function () {
                                function class_1() {
                                }
                                return class_1;
                            }());
                            asinf.Currency = currency;
                            if (assetsUtxo.RootType.indexOf("_1") > -1) {
                                asinf.Amount = new bignumber_js_1.default(value).multipliedBy(new bignumber_js_1.default(-1)).toString(10);
                            }
                            else {
                                asinf.Amount = value;
                            }
                            tmpMap.set(currency, asinf);
                        }
                    }
                    entry = tmpMap.entries();
                    res = entry.next();
                    _a.label = 2;
                case 2:
                    if (!!res.done) return [3 /*break*/, 5];
                    return [4 /*yield*/, db.select(tables_1.tables.assets.name, { Currency: res.value[0] })];
                case 3:
                    assets_3 = _a.sent();
                    asset = assets_3[0];
                    asset.Amount = res.value[1].Amount;
                    return [4 /*yield*/, db.update(tables_1.tables.assets.name, asset)];
                case 4:
                    _a.sent();
                    res = entry.next();
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function _setLatestSyncTime() {
    latestSyncTime = new Date().getTime();
}
