import {Database, DatabaseTable} from "../db/types";

const utxoTable: DatabaseTable = {
    name: "utxo",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "Root",
            relativeIndex: "Root",
            unique: true
        },
        {
            index: "TK",
            relativeIndex: "TK",
            unique: false
        }
    ]
}

const txTable: DatabaseTable = {
    name: "tx_info",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "TxHash",
            relativeIndex: "TxHash",
            unique: true
        },
        {
            index: "Num_TxHash",
            relativeIndex: "Num_TxHash",
            unique: false
        }
    ]
}

const txBaseTable: DatabaseTable = {
    name: "tx_base",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "TxHash",
            relativeIndex: "TxHash",
            unique: false
        },
        {
            index: "TxHash_Root_TxType",
            relativeIndex: "TxHash_Root_TxType",
            unique: true
        },
        {
            index: "TxType",
            relativeIndex: "TxType",
            unique: false
        }
    ]
}

const nilsTable: DatabaseTable = {
    name: "nils",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "Nil",
            relativeIndex: "Nil",
            unique: true
        }
    ]
}

const syncInfoTable: DatabaseTable = {
    name: "sync_info",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "TK",
            relativeIndex: "TK",
            unique: true
        }
    ]
}

const assetsInfoTable: DatabaseTable = {
    name: "assets",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "Currency",
            relativeIndex: "Currency",
            unique: true
        }
    ]
}

const assetsUtxoTable: DatabaseTable = {
    name: "assets_utxo",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "RootType",
            relativeIndex: "RootType",
            unique: true
        }
    ]
}

const dbConfig: Database = {
    databaseName: "popup",
    tables: [
        utxoTable,
        nilsTable,
        txTable,
        syncInfoTable,
        txBaseTable,
        assetsInfoTable,
        assetsUtxoTable
    ],
    version: 1
}

const tables = {
    nils: nilsTable,
    utxo: utxoTable,
    tx: txTable,
    txBase: txBaseTable,
    syncInfo: syncInfoTable,
    assets:assetsInfoTable,
    assetUtxo:assetsUtxoTable,
}


// ==== asset and tx interface

export interface TxInfo {
    TK: string
    TxHash: string
    Num_TxHash: string

    BlockHash: string
    From: string
    Gas: number
    GasPrice: number
    GasUsed: number
    Num: number
    Time: number
    To: string
    State?: string

}

export interface TxBase {
    TxHash: string
    TxType: TxType
    Root: string
    TxHash_Root_TxType: string
    Asset: any
}

export interface Nils {
    Nil: string
    Root?: string
}

export interface SyncInfo {
    MainPKr: string
    PKr: string
    TK: string
    PkrIndex: number
    CurrentBlock: number
    LastCombineBlock: number
    UseHashPKr: boolean
}

export interface AssetsInfo {
    Currency: string
    Amount: string
    Frozen?: string
}


export enum TxType {
    in,
    out
}

export {
    tables, dbConfig
}


