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
var Table_1 = require("./Table");
// declare const window: any;
var PopDB = /** @class */ (function () {
    function PopDB(config) {
        var databaseName = config.databaseName, tables = config.tables, version = config.version;
        this.name = databaseName;
        this.tables = tables;
        this.createTable(this.tables, version);
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
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.connect().then(function (db) {
                            var table = new Table_1.Table(name, db);
                            table.update(data).then(function (res) {
                                resolve(res);
                            }).catch(function (err) {
                                // reject(err)
                                console.log(name, data);
                                console.log(err);
                                resolve(true);
                            });
                        });
                    })];
            });
        });
    };
    PopDB.prototype.delete = function (name, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // console.log("delete >>>> ",name,data);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.connect().then(function (db) {
                            var table = new Table_1.Table(name, db);
                            table.delete(data).then(function (res) {
                                resolve(res);
                            }).catch(function (err) {
                                console.log(name, data);
                                console.log(err);
                                resolve(true);
                            });
                        });
                    })];
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
//# sourceMappingURL=PopDB.js.map