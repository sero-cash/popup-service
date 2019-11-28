import {PopDB} from "../db/PopDB";
import {Message, Method, PriceTickect, Tx} from "./types";
import {AssetsInfo, dbConfig, Nils, SyncInfo, tables, TxBase, TxCurrency, TxInfo, TxType} from './tables';
import utils, {hexToCy, isNewVersion} from "jsuperzk/dist/utils/utils";
import axios from 'axios';
import BigNumber from 'bignumber.js';
import BN from "bn.js";

import * as jsuperzk from 'jsuperzk/dist/index';
import * as superzk from "jsuperzk/dist/protocol/account";
import {PreTxParam, utxo} from "jsuperzk/dist/tx/prepare";
import {genTxParam, signTx} from "jsuperzk/dist/tx/tx";
import {Asset, Token, Witness, ZPkg} from "jsuperzk/dist/types/types";

let db: Map<string, PopDB> = new Map<string, PopDB>();

let latestSyncTime = new Date().getTime();
let syncIntervalId = null;
let isSyncing = false;
let syncTime: number = 10 * 1000;
let rpc = null;

let times = 0 ;

let rpcId = 0;

const operations = {
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
}


self.addEventListener('message', e => {
    console.log("popservice receive data: ", e.data);
    if (e.data && e.data.method) {
        if (operations[e.data.method]) {
            operations[e.data.method](e.data)
        }
    }
})

function getSeroPrice(message: Message) {

    let t = message.data;
    axios.get("https://data.gateio.co/api2/1/ticker/" + t).then(response => {
        if (response && response.data) {
            let price: PriceTickect = <PriceTickect>response.data;
            message.data = price;
            _postMessage(message)
        }
    }).catch(err => {

    })
}


function commitTx(message: Message) {
    const tx: Tx = message.data
    console.log("commitTx >>> ", message, tx)
    _commitTx(tx).then(hash => {
        console.log("_commitTx hash:", hash)
        message.data = hash;
        _postMessage(message)
    }).catch(err => {
        console.log("_commitTx err:", err)
        message.error = err;
        _postMessage(message)
    })
}

function _genPrePramas(tx: Tx, acInfo: SyncInfo) {
    let {From, To, Value, Cy, Data, Gas, GasPrice} = tx;
    if (!Cy) Cy = "SERO"
    if (!Gas) {
        Gas = "0x" + new BigNumber("4700000").toString(16);
    }
    if (!GasPrice) {
        GasPrice = "0x" + new BigNumber("1000000000").toString(16);
    }

    const tkn = {
        Currency: utils.cyToHex(Cy),
        Value: utils.toBN(Value).toString(10)
    }
    const fee = {
        Currency: utils.cyToHex("SERO"),
        Value: new BigNumber(GasPrice, 16).multipliedBy(new BigNumber(Gas, 16)).toString(10)
    }
    const asset = {
        Tkn: tkn,
    }
    const reception = {
        Addr: To,
        Asset: asset
    }

    // const fee = new BigNumber(tx.Gas).multipliedBy(tx.GasPrice).toString(10)
    const preTxParam: PreTxParam = {
        From: From,
        RefundTo: acInfo.PKr,
        Fee: fee,
        GasPrice: utils.toBN(GasPrice).toString(10),
        Cmds: null,
        Receptions: [reception],
    }

    // contract
    if (Data) {
        preTxParam.Receptions = []
        preTxParam.RefundTo = acInfo.MainPKr
        preTxParam.Cmds = {
            Contract: {
                Data: Data,
                To: utils.bs58ToHex(To) + "0000000000000000000000000000000000000000000000000000000000000000",
                Asset: {
                    Tkn: {Currency: utils.cyToHex(Cy), Value: utils.toBN(Value).toString()},
                }
            }
        }
    }
    return preTxParam;
}

async function _storePending(tk, signRet, tx: Tx, _db) {
    let txInfo: TxInfo = {
        TK: tk,
        TxHash: signRet.Hash,
        Num_TxHash: "99999999999_" + signRet.Hash,
        BlockHash: "",
        From: tx.From,
        Gas: new BigNumber(tx.Gas, 16).toNumber(),
        GasPrice: new BigNumber(tx.GasPrice, 16).toNumber(),
        GasUsed: new BigNumber(tx.Gas, 16).toNumber(),
        Num: 99999999999,
        Time: Math.floor(new Date().getTime() / 1000),
        To: tx.To,
        State: "pending"
    }

    await _db.update(tables.tx.name, txInfo)
    let asset: Asset = {
        Tkn: {
            Currency: utils.cyToHex(tx.Cy),
            Value: new BigNumber(tx.Value).toString(10),
        }
    }
    const txBase: TxBase = {
        TxHash: signRet.Hash,
        TxType: TxType.out,
        Root: signRet.Hash,
        TxHash_Root_TxType: [signRet.Hash, signRet.Hash, TxType.out].join("_"),
        Num_TxHash:[txInfo.Num,signRet.Hash].join("_"),
        Asset: asset
    }
    await _db.update(tables.txBase.name, txBase)

    const txCurrency : TxCurrency = {
        Num:txInfo.Num,
        TxHash:txInfo.TxHash,
        Currency:tx.Cy,
        id:[txInfo.Num,txInfo.TxHash,tx.Cy].join("_"),
    }
    await db.get(tk).update(tables.txCurrency.name,txCurrency)
}

async function _commitTx(tx: Tx): Promise<string | null> {

    let tk = tx.From;
    if (!db || !db.get(tk)) {
        return new Promise<string | null>((resolve, reject) => {
            reject("Account is invalid! ")
        })

    }else{
        const _db = db.get(tk);
        const acInfo: SyncInfo = <SyncInfo> await _db.selectId(tables.syncInfo.name, 1)

        const preTxParam = _genPrePramas(tx, acInfo);
        console.log("tx >>> preTxParam: ", preTxParam, JSON.stringify(preTxParam));
        const rest = await genTxParam(preTxParam, new TxGenerator(), new TxState());
        rest.Z = false;
        const signRet = signTx(tx.SK, rest)
        console.log("tx >>> rest: ", rest, JSON.stringify(rest));
        console.log("tx >>> signRet: ", signRet, JSON.stringify(signRet));
        const resp = await jsonRpcReq('sero_commitTx', [signRet])
        console.log("tx >>> resp: ", resp);

        return new Promise<string | null>((resolve, reject) => {
            // @ts-ignore
            if (!resp.data.result) {
                let txPending = tx;
                txPending.From = acInfo.PKr
                if (tx.Data) {
                    txPending.From = acInfo.MainPKr
                }
                _storePending(tk, signRet, txPending, _db).then().catch(e => {
                    console.log("e:", e)
                });

                resolve(signRet.Hash)
            } else {
                // @ts-ignore
                reject(resp.data)
            }
        })
    }

}


class TxGenerator {
    async findRoots(accountKey: string, currency: string, remain: BN): Promise<{ utxos: Array<utxo>; remain: BN }> {
        const utxoAll: Array<utxo> = <Array<utxo>>await db.get(accountKey).select(tables.utxo.name, {TK: accountKey})
        return new Promise<{ utxos: Array<utxo>, remain: BN }>(resolve => {
            let utxos = new Array<utxo>();
            for (let utxo of utxoAll) {
                if (utxo.Asset && utxo.Asset.Tkn) {
                    let tkn = utxo.Asset.Tkn;
                    if (hexToCy(tkn.Currency) === currency) {
                        utxos.push(utxo)
                        let amount = utils.toBN(tkn.Value);
                        remain = remain.sub(amount);
                        if (remain.isNeg() || remain.isZero()) {
                            break;
                        }
                    }
                }
            }
            resolve({utxos, remain})
        })
    }

    findRootsByTicket(accountKey: string, tickets: Map<string, string>): Promise<{ utxos: Array<utxo>; remain: Map<string, string> }> {
        return new Promise<{ utxos: Array<utxo>, remain: Map<string, string> }>(resolve => {
            resolve({utxos: [], remain: new Map<string, string>()})
        })

    }

    getRoot(root: string): Promise<utxo> {

        return
    }

    defaultRefundTo(accountKey: string): string {
        return ''
    }

}


class TxState {


    async getAnchor(roots: Array<string>): Promise<Array<Witness> | null> {
        const resp: any = await jsonRpcReq('sero_getAnchor', [roots])
        return new Promise<Array<Witness> | null>(resolve => {
            if (utils.isNotNull(resp.error)) {
                resolve(null)
            } else {
                resolve(resp.data.result)
            }
        })
    }

    getPkgById(id: string): Promise<ZPkg | null> {

        return
    }

    getSeroGasLimit(to: string, tfee: Token, gasPrice: BN): number {
        return utils.toBN(tfee.Value).div(gasPrice).toNumber();
    }


}


function getPKrIndex(message: Message) {
    const tk: string = message.data
    if (!db || !db.get(tk)) {
        return
    }
    db.get(tk).selectId(tables.syncInfo.name, 1).then((info: SyncInfo) => {
        info.TK = ""
        // let version = 1;
        // let isNew = isNewVersion(utils.toBuffer(tk));
        // if (isNew) {
        //     version = 2
        // }
        // info.PKr = jsuperzk.createPkrHash(tk, info.PkrIndex, version)
        message.data = info
        _postMessage(message)
    }).catch(err => {
        message.error = err;
        _postMessage(message)
    })
}

// === message
function healthyCheck(message: Message) {
    if (!latestSyncTime) {
        message.data = {health: false,latestSyncTime:latestSyncTime, isSyncing: isSyncing}
        _postMessage(message)
    } else {
        const now = new Date().getTime();
        message.data = {health: (now - latestSyncTime) < 60 * 1000,latestSyncTime:latestSyncTime, isSyncing: isSyncing}
        _postMessage(message)
    }
}

function getTxList(message: Message) {
    _getTxList(message).then(rest => {
        message.data = rest
        _postMessage(message)
    }).catch(err => {
        message.error = err;
        _postMessage(message)
    })
}

function _genTxInfo(txBases, txInfo, cy?: string) {
    return new Promise(function (resolve, reject) {
        if (txBases) {
            let TknMap = new Map<string, string>();
            let TktMap = new Map<string, Array<string>>()
            // @ts-ignore
            for (let txBase of txBases) {
                if (txBase.Asset && txBase.Asset.Tkn) {
                    let tkn = txBase.Asset.Tkn;

                    if (!cy || cy && hexToCy(tkn.Currency) === cy) {
                        let amount = new BigNumber(tkn.Value);
                        if (txBase.TxType === TxType.out) {
                            amount = amount.multipliedBy(-1)
                        }
                        if (TknMap.has(hexToCy(tkn.Currency))) {
                            let amountStr = amount.plus(new BigNumber(TknMap.get(hexToCy(tkn.Currency)))).toString(10);
                            TknMap.set(hexToCy(tkn.Currency), amountStr)
                        } else {
                            TknMap.set(hexToCy(tkn.Currency), amount.toString(10))
                        }
                    }
                }

                if (txBase.Asset && txBase.Asset.Tkt) {
                    if (TktMap.has(txBase.Asset.Tkt)) {
                        let val = TktMap.get(txBase.Asset.Tkt.Category)
                        // @ts-ignore
                        TktMap.set(txBase.Asset.Tkt.Category, val.push(txBase.Asset.Tkt.Value))
                    } else {
                        TktMap.set(txBase.Asset.Tkt.Category, [txBase.Asset.Tkt.Value])
                    }
                }
            }

            let TxDetail = txInfo;
            TxDetail["Tkn"] = TknMap;
            TxDetail["Tkt"] = TktMap;
            if (superzk.isMyPKr(TxDetail.TK, TxDetail.From)) {
                TxDetail["Type"] = "out"
            } else {
                TxDetail["Type"] = "in"
            }
            TxDetail.TK = "";
            TxDetail.Fee = new BigNumber(txInfo.GasUsed).multipliedBy(new BigNumber(txInfo.GasPrice)).dividedBy(new BigNumber(10).pow(18)).toString(10)

            resolve(TxDetail);
        } else {
            reject(new Error("txBases not found!"))
        }
    })
}

async function _getTxList(message: Message) {
    let data = message.data;
    let tk = data.tk;
    if (!db || !db.get(tk)) {
        return
    }
    let count = 10;
    if (data.count) {
        count = data.count;
    }

    const rest: any = await db.get(tk).some(tables.txCurrency.name,{Currency:data.cy}, count)
    let txList = [];
    if (rest && rest.length > 0) {
        for(let i=rest.length-1;i>=0;i--){
            let txCurrency= rest[i];
            let txInfos:any = await db.get(tk).select(tables.tx.name,{"Num_TxHash":[txCurrency.Num,txCurrency.TxHash].join("_")})
            if(txInfos && txInfos.length>0) {
                const txInfo = txInfos[0]
                const txBases = await db.get(tk).select(tables.txBase.name, {"Num_TxHash": [txCurrency.Num,txInfo.TxHash].join("_")});
                let txDetail: any = await _genTxInfo(txBases, txInfo, data.cy);
                if (txDetail.Tkn && txDetail.Tkn.size > 0 || txDetail.Tkt && txDetail.Tkt.size > 0) {
                    txList.push(txDetail)
                }
            }
        }
    }
    return new Promise(resolve => {
        function compare(o1:any,o2:any){
            return o1.Num-o2.Num;
        }
        txList.sort(compare)
        resolve(txList);
    })
}

function getTxDetail(message: Message) {
    if (!db) {
        return
    }
    let data = message.data;
    _getTxBase(data.tk, data.hash).then((rest: any) => {
        message.data = rest
        _postMessage(message)
    }).catch(err => {
        message.error = err.message;
        _postMessage(message)
    })
}

async function _getTxBase(tk, hash: string) {
    const txInfo = await db.get(tk).select(tables.tx.name, {TxHash:hash});
    const txBases = await db.get(tk).select(tables.txBase.name, {TxHash:hash});
    return await _genTxInfo(txBases, txInfo[0]);
}


function initAccount(message: Message) {

    const tk: string = message.data;
    if (tk) {
        if (db && !db.get(tk)) {
            let version = 1;
            let isNew = isNewVersion(utils.toBuffer(tk));
            if (isNew) {
                version = 2
            }
            let mainPKr = jsuperzk.createPkrHash(tk, 1, version)

            dbConfig.databaseName = "popup" + "_" + tk;
            let newDb: PopDB = new PopDB(dbConfig);
            db.set(tk, newDb)

            newDb.select(tables.syncInfo.name, {TK: tk}).then(rest => {
                console.log("initAccount rest: ", rest)
                // @ts-ignore
                if (!rest || rest.length === 0) {
                    let data: SyncInfo = {
                        TK: tk,
                        PkrIndex: 1,
                        CurrentBlock: 0,
                        LastCombineBlock: 0,
                        UseHashPKr: false,
                        MainPKr: mainPKr,
                        PKr: mainPKr
                    }
                    newDb.insert(tables.syncInfo.name, data).then(rest => {
                        message.data = "success"
                    }).catch(err => {
                        console.log(err);
                        message.error = err.message;
                    })
                }
                _postMessage(message)
            }).catch(error => {
                let data: SyncInfo = {
                    TK: tk,
                    PkrIndex: 1,
                    CurrentBlock: 0,
                    LastCombineBlock: 0,
                    UseHashPKr: false,
                    MainPKr: mainPKr,
                    PKr: mainPKr
                }
                newDb.insert(tables.syncInfo.name, data).then(rest => {
                    message.data = "success"
                }).catch(err => {
                    console.log(err);
                    message.error = err.message;
                })
                _postMessage(message)
            })
        }
    }


}

function clearData(message: Message) {
    _clearData().then(data => {
        isSyncing = false;
        message.data = "Success"
        _postMessage(message)
    }).catch(e => {
        isSyncing = false;
        message.error = e.message
        _postMessage(message)
    })
}

async function _clearData() {
    if (isSyncing === false) {
        isSyncing = true;
        let dbEntries = db.entries();
        let dbRes = dbEntries.next();
        while (!dbRes.done) {
            let _db = dbRes.value[1]
            await _db.clearTable(tables.utxo.name)
            await _db.clearTable(tables.txBase.name)
            await _db.clearTable(tables.assets.name)
            await _db.clearTable(tables.assetUtxo.name)
            await _db.clearTable(tables.tx.name)
            await _db.clearTable(tables.nils.name)
            await _db.clearTable(tables.txCurrency.name)

            const info: SyncInfo = <SyncInfo>await _db.selectId(tables.syncInfo.name, 1)
            info.CurrentBlock = 0;
            info.PKr = info.MainPKr;
            info.PkrIndex = 1;
            info.UseHashPKr = false;
            await _db.update(tables.syncInfo.name, info)

            dbRes = dbEntries.next()
        }
        return new Promise(function (resolve) {
            resolve("Data clear success!")
        })
    }else{
        return new Promise(function (resolve, reject) {
            reject("Data synchronization...")
        })
    }
}

function findUtxos(tk: string, cy: string, amount: string) {

}

function balancesOf(message: Message) {
    const tk: string = message.data;
    if (!db) {
        return
    }

    if(db.get(tk)){
        _getBalance();
    }else{
        setTimeout(function () {
            _getBalance();
        },1000)
    }

    function _getBalance() {
        db.get(tk).selectAll(tables.assets.name).then((rest: Array<AssetsInfo>) => {
            let TknRet: Map<string, string> = new Map<string, string>();
            if (rest && rest.length > 0) {
                rest.forEach(function (value) {
                    TknRet.set(value.Currency, value.Amount)
                })
            }
            message.data = TknRet
            _postMessage(message)
        }).catch(err => {
            message.error = err.message;
            _postMessage(message)
        })
    }
}

function ticketsOf(tk: string): Message {

    return {method: Method.BalanceOf, data: "success", error: null}
}


// === method
export interface initParam {
    rpc: string
    syncTime: number
}

function init(message: Message) {
    let initParam = message.data;
    console.log("init sync component ! ")
    if (initParam.rpc && initParam.syncTime) {
        rpc = initParam.rpc
        syncTime = initParam.syncTime
        console.log("rpc: ", rpc, "syncTime: ", syncTime)
    }

    if (syncIntervalId) {
       clearInterval(syncIntervalId)
    }
    isSyncing=false;
    _startSync();

    message.data = "success"
    _postMessage(message)

}

function _postMessage(message: Message): void {
    // console.log("popservice response >>>>>>", JSON.stringify(message));
    // @ts-ignore
    self.postMessage(message)
}

function _startSync(): void {
    syncIntervalId = setInterval(function () {
        console.log("======= start sync data,isSyncing=",isSyncing);
        if(!isSyncing){
            fetchHandler().then(flag=>{
                console.log("======= fetchHandler flag>>> ",flag);
            }).catch(error=>{
                console.log("======= fetchHandler error>>> ",error);
                isSyncing = false;
            })
            console.log("======= end sync data",isSyncing);
        }
        _setLatestSyncTime();
    }, syncTime)
}

async function fetchHandler(){
    let dbEntries = db.entries();
    let dbRes = dbEntries.next();
    isSyncing = true;
    console.log("======= set isSyncing begin",isSyncing);
    while (!dbRes.done) {
        let _db = dbRes.value[1]
        await _fetchOuts(_db)
        dbRes = dbEntries.next();
    }
    isSyncing = false;
    console.log("======= set isSyncing end ",isSyncing);
    return new Promise(function (resolve) {
        resolve(isSyncing)
    })
}


async function changeAssets(assets, utxo, db: PopDB, txType: TxType) {

    if (utxo.Asset.Tkn) {
        const rootType = [utxo.Root, txType].join("_");
        const assetsUtxo = await db.select(tables.assetUtxo.name, {RootType: rootType})

        if (assets && assets.length > 0) {
            // @ts-ignore
            if (assetsUtxo && assetsUtxo.length > 0) {
                console.log("asset utxo has set!!", utxo.Root)
            } else {
                let asset: AssetsInfo = assets[0];
                let amount = new BigNumber(utxo.Asset.Tkn.Value);
                if (txType === TxType.out) {
                    amount = amount.multipliedBy(-1)
                }
                asset.Amount = new BigNumber(asset.Amount).plus(amount).toString(10);

                let aUtxo = utxo;
                aUtxo["RootType"] = rootType;
                await db.update(tables.assetUtxo.name, aUtxo)
                await db.update(tables.assets.name, asset)
            }

        } else {
            // @ts-ignore
            if (assetsUtxo && assetsUtxo.length > 0) {
                console.log("asset utxo has set!!!", utxo.Root)
            } else {
                let aUtxo = utxo;
                aUtxo["RootType"] = rootType;
                await db.update(tables.assetUtxo.name, aUtxo)

                let amount = utxo.Asset.Tkn.Value;
                if (txType === TxType.out) {
                    amount = new BigNumber(utxo.Asset.Tkn.Value).multipliedBy(-1).toString(10);
                }
                let asset: AssetsInfo = {
                    Currency: utils.hexToCy(utxo.Asset.Tkn.Currency),
                    Amount: amount
                }
                await db.insert(tables.assets.name, asset)
            }

        }
    }
}

function _deletePending(db: PopDB, txData) {
    db.select(tables.tx.name, {"Num_TxHash": ["99999999999", txData.TxHash].join("_")}).then((pendingTxs:any)=>{
        if (pendingTxs && pendingTxs.length > 0) {
            db.delete(tables.txBase.name, {"TxHash_Root_TxType": [txData.TxHash, txData.TxHash, TxType.out].join("_")}).then(res => {
            }).catch(err => {
                console.log(err.message);
            });
            db.delete(tables.tx.name, {"Num_TxHash": ["99999999999", txData.TxHash].join("_")}).then(res => {
            }).catch(err => {
                console.log(err.message);
            });
            db.delete(tables.txCurrency.name, {"TxHash": txData.TxHash}).then(res => {
            }).catch(err => {
                console.log(err.message);
            });
        }
    }).catch(err=>{
        console.log(err.message);
    })
}

async function _fetchOuts(db: PopDB) {
    if (!db) {
        return
    }

    const infos = await db.selectAll(tables.syncInfo.name);
    // @ts-ignore
    for (let info of infos) {
        let syncInfo = info;
        let start = 0;
        let end = null;

        while (true) {

            if (!info.CurrentBlock || info.CurrentBlock === 0) {
            } else {
                start = info.CurrentBlock;
            }
            const rtn = await fetchAndIndex(info.TK, info.PkrIndex, info.UseHashPKr, start, end);

            if (rtn.utxos && rtn.utxos.length > 0) {
                for (let utxo of rtn.utxos) {
                    utxo["TK"] = info.TK;
                    const currency = utils.hexToCy(utxo.Asset.Tkn.Currency);
                    const assets = await db.select(tables.assets.name, {Currency: currency});
                    await db.update(tables.utxo.name, utxo)
                    await changeAssets(assets, utxo, db, TxType.in);

                    if (utxo.Nils) {
                        for (let nil of utxo.Nils) {
                            let nils: Nils = {Nil: nil, Root: utxo.Root}
                            await db.update(tables.nils.name, nils);
                        }
                    }
                }
            }

            if (rtn.txInfos && rtn.txInfos.length > 0) {
                for (let txData of rtn.txInfos) {
                    txData.TK = info.TK
                    txData.Num_TxHash = txData.Num + "_" + txData.TxHash;

                    _deletePending(db, txData);

                    await db.update(tables.tx.name, txData);
                }
            }

            if (rtn.useHashPKr) {
                syncInfo.UseHashPKr = true
            }

            if (rtn.again === true) {
                syncInfo.PkrIndex = syncInfo.PkrIndex + 1;
                let version = 1;
                let isNew = isNewVersion(utils.toBuffer(info.TK));
                if (isNew) {
                    version = 2
                }
                syncInfo.PKr = jsuperzk.createPkrHash(info.TK, syncInfo.PkrIndex, version)
                end = rtn.lastBlockNumber
            } else {
                syncInfo.CurrentBlock = rtn.lastBlockNumber + 1;
                break
            }
        }
        await db.update(tables.syncInfo.name, syncInfo)

        await _checkNil(info.TK)

    }
}

function fetchAndIndex(tk: string, pkrIndex: number, useHashPkr: boolean, start: number, end: any): Promise<fetchRest> {
    console.log("fetchAndIndex>>>> ",pkrIndex,useHashPkr,start,end);
    return new Promise((resolve, reject) => {
        const pkrRest = genPKrs(tk, pkrIndex, useHashPkr);
        let param = [];
        if (end && end>0) {
            let currentPkr = []
            pkrRest.CurrentPKrMap.forEach(((value, key) => {
                currentPkr.push(key)
            }))
            param = [currentPkr, start, end]
        } else {
            param = [pkrRest.PKrs, start, null]
        }


        jsonRpcReq("light_getOutsByPKr", param).then((response) => {
            // @ts-ignore
            const data = response.data;
            let rest: fetchRest = {
                utxos: null,
                again: false,
                useHashPKr: false,
                remoteNum: 0,
                nextNum: 0,
                lastBlockNumber: 0,
                txInfos: null
            }
            let hasResWithHashPkr = false
            let hasResWithOldPkr = false
            if (data.result) {
                let lastBlockNumber = start;
                const blocks = data.result.BlockOuts;
                const outs = [];
                const txInfos = [];
                let Utxos = [];
                if (blocks && blocks.length > 0) {
                    blocks.forEach(function (block, index) {
                        lastBlockNumber = Math.max(block.Num, lastBlockNumber);
                        let blockDatas = block.Data;
                        blockDatas.forEach(function (blockData, index) {
                            outs.push(blockData.Out);
                            let txInfo = blockData.TxInfo;
                            let utxos = jsuperzk.decOut(tk, [blockData.Out])
                            txInfo.Root = blockData.Out.Root;
                            let txBase: TxBase = {
                                TxHash: txInfo.TxHash,
                                TxType: TxType.in,
                                Root: blockData.Out.Root,
                                Asset: utxos[0].Asset,
                                TxHash_Root_TxType: [txInfo.TxHash, txInfo.Root, TxType.in].join("_"),
                                Num_TxHash:[txInfo.Num,txInfo.TxHash].join("_"),
                            }

                            txInfos.push(txInfo);

                            if(utxos[0].Asset && utxos[0].Asset.Tkn){
                                const cy = utils.hexToCy(utxos[0].Asset.Tkn.Currency);
                                const txCurrency : TxCurrency = {
                                    Num:txInfo.Num,
                                    TxHash:txInfo.TxHash,
                                    Currency:cy,
                                    id:[txInfo.Num,txInfo.TxHash,cy].join("_"),
                                }
                                db.get(tk).update(tables.txCurrency.name,txCurrency).then(rest => {
                                    console.log("index txCurrency success")
                                }).catch(err => {
                                    console.log(err)
                                });
                            }

                            db.get(tk).update(tables.txBase.name, txBase).then(rest => {
                                console.log("index txInfo success")
                            }).catch(err => {
                                console.log(err)
                            });
                            Utxos = Utxos.concat(utxos)
                        })
                    });
                }

                Utxos.forEach((utxo) => {
                    if (pkrRest.CurrentPKrMap.has(utxo.Pkr)) {
                        rest.again = true
                    }
                    if (!useHashPkr) {
                        if (pkrRest.PKrTypeMap.get(utxo.Pkr) === PKrType.New) {
                            hasResWithHashPkr = true
                        } else if (pkrRest.PKrTypeMap.get(utxo.Pkr) === PKrType.Old) {
                            hasResWithOldPkr = true
                        }
                    }
                })

                rest.txInfos = txInfos
                rest.utxos = Utxos;
                rest.lastBlockNumber = data.result.CurrentNum;
                rest.remoteNum = data.result.CurrentNum
                if (rest.remoteNum > end) {
                    rest.nextNum = end + 1
                } else {
                    rest.nextNum = data.result.CurrentNum + 1
                }
                if (!useHashPkr && hasResWithHashPkr && !hasResWithOldPkr) {
                    rest.useHashPKr = true
                }
            }
            console.log("fetchAndIndex result>>>> ",pkrIndex,useHashPkr,start,end,rest);
            resolve(rest)
        }).catch(reason => {
            reject(reason)
        })
    })
}


interface fetchRest {
    utxos: any
    again: boolean
    remoteNum: number
    nextNum: number
    useHashPKr: boolean
    lastBlockNumber: number
    txInfos: Array<TxInfo>
}

function jsonRpcReq(_method: string, params: any) {
    return new Promise((resolve, reject) => {
        if (!rpc) {
            reject(new Error("rpc host not set!"))
        }
        let data = {
            id: rpcId++,
            jsonrpc: "2.0",
            method: _method,
            params: params
        };
        return axios.post(rpc, data).then(response => {
            resolve(response)
        }).catch(e => {
            reject(e)
        })
    })
}


function genPKrs(tk: string, index: number, useHashPkr: boolean): { PKrTypeMap: Map<string, PKrType>, CurrentPKrMap: Map<string, boolean>, PKrs: Array<string> } {
    let pkrs = new Array()
    let pkrTypeMap = new Map<string, PKrType>();
    let currentPKrMap = new Map<string, boolean>()
    let version = 1;
    let isNew = isNewVersion(utils.toBuffer(tk));
    if (isNew) {
        version = 2
    }
    let pkrNum = 1;
    if (index > 5) {
        pkrNum = index - 5;
    }
    const pkrMain = jsuperzk.createPkrHash(tk, 1, version)
    for (let i = index; i >= pkrNum; i--) {
        const pkr = jsuperzk.createPkrHash(tk, i, version)
        pkrTypeMap.set(pkr, PKrType.New)
        pkrs.push(pkr)
        if (i === index) {
            currentPKrMap.set(pkr, true)
        }
    }
    if (pkrs.indexOf(pkrMain) === -1) {
        pkrs.push(pkrMain)
    }

    if (!isNew) {
        const pkrMainOld = jsuperzk.createOldPkrHash(tk, 1, version)
        if (!useHashPkr) {
            for (let i = index; i >= pkrNum; i--) {
                const pkrOld = jsuperzk.createOldPkrHash(tk, i, version)
                pkrTypeMap.set(pkrOld, PKrType.Old)
                pkrs.push(pkrOld)
                if (i === index) {
                    currentPKrMap.set(pkrOld, true)
                }
            }
        }
        if (pkrs.indexOf(pkrMainOld) === -1) {
            pkrs.push(pkrMainOld)
        }
    }

    return {PKrTypeMap: pkrTypeMap, CurrentPKrMap: currentPKrMap, PKrs: pkrs}
}


enum PKrType {
    New,
    Old
}


async function _checkNil(tk: string) {
    const nils = await db.get(tk).selectAll(tables.nils.name)
    let nilArr = new Array()
    // @ts-ignore
    for (let nil of nils) {
        nilArr.push(nil.Nil)
    }
    if (nilArr && nilArr.length > 0) {
        const resp = await jsonRpcReq('light_checkNil', [nilArr])
        // @ts-ignore
        if (resp && resp.data && resp.data.result) {
            // @ts-ignore
            let datas = resp.data.result
            if (datas) {
                for (let data of datas) {
                    let txInfo: TxInfo = data.TxInfo;
                    let nil: Nils = {Nil: data.Nil}
                    txInfo.TK = tk;
                    txInfo.Num_TxHash = txInfo.Num + "_" + txInfo.TxHash

                    _deletePending(db.get(tk),txInfo)

                    const nilDatas = await db.get(tk).select(tables.nils.name, nil);
                    // @ts-ignore
                    if (nilDatas && nilDatas.length > 0) {
                        // @ts-ignore
                        for (let nilData of nilDatas) {
                            await db.get(tk).delete(tables.nils.name, nil)
                            // @ts-ignore
                            const root = nilData.Root;
                            const utxos = await db.get(tk).select(tables.utxo.name, {Root: root});

                            if (utxos) {
                                let utxo = utxos[0];
                                if (utxo) {
                                    let txBase: TxBase = {
                                        TxHash: txInfo.TxHash,
                                        TxType: TxType.out,
                                        Root: root,
                                        // @ts-ignore
                                        Asset: utxo.Asset,
                                        TxHash_Root_TxType: [txInfo.TxHash, root, TxType.out].join("_"),
                                        Num_TxHash:[txInfo.Num,txInfo.TxHash].join("_"),
                                    }
                                    await db.get(tk).update(tables.txBase.name, txBase)
                                    const currency = utils.hexToCy(utxo.Asset.Tkn.Currency);
                                    const assets = await db.get(tk).select(tables.assets.name, {Currency: currency});

                                    await changeAssets(assets, utxo, db.get(tk), TxType.out);
                                    await db.get(tk).delete(tables.utxo.name, {Root: root})

                                    if(utxo.Asset && utxo.Asset.Tkn){
                                        const cy = utils.hexToCy(utxo.Asset.Tkn.Currency);
                                        const txCurrency : TxCurrency = {
                                            Num:txInfo.Num,
                                            TxHash:txInfo.TxHash,
                                            Currency:utils.hexToCy(utxo.Asset.Tkn.Currency),
                                            id:[txInfo.Num,txInfo.TxHash,cy].join("_"),
                                        }
                                        db.get(tk).update(tables.txCurrency.name,txCurrency).then(rest => {
                                            console.log("index txCurrency success")
                                        }).catch(err => {
                                            console.log(err)
                                        });
                                    }
                                }
                            }
                        }
                    }


                    await db.get(tk).update(tables.tx.name, txInfo)
                }
            }
        }
    }
}


function _setLatestSyncTime() {
    latestSyncTime = new Date().getTime();
}