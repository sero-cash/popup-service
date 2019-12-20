"use strict";
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
        var _this = this;
        var index;
        var indexValue;
        for (var name_1 in selector) {
            index = name_1;
            indexValue = selector[name_1];
        }
        return new Promise(function (resolve, reject) {
            var selectRequest = _this.request().index(index).getAll(indexValue);
            selectRequest.onsuccess = function (e) {
                resolve(e.target.result);
            };
            selectRequest.onerror = function (e) {
                reject(e.target.result);
            };
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
        for (var name_2 in selector) {
            index = name_2;
            indexValue = selector[name_2];
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