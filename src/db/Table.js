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
var Table = /** @class */ (function () {
    function Table(name, db) {
        this.name = name;
        this.db = db;
    }
    // create transaction
    Table.prototype.transaction = function (mode) {
        if (mode === void 0) { mode = true; }
        return this.db.transaction([this.name], mode === true ? 'readwrite' : 'readonly');
    };
    // open or conntect this table
    Table.prototype.request = function () {
        return this.transaction().objectStore(this.name);
    };
    // get
    Table.prototype.select = function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var index_1, value_1, name_1, rets, _a, _b, _i, name_2, rest, retTmp, _c, rets_1, datas, _d, datas_1, data, f, name_3;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!(Object.keys(selector).length == 1)) return [3 /*break*/, 1];
                        for (name_1 in selector) {
                            index_1 = name_1;
                            value_1 = selector[name_1];
                        }
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var selectRequest = _this.request().index(index_1).getAll(value_1);
                                selectRequest.onsuccess = function (e) {
                                    resolve(e.target.result);
                                };
                                selectRequest.onerror = function (e) {
                                    reject(e.target.result);
                                };
                            })];
                    case 1:
                        rets = [];
                        _a = [];
                        for (_b in selector)
                            _a.push(_b);
                        _i = 0;
                        _e.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        name_2 = _a[_i];
                        return [4 /*yield*/, this._iSelect(name_2, selector[name_2])];
                    case 3:
                        rest = _e.sent();
                        rets.push(rest);
                        _e.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        retTmp = [];
                        for (_c = 0, rets_1 = rets; _c < rets_1.length; _c++) {
                            datas = rets_1[_c];
                            for (_d = 0, datas_1 = datas; _d < datas_1.length; _d++) {
                                data = datas_1[_d];
                                f = true;
                                for (name_3 in selector) {
                                    if (data[name_3] != selector[name_3]) {
                                        f = false;
                                        break;
                                    }
                                }
                                if (f) {
                                    retTmp.push(data);
                                }
                            }
                        }
                        return [2 /*return*/, retTmp];
                }
            });
        });
    };
    Table.prototype._iSelect = function (index, value) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var selectRequest = _this.request().index(index).getAll(value);
                        selectRequest.onsuccess = function (e) {
                            resolve(e.target.result);
                        };
                        selectRequest.onerror = function (e) {
                            reject(e.target.result);
                        };
                    })];
            });
        });
    };
    Table.prototype.selectId = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var selectRequest = _this.request().get(id);
            selectRequest.onsuccess = function (e) {
                resolve(e.target.result);
            };
            selectRequest.onerror = function (e) {
                reject(e.target.result);
            };
        });
    };
    Table.prototype.selectAll = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var selectRequest = _this.request().getAll();
            selectRequest.onsuccess = function (e) {
                resolve(e.target.result);
            };
            selectRequest.onerror = function (e) {
                reject(e.target.result);
            };
        });
    };
    // some
    Table.prototype.some = function (selector, count) {
        var _this = this;
        var index;
        var indexValue;
        for (var name_4 in selector) {
            index = name_4;
            indexValue = selector[name_4];
        }
        // console.log("some>>>>>",selector,count);
        return new Promise(function (resolve, reject) {
            var temp = [];
            var cursor = _this.request().index(index);
            // const range = IDBKeyRange.lowerBound("_")
            cursor.openCursor(indexValue, "prev").onsuccess = function (ev) {
                var res = ev.target.result;
                // console.log("res>>>>>",res);
                if (res) {
                    temp.push(res.value);
                    if (temp.length < count) {
                        res.continue();
                    }
                    else {
                        resolve(temp);
                    }
                }
                else {
                    resolve(temp);
                }
            };
        });
    };
    // put
    Table.prototype.update = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var updateRequest = _this.request().put(data);
            updateRequest.onsuccess = function (e) {
                resolve(e);
            };
            updateRequest.onerror = function (e) {
                reject(e);
            };
        });
    };
    // add
    Table.prototype.insert = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var addRequest = _this.request().add(data);
            addRequest.onsuccess = function (e) {
                resolve(e);
            };
            addRequest.onerror = function (e) {
                reject(e);
            };
        });
    };
    // get -> delete
    Table.prototype.delete = function (selector) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.select(selector).then(function (res) {
                if (res.length) {
                    res.forEach(function (item, index, arr) {
                        var request = _this.request();
                        var keyPath = request.keyPath;
                        var deleteRequest = request.delete(item[keyPath]);
                        deleteRequest.onsuccess = function (e) {
                            if (index === arr.length - 1) {
                                resolve(e);
                            }
                        };
                        deleteRequest.onerror = function (e) {
                            reject(e);
                        };
                    });
                }
                else {
                    resolve(true);
                }
            }).catch(function (e) {
                reject(e);
            });
        });
    };
    Table.prototype.clear = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var deleteRequest = _this.request().clear();
            deleteRequest.onsuccess = function (e) {
                resolve(e);
            };
            deleteRequest.onerror = function (e) {
                reject(e);
            };
        });
    };
    return Table;
}());
exports.Table = Table;
//# sourceMappingURL=Table.js.map