"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Table_1 = require("./Table");
// declare const window: any;
var PopDB = /** @class */ (function () {
    function PopDB(config) {
        var databaseName = config.databaseName, tables = config.tables;
        this.name = databaseName;
        this.tables = tables;
        this.createTable(this.tables);
    }
    PopDB.prototype.createDateBase = function (name, version) {
        if (version === void 0) { version = 1; }
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.openedDB = indexedDB.open(name, version);
    };
    PopDB.prototype.createTable = function (tables, version) {
        var _this = this;
        if (version === void 0) { version = 1; }
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var conn_request = indexedDB.open(this.name, version);
        conn_request.onupgradeneeded = function (ev) {
            var db = ev.target.result;
            tables.forEach(function (table) {
                var hadTableNames = Array.from(db.objectStoreNames);
                if (!hadTableNames.includes(table.name)) {
                    var table_info_1 = db.createObjectStore(table.name, {
                        keyPath: table.keyPath,
                        autoIncrement: table.autoIncrement
                    });
                    table.indexes.forEach(function (item) {
                        _this.createIndex(table_info_1, item);
                    });
                }
            });
        };
    };
    PopDB.prototype.deleteTable = function (tableName, version) {
        // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.indexedDB
        var conn_request = indexedDB.open(this.name, version);
        conn_request.onupgradeneeded = function (ev) {
            var db = ev.target.result;
            if (ev.oldVersion < version) {
                db.deleteObjectStore(tableName);
            }
        };
    };
    // create index
    PopDB.prototype.createIndex = function (table, option) {
        var optionPramas = {};
        if (option.unique) {
            optionPramas["unique"] = option.unique;
        }
        if (option.multiEntry) {
            optionPramas["multiEntry"] = option.multiEntry;
        }
        table.createIndex(option.index, option.relativeIndex, optionPramas);
    };
    PopDB.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // const indb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
            var conn_request = indexedDB.open(_this.name, _this.version);
            conn_request.onsuccess = function (ev) {
                resolve(ev.target.result);
            };
            conn_request.onerror = function (ev) {
                reject(ev);
            };
        });
    };
    PopDB.prototype.close = function () {
        this.connect().then(function (db) {
            db.close();
        });
    };
    PopDB.prototype.insert = function (name, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.insert(data).then(resolve).catch(reject);
            });
        });
    };
    PopDB.prototype.select = function (name, selecter) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.select(selecter).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        });
    };
    PopDB.prototype.selectId = function (name, id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.selectId(id).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        });
    };
    PopDB.prototype.some = function (name, selecter, count) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.some(selecter, count).then(function (res) {
                    resolve(res);
                }).catch(function (error) {
                    reject(error);
                });
            });
        });
    };
    PopDB.prototype.update = function (name, data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.update(data).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    // reject(err)
                    console.log(err);
                    resolve(null);
                });
            });
        });
    };
    PopDB.prototype.delete = function (name, data) {
        var _this = this;
        console.log("delete >>>> ", name, data);
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.delete(data).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    console.log(err);
                    resolve(null);
                });
            });
        });
    };
    PopDB.prototype.selectAll = function (name) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.selectAll().then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    reject(err);
                });
            });
        });
    };
    PopDB.prototype.clearTable = function (name) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (db) {
                var table = new Table_1.Table(name, db);
                table.clear().then(function (res) {
                    resolve(res);
                }).catch(function (error) {
                    reject(error);
                });
            });
        });
    };
    return PopDB;
}());
exports.PopDB = PopDB;
