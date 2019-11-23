"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assets_1 = require("./worker/assets");
var types_1 = require("./core/types");
var PopupService = /** @class */ (function () {
    function PopupService() {
        this.callbackHandler = new Map();
        this.messageId = 0;
        var that = this;
        assets_1.assetsWorker.onmessage = function (event) {
            var msg = event.data;
            var cb = that.callbackHandler.get(msg.messageId);
            console.log("popservice send msg >>>>>>>> ", msg);
            that.callbackHandler.delete(msg.messageId);
            if (cb && typeof cb === "function") {
                cb(msg);
            }
        };
    }
    PopupService.prototype.init = function (_rpc, _syncTime, cb) {
        var initParams = { rpc: _rpc, syncTime: _syncTime };
        var message = { method: types_1.Method.Init, data: initParams };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.initAccount = function (tk, cb) {
        var message = { method: types_1.Method.InitAccount, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.balanceOf = function (tk, cb) {
        var message = { method: types_1.Method.BalanceOf, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getTxList = function (query, cb) {
        var message = { method: types_1.Method.GetTxList, data: query };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getTxDetail = function (tk, hash, cb) {
        var message = { method: types_1.Method.GetTxDetail, data: { tk: tk, hash: hash } };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getPKrIndex = function (tk, cb) {
        var message = { method: types_1.Method.GetPKrIndex, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.commitTx = function (tx, cb) {
        var message = { method: types_1.Method.CommitTx, data: tx };
        console.log("commitTx message", message);
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getSeroPrice = function (ticket, cb) {
        var message = { method: types_1.Method.GetPrice, data: ticket };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.handlerMsg = function (message, cb) {
        if (cb) {
            var messageId = this.messageId++;
            message.messageId = messageId;
            assets_1.assetsWorker.postMessage(message);
            this.callbackHandler.set(messageId, cb);
        }
    };
    return PopupService;
}());
exports.PopupService = PopupService;
