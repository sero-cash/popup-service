"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./core/types");
var assetsWorker;
var PopupService = /** @class */ (function () {
    function PopupService() {
        this.callbackHandler = new Map();
        this.messageId = 0;
        // @ts-ignore
        assetsWorker = new Worker('./core/service.js', { type: 'module' });
        var that = this;
        assetsWorker.onmessage = function (event) {
            var msg = event.data;
            if (msg && msg.type === "ServiceLog") {
                console.log("<div class='log'><span>" + msg.operator + "&nbsp;&gt;</span>&nbsp;<span>" + msg.content + "</span></div>");
            }
            else {
                var cb = that.callbackHandler.get(msg.messageId);
                that.callbackHandler.delete(msg.messageId);
                if (cb && typeof cb === "function") {
                    cb(msg);
                }
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
    PopupService.prototype.ticketsOf = function (tk, cb) {
        var message = { method: types_1.Method.TicketsOf, data: tk };
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
        // console.log("commitTx message", message)
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getSeroPrice = function (ticket, cb) {
        var message = { method: types_1.Method.GetPrice, data: ticket };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.clearData = function (tk, cb) {
        var message = { method: types_1.Method.ClearData, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getSyncState = function (tk, cb) {
        var message = { method: types_1.Method.HealthyCheck, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.getPendingAndConfirming = function (tk, cb) {
        var message = { method: types_1.Method.GetPendingAndConfirming, data: tk };
        this.handlerMsg(message, cb);
    };
    PopupService.prototype.handlerMsg = function (message, cb) {
        if (cb) {
            var messageId = this.messageId++;
            message.messageId = messageId;
            assetsWorker.postMessage(message);
            this.callbackHandler.set(messageId, cb);
        }
    };
    return PopupService;
}());
exports.PopupService = PopupService;
//# sourceMappingURL=index.js.map