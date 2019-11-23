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
var types_1 = require("./types");
var tables_1 = require("./tables");
var utils_1 = require("jsuperzk/dist/utils/utils");
var axios_1 = require("axios");
var bignumber_js_1 = require("bignumber.js");
var jsuperzk = require("jsuperzk/dist/index");
var superzk = require("jsuperzk/dist/protocol/account");
var tx_1 = require("jsuperzk/dist/tx/tx");
var db = new Map();
var latestSyncTime = null;
var syncIntervalId = null;
var isSyncing = false;
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
    console.log("popservice receive data: ", e.data);
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
    console.log("commitTx >>> ", message, tx);
    _commitTx(tx).then(function (hash) {
        console.log("_commitTx hash:", hash);
        message.data = hash;
        _postMessage(message);
    }).catch(function (err) {
        console.log("_commitTx err:", err);
        message.error = err;
        _postMessage(message);
    });
}
function _genPrePramas(tx, acInfo) {
    var From = tx.From, To = tx.To, Value = tx.Value, Cy = tx.Cy, Data = tx.Data, Gas = tx.Gas, GasPrice = tx.GasPrice;
    if (!Cy)
        Cy = "SERO";
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
        Currency: utils_1.default.cyToHex("SERO"),
        Value: new bignumber_js_1.default(GasPrice, 16).multipliedBy(new bignumber_js_1.default(Gas, 16)).toString(10)
    };
    var asset = {
        Tkn: tkn,
    };
    var reception = {
        Addr: To,
        Asset: asset
    };
    // const fee = new BigNumber(tx.Gas).multipliedBy(tx.GasPrice).toString(10)
    var preTxParam = {
        From: From,
        RefundTo: acInfo.PKr,
        Fee: fee,
        GasPrice: utils_1.default.toBN(GasPrice).toString(10),
        Cmds: null,
        Receptions: [reception],
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
    }
    return preTxParam;
}
function _storePending(tk, signRet, tx, _db) {
    return __awaiter(this, void 0, void 0, function () {
        var txInfo, asset, txBase;
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
                        Asset: asset
                    };
                    return [4 /*yield*/, _db.update(tables_1.tables.txBase.name, txBase)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function _commitTx(tx) {
    return __awaiter(this, void 0, void 0, function () {
        var tk, _db, acInfo, preTxParam, rest, signRet, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tk = tx.From;
                    if (!db || !db.get(tk)) {
                        return [2 /*return*/];
                    }
                    _db = db.get(tk);
                    return [4 /*yield*/, _db.selectId(tables_1.tables.syncInfo.name, 1)];
                case 1:
                    acInfo = _a.sent();
                    preTxParam = _genPrePramas(tx, acInfo);
                    console.log("tx >>> preTxParam: ", preTxParam, JSON.stringify(preTxParam));
                    return [4 /*yield*/, tx_1.genTxParam(preTxParam, new TxGenerator(), new TxState())];
                case 2:
                    rest = _a.sent();
                    rest.Z = false;
                    signRet = tx_1.signTx(tx.SK, rest);
                    console.log("tx >>> rest: ", rest, JSON.stringify(rest));
                    console.log("tx >>> signRet: ", signRet, JSON.stringify(signRet));
                    return [4 /*yield*/, jsonRpcReq('sero_commitTx', [signRet])];
                case 3:
                    resp = _a.sent();
                    console.log("tx >>> resp: ", resp);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            // @ts-ignore
                            if (!resp.data.result) {
                                var txPending = tx;
                                txPending.From = acInfo.PKr;
                                if (tx.Data) {
                                    txPending.From = acInfo.MainPKr;
                                }
                                _storePending(tk, signRet, txPending, _db).then().catch(function (e) { console.log("e:", e); });
                                resolve(signRet.Hash);
                            }
                            else {
                                // @ts-ignore
                                reject(resp.data);
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
                    case 0:
                        console.log("findRoots::", accountKey, currency, remain);
                        return [4 /*yield*/, db.get(accountKey).select(tables_1.tables.utxo.name, { TK: accountKey })];
                    case 1:
                        utxoAll = _a.sent();
                        console.log("utxoAll::", utxoAll);
                        return [2 /*return*/, new Promise(function (resolve) {
                                var utxos = new Array();
                                for (var _i = 0, utxoAll_1 = utxoAll; _i < utxoAll_1.length; _i++) {
                                    var utxo = utxoAll_1[_i];
                                    if (utxo.Asset && utxo.Asset.Tkn) {
                                        var tkn = utxo.Asset.Tkn;
                                        if (utils_1.hexToCy(tkn.Currency) === currency) {
                                            utxos.push(utxo);
                                            var amount = utils_1.default.toBN(tkn.Value);
                                            remain = remain.sub(amount);
                                            if (remain.isNeg() || remain.isZero()) {
                                                break;
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
        return new Promise(function (resolve) {
            resolve({ utxos: [], remain: new Map() });
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
function healthyCheck() {
    if (!latestSyncTime) {
        return false;
    }
    var now = new Date().getTime();
    return (now - latestSyncTime) < 60 * 1000;
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
                if (txBase.Asset && txBase.Asset.Tkt) {
                    if (TktMap.has(txBase.Asset.Tkt)) {
                        var val = TktMap.get(txBase.Asset.Tkt.Category);
                        // @ts-ignore
                        TktMap.set(txBase.Asset.Tkt.Category, val.push(txBase.Asset.Tkt.Value));
                    }
                    else {
                        TktMap.set(txBase.Asset.Tkt.Category, [txBase.Asset.Tkt.Value]);
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
        var data, tk, start, end, count, rest, txList, _i, rest_1, txInfo, txBases, txDetail;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = message.data;
                    tk = data.tk;
                    if (!db || !db.get(tk)) {
                        return [2 /*return*/];
                    }
                    start = data.start;
                    end = 500;
                    if (data.end) {
                        end = data.end;
                    }
                    count = 10;
                    if (data.count) {
                        count = data.count;
                    }
                    return [4 /*yield*/, db.get(tk).some(tables_1.tables.tx.name, "Num_TxHash", start, end)];
                case 1:
                    rest = _a.sent();
                    txList = [];
                    if (!(rest && rest.length > 0)) return [3 /*break*/, 6];
                    _i = 0, rest_1 = rest;
                    _a.label = 2;
                case 2:
                    if (!(_i < rest_1.length)) return [3 /*break*/, 6];
                    txInfo = rest_1[_i];
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.txBase.name, { TxHash: txInfo.TxHash })];
                case 3:
                    txBases = _a.sent();
                    return [4 /*yield*/, _genTxInfo(txBases, txInfo, data.cy)];
                case 4:
                    txDetail = _a.sent();
                    if (txDetail.Tkn && txDetail.Tkn.size > 0 || txDetail.Tkt && txDetail.Tkt.size > 0) {
                        txList.push(txDetail);
                    }
                    if (txList.length >= count) {
                        return [3 /*break*/, 6];
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, new Promise(function (resolve) {
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
                console.log("initAccount rest: ", rest);
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
function clearData() {
}
function findUtxos(tk, cy, amount) {
}
function balancesOf(message) {
    var tk = message.data;
    if (!db) {
        return;
    }
    db.get(tk).selectAll(tables_1.tables.assets.name).then(function (rest) {
        var TknRet = new Map();
        if (rest && rest.length > 0) {
            rest.forEach(function (value) {
                TknRet.set(value.Currency, value.Amount);
            });
        }
        message.data = TknRet;
        _postMessage(message);
    }).catch(function (err) {
        message.error = err.message;
        _postMessage(message);
    });
    // db.get(tk).select(tables.utxo.name, {TK: tk}).then(utxos => {
    //     let TknRet: Map<string, string> = new Map<string, string>();
    //     // @ts-ignore
    //     for (let utxo of utxos) {
    //         // @ts-ignore
    //         if (utxo.Asset && utxo.Asset.Tkn) {
    //             // @ts-ignore
    //             let tkn: Map<string, string> = utxo.Asset.Tkn;
    //             let cy: string = hexToCy(tkn["Currency"]);
    //             if (TknRet.has(cy)) {
    //                 let amount = new BigNumber(TknRet.get(cy)).plus(new BigNumber(tkn["Value"])).toString(10);
    //                 TknRet.set(cy, amount)
    //             } else {
    //                 TknRet.set(cy, tkn["Value"])
    //             }
    //         }
    //     }
    //     message.data = TknRet
    //     _postMessage(message)
    // }).catch(err => {
    //     message.error = err.message;
    //     _postMessage(message)
    // })
}
function ticketsOf(tk) {
    return { method: types_1.Method.BalanceOf, data: "success", error: null };
}
function init(message) {
    var initParam = message.data;
    console.log("init sync component ! ");
    if (initParam.rpc && initParam.syncTime) {
        rpc = initParam.rpc;
        syncTime = initParam.syncTime;
        console.log("rpc: ", rpc, "syncTime: ", syncTime);
    }
    if (!syncIntervalId) {
        _startSync();
    }
    // if (!db) {
    //     db = new PopDB(dbConfig)
    // }
    message.data = "success";
    _postMessage(message);
}
function _postMessage(message) {
    console.log("popservice response >>>>>>", message);
    // @ts-ignore
    self.postMessage(message);
}
function _startSync() {
    syncIntervalId = setInterval(function () {
        try {
            if (!isSyncing) {
                isSyncing = true;
                console.log("======= start sync data");
                if (db) {
                    db.forEach(function (db) {
                        _fetchOuts(db).then(function (rest) {
                            console.log("_fetchOuts rest ===> ", rest);
                            _setLatestSyncTime();
                            isSyncing = false;
                        }).catch(function (error) {
                            console.log("_fetchOuts error ===> ", error);
                            throw new Error(error);
                        });
                    });
                }
            }
            else {
                console.log("======= syncing data....");
            }
        }
        catch (e) {
            console.log("sync data error:", e.message);
        }
    }, syncTime);
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
function _fetchOuts(db) {
    return __awaiter(this, void 0, void 0, function () {
        var infos, _i, infos_1, info, syncInfo, start, end, rtn, _a, _b, utxo, currency, assets, _c, _d, nil, nils, _e, _f, txData, version, isNew;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!db) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, db.selectAll(tables_1.tables.syncInfo.name)];
                case 1:
                    infos = _g.sent();
                    _i = 0, infos_1 = infos;
                    _g.label = 2;
                case 2:
                    if (!(_i < infos_1.length)) return [3 /*break*/, 21];
                    info = infos_1[_i];
                    syncInfo = info;
                    _g.label = 3;
                case 3:
                    if (!true) return [3 /*break*/, 18];
                    start = 0;
                    end = null;
                    if (!info.CurrentBlock || info.CurrentBlock === 0) {
                    }
                    else {
                        start = info.CurrentBlock;
                    }
                    return [4 /*yield*/, fetchAndIndex(info.TK, info.PkrIndex, info.UseHashPKr, start, end)];
                case 4:
                    rtn = _g.sent();
                    if (!(rtn.utxos && rtn.utxos.length > 0)) return [3 /*break*/, 13];
                    _a = 0, _b = rtn.utxos;
                    _g.label = 5;
                case 5:
                    if (!(_a < _b.length)) return [3 /*break*/, 13];
                    utxo = _b[_a];
                    utxo["TK"] = info.TK;
                    currency = utils_1.default.hexToCy(utxo.Asset.Tkn.Currency);
                    return [4 /*yield*/, db.select(tables_1.tables.assets.name, { Currency: currency })];
                case 6:
                    assets = _g.sent();
                    return [4 /*yield*/, db.update(tables_1.tables.utxo.name, utxo)];
                case 7:
                    _g.sent();
                    return [4 /*yield*/, changeAssets(assets, utxo, db, tables_1.TxType.in)];
                case 8:
                    _g.sent();
                    if (!utxo.Nils) return [3 /*break*/, 12];
                    _c = 0, _d = utxo.Nils;
                    _g.label = 9;
                case 9:
                    if (!(_c < _d.length)) return [3 /*break*/, 12];
                    nil = _d[_c];
                    nils = { Nil: nil, Root: utxo.Root };
                    return [4 /*yield*/, db.update(tables_1.tables.nils.name, nils)];
                case 10:
                    _g.sent();
                    _g.label = 11;
                case 11:
                    _c++;
                    return [3 /*break*/, 9];
                case 12:
                    _a++;
                    return [3 /*break*/, 5];
                case 13:
                    if (!(rtn.txInfos && rtn.txInfos.length > 0)) return [3 /*break*/, 17];
                    _e = 0, _f = rtn.txInfos;
                    _g.label = 14;
                case 14:
                    if (!(_e < _f.length)) return [3 /*break*/, 17];
                    txData = _f[_e];
                    txData.TK = info.TK;
                    txData.Num_TxHash = txData.Num + "_" + txData.TxHash;
                    db.delete(tables_1.tables.txBase.name, { "TxHash_Root_TxType": [txData.TxHash, txData.TxHash, tables_1.TxType.out].join("_") }).then(function (res) { }).catch(function (err) { });
                    db.delete(tables_1.tables.tx.name, { "Num_TxHash": ["99999999999", txData.TxHash].join("_") }).then(function (res) { }).catch(function (err) { });
                    return [4 /*yield*/, db.update(tables_1.tables.tx.name, txData)];
                case 15:
                    _g.sent();
                    _g.label = 16;
                case 16:
                    _e++;
                    return [3 /*break*/, 14];
                case 17:
                    if (rtn.useHashPKr) {
                        syncInfo.UseHashPKr = true;
                    }
                    if (rtn.again === true) {
                        syncInfo.PkrIndex = syncInfo.PkrIndex + 1;
                        version = 1;
                        isNew = utils_1.isNewVersion(utils_1.default.toBuffer(info.TK));
                        if (isNew) {
                            version = 2;
                        }
                        syncInfo.PKr = jsuperzk.createPkrHash(info.TK, syncInfo.PkrIndex, version);
                        end = rtn.lastBlockNumber;
                    }
                    else {
                        syncInfo.CurrentBlock = rtn.lastBlockNumber + 1;
                        return [3 /*break*/, 18];
                    }
                    return [3 /*break*/, 3];
                case 18: return [4 /*yield*/, db.update(tables_1.tables.syncInfo.name, syncInfo)];
                case 19:
                    _g.sent();
                    _checkNil(info.TK).then(function (rest) {
                        console.log("_checkNil rest ===> ", rest);
                    }).catch(function (error) {
                        console.log("_checkNil error ===> ", error);
                        throw new Error(error);
                    });
                    _g.label = 20;
                case 20:
                    _i++;
                    return [3 /*break*/, 2];
                case 21: return [2 /*return*/];
            }
        });
    });
}
function fetchAndIndex(tk, pkrIndex, useHashPkr, start, end) {
    return new Promise(function (resolve, reject) {
        var pkrRest = genPKrs(tk, pkrIndex, useHashPkr);
        var param = [];
        if (end) {
            var currentPkr_1 = [];
            pkrRest.CurrentPKrMap.forEach((function (value, key) {
                currentPkr_1.push(key);
            }));
            param = [currentPkr_1, start, end];
        }
        else {
            param = [pkrRest.PKrs, start, null];
        }
        jsonRpcReq("light_getOutsByPKr", param).then(function (response) {
            // @ts-ignore
            var data = response.data;
            var rest = {
                utxos: null,
                again: false,
                useHashPKr: false,
                remoteNum: 0,
                nextNum: 0,
                lastBlockNumber: 0,
                txInfos: null
            };
            var hasResWithHashPkr = false;
            var hasResWithOldPkr = false;
            if (data.result) {
                var lastBlockNumber_1 = start;
                var blocks = data.result.BlockOuts;
                var outs_1 = [];
                var txInfos_1 = [];
                var Utxos_1 = [];
                if (blocks && blocks.length > 0) {
                    blocks.forEach(function (block, index) {
                        lastBlockNumber_1 = Math.max(block.Num, lastBlockNumber_1);
                        var blockDatas = block.Data;
                        blockDatas.forEach(function (blockData, index) {
                            outs_1.push(blockData.Out);
                            var txInfo = blockData.TxInfo;
                            var utxos = jsuperzk.decOut(tk, [blockData.Out]);
                            txInfo.Root = blockData.Out.Root;
                            var txBase = {
                                TxHash: txInfo.TxHash,
                                TxType: tables_1.TxType.in,
                                Root: blockData.Out.Root,
                                Asset: utxos[0].Asset,
                                TxHash_Root_TxType: [txInfo.TxHash, txInfo.Root, tables_1.TxType.in].join("_")
                            };
                            txInfos_1.push(txInfo);
                            db.get(tk).update(tables_1.tables.txBase.name, txBase).then(function (rest) {
                                console.log("index txInfo success");
                            }).catch(function (err) {
                                console.log(err);
                            });
                            Utxos_1 = Utxos_1.concat(utxos);
                        });
                    });
                }
                Utxos_1.forEach(function (utxo) {
                    if (pkrRest.CurrentPKrMap.has(utxo.Pkr)) {
                        rest.again = true;
                    }
                    if (!useHashPkr) {
                        if (pkrRest.PKrTypeMap.get(utxo.Pkr) === PKrType.New) {
                            hasResWithHashPkr = true;
                        }
                        else if (pkrRest.PKrTypeMap.get(utxo.Pkr) === PKrType.Old) {
                            hasResWithOldPkr = true;
                        }
                    }
                });
                rest.txInfos = txInfos_1;
                rest.utxos = Utxos_1;
                rest.lastBlockNumber = data.result.CurrentNum;
                rest.remoteNum = data.result.CurrentNum;
                if (rest.remoteNum > end) {
                    rest.nextNum = end + 1;
                }
                else {
                    rest.nextNum = data.result.CurrentNum + 1;
                }
                if (!useHashPkr && hasResWithHashPkr && !hasResWithOldPkr) {
                    rest.useHashPKr = true;
                }
            }
            resolve(rest);
        }).catch(function (reason) {
            reject(reason);
        });
    });
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
    return { PKrTypeMap: pkrTypeMap, CurrentPKrMap: currentPKrMap, PKrs: pkrs };
}
var PKrType;
(function (PKrType) {
    PKrType[PKrType["New"] = 0] = "New";
    PKrType[PKrType["Old"] = 1] = "Old";
})(PKrType || (PKrType = {}));
function _checkNil(tk) {
    return __awaiter(this, void 0, void 0, function () {
        var nils, nilArr, _i, nils_1, nil, resp, datas, _a, datas_1, data, txInfo, nil, nilDatas, _b, nilDatas_1, nilData, root, utxos, utxo, txBase, currency, assets;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, db.get(tk).selectAll(tables_1.tables.nils.name)];
                case 1:
                    nils = _c.sent();
                    nilArr = new Array();
                    // @ts-ignore
                    for (_i = 0, nils_1 = nils; _i < nils_1.length; _i++) {
                        nil = nils_1[_i];
                        nilArr.push(nil.Nil);
                    }
                    if (!(nilArr && nilArr.length > 0)) return [3 /*break*/, 16];
                    return [4 /*yield*/, jsonRpcReq('light_checkNil', [nilArr])
                        // @ts-ignore
                    ];
                case 2:
                    resp = _c.sent();
                    if (!(resp && resp.data && resp.data.result)) return [3 /*break*/, 16];
                    datas = resp.data.result;
                    if (!datas) return [3 /*break*/, 16];
                    _a = 0, datas_1 = datas;
                    _c.label = 3;
                case 3:
                    if (!(_a < datas_1.length)) return [3 /*break*/, 16];
                    data = datas_1[_a];
                    txInfo = data.TxInfo;
                    nil = { Nil: data.Nil };
                    txInfo.TK = tk;
                    txInfo.Num_TxHash = txInfo.Num + "_" + txInfo.TxHash;
                    db.get(tk).delete(tables_1.tables.txBase.name, { "TxHash_Root_TxType": [txInfo.TxHash, txInfo.TxHash, tables_1.TxType.out].join("_") }).then(function (res) { }).catch(function (err) { });
                    db.get(tk).delete(tables_1.tables.tx.name, { "Num_TxHash": ["99999999999", txInfo.TxHash].join("_") }).then(function (res) { }).catch(function (err) { });
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.nils.name, nil)];
                case 4:
                    nilDatas = _c.sent();
                    if (!(nilDatas && nilDatas.length > 0)) return [3 /*break*/, 13];
                    _b = 0, nilDatas_1 = nilDatas;
                    _c.label = 5;
                case 5:
                    if (!(_b < nilDatas_1.length)) return [3 /*break*/, 13];
                    nilData = nilDatas_1[_b];
                    return [4 /*yield*/, db.get(tk).delete(tables_1.tables.nils.name, nil)
                        // @ts-ignore
                    ];
                case 6:
                    _c.sent();
                    root = nilData.Root;
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.utxo.name, { Root: root })];
                case 7:
                    utxos = _c.sent();
                    if (!utxos) return [3 /*break*/, 12];
                    utxo = utxos[0];
                    if (!utxo) return [3 /*break*/, 12];
                    txBase = {
                        TxHash: txInfo.TxHash,
                        TxType: tables_1.TxType.out,
                        Root: root,
                        // @ts-ignore
                        Asset: utxo.Asset,
                        TxHash_Root_TxType: [txInfo.TxHash, root, tables_1.TxType.out].join("_")
                    };
                    return [4 /*yield*/, db.get(tk).update(tables_1.tables.txBase.name, txBase)];
                case 8:
                    _c.sent();
                    currency = utils_1.default.hexToCy(utxo.Asset.Tkn.Currency);
                    return [4 /*yield*/, db.get(tk).select(tables_1.tables.assets.name, { Currency: currency })];
                case 9:
                    assets = _c.sent();
                    return [4 /*yield*/, changeAssets(assets, utxo, db.get(tk), tables_1.TxType.out)];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, db.get(tk).delete(tables_1.tables.utxo.name, { Root: root })];
                case 11:
                    _c.sent();
                    _c.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 5];
                case 13: return [4 /*yield*/, db.get(tk).update(tables_1.tables.tx.name, txInfo)];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15:
                    _a++;
                    return [3 /*break*/, 3];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function _setLatestSyncTime() {
    latestSyncTime = new Date().getTime();
}
