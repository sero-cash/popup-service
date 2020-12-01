"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utxoTable = {
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
};
var utxoTktTable = {
    name: "utxo_tkt",
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
};
var ticketsTable = {
    name: "tickets",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "Root",
            relativeIndex: "Root",
            unique: true
        },
        {
            index: "Value",
            relativeIndex: "Value",
            unique: false
        }
    ]
};
var txTable = {
    name: "tx_info",
    keyPath: "id",
    autoIncrement: true,
    indexes: [
        {
            index: "TxHash",
            relativeIndex: "TxHash",
            unique: false
        },
        {
            index: "Num_TxHash",
            relativeIndex: "Num_TxHash",
            unique: true
        },
        {
            index: "Num",
            relativeIndex: "Num",
            unique: false
        }
    ]
};
var txCurrencyTable = {
    name: "tx_currency",
    keyPath: "id",
    autoIncrement: false,
    indexes: [
        {
            index: "TxHash",
            relativeIndex: "TxHash",
            unique: false
        },
        {
            index: "Currency",
            relativeIndex: "Currency",
            unique: false
        },
        {
            index: "Num",
            relativeIndex: "Num",
            unique: false
        }
    ]
};
var txBaseTable = {
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
            index: "Num_TxHash",
            relativeIndex: "Num_TxHash",
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
};
var nilsTable = {
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
};
var syncInfoTable = {
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
};
var assetsInfoTable = {
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
};
var assetsUtxoTable = {
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
};
var dbConfig = {
    databaseName: "popup",
    tables: [
        utxoTable,
        utxoTktTable,
        ticketsTable,
        nilsTable,
        txTable,
        syncInfoTable,
        txBaseTable,
        assetsInfoTable,
        assetsUtxoTable,
        txCurrencyTable,
    ],
    version: 4
};
exports.dbConfig = dbConfig;
var tables = {
    nils: nilsTable,
    utxo: utxoTable,
    utxoTkt: utxoTktTable,
    tickets: ticketsTable,
    tx: txTable,
    txBase: txBaseTable,
    syncInfo: syncInfoTable,
    assets: assetsInfoTable,
    assetUtxo: assetsUtxoTable,
    txCurrency: txCurrencyTable,
};
exports.tables = tables;
var TxType;
(function (TxType) {
    TxType[TxType["in"] = 0] = "in";
    TxType[TxType["out"] = 1] = "out";
})(TxType = exports.TxType || (exports.TxType = {}));
//# sourceMappingURL=tables.js.map