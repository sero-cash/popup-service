import {assetsWorker} from './worker/assets'
import {initParam} from "./core/service";
import {Message, Method, Tx} from "./core/types";

class PopupService {

    callbackHandler: Map<number, any>;
    messageId: number

    constructor() {
        this.callbackHandler = new Map<number, any>();
        this.messageId = 0;
        let that = this;
        assetsWorker.onmessage = function (event) {
            let msg = event.data;
            let cb = that.callbackHandler.get(msg.messageId);

            console.log("popservice send msg >>>>>>>> ", msg)
            that.callbackHandler.delete(msg.messageId);
            if (cb && typeof cb === "function") {
                cb(msg);
            }
        }
    }

    init(_rpc: string, _syncTime: number, cb: any) {
        let initParams: initParam = {rpc: _rpc, syncTime: _syncTime}
        let message: Message = {method: Method.Init, data: initParams}
        this.handlerMsg(message, cb);
    }

    initAccount(tk: string, cb: any) {
        let message: Message = {method: Method.InitAccount, data: tk}
        this.handlerMsg(message, cb);
    }

    balanceOf(tk: string, cb: any) {
        let message: Message = {method: Method.BalanceOf, data: tk}
        this.handlerMsg(message, cb);
    }


    getTxList(query:any, cb: any) {
        let message: Message = {method: Method.GetTxList, data: query}
        this.handlerMsg(message, cb);
    }

    getTxDetail(tk: string, hash: string, cb: any) {
        let message: Message = {method: Method.GetTxDetail, data: {tk: tk, hash: hash}}
        this.handlerMsg(message, cb);
    }

    getPKrIndex(tk: string, cb: any) {
        let message: Message = {method: Method.GetPKrIndex, data: tk}
        this.handlerMsg(message, cb);
    }

    commitTx(tx: Tx, cb: any) {

        let message: Message = {method: Method.CommitTx, data: tx}
        console.log("commitTx message", message)
        this.handlerMsg(message, cb);
    }

    getSeroPrice(ticket: string, cb: any) {
        let message: Message = {method: Method.GetPrice, data: ticket}
        this.handlerMsg(message, cb)
    }

    handlerMsg(message: Message, cb: any) {
        if (cb) {
            const messageId = this.messageId++;
            message.messageId = messageId;
            assetsWorker.postMessage(message);
            this.callbackHandler.set(messageId, cb)
        }
    }
}

export {
    PopupService
}

