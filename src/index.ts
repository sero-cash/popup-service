import {initParam} from "./core/service";
import {Message, Method, Tx} from "./core/types";

let assetsWorker;

class PopupService {

    callbackHandler: Map<number, any>;
    messageId: number

    constructor() {
        this.callbackHandler = new Map<number, any>();
        this.messageId = 0;

        // @ts-ignore
        assetsWorker = new Worker('./core/service.js', {type: 'module'});

        let that = this;
        assetsWorker.onmessage = function (event) {
            let msg = event.data;
            if(msg && msg.type === "ServiceLog"){
                console.log(`<div class='log'><span>${msg.operator}&nbsp;&gt;</span>&nbsp;<span>${msg.content}</span></div>`)
            }else{
                let cb = that.callbackHandler.get(msg.messageId);
                that.callbackHandler.delete(msg.messageId);
                if (cb && typeof cb === "function") {
                    cb(msg);
                }
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

    ticketsOf(tk: string, cb: any) {
        let message: Message = {method: Method.TicketsOf, data: tk}
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
        // console.log("commitTx message", message)
        this.handlerMsg(message, cb);
    }

    getSeroPrice(ticket: string, cb: any) {
        let message: Message = {method: Method.GetPrice, data: ticket}
        this.handlerMsg(message, cb)
    }

    clearData(tk: string, cb: any) {
        let message: Message = {method: Method.ClearData, data: tk}
        this.handlerMsg(message, cb)
    }

    getSyncState(tk: string,cb: any){
        let message: Message = {method: Method.HealthyCheck, data: tk}
        this.handlerMsg(message, cb)
    }

    getPendingAndConfirming(tk:string,cb:any){
        let message: Message = {method: Method.GetPendingAndConfirming, data: tk}
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

