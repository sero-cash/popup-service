//=== message
export interface Message {
    messageId?: number,
    method: Method
    data: any
    error?: any

}

//
// export interface Error {
//     code: ErrorCode
//     msg: string
// }

// export enum ErrorCode {
//     success,
//     fail
// }

export enum Method {
    Init = "init",
    BalanceOf = "balanceOf",
    HealthyCheck = "healthyCheck",
    InitAccount = "initAccount",
    ClearData = "clearData",
    FindUtxos = "findUtxos",
    TicketsOf = "ticketsOf",
    GetTxList = "getTxList",
    GetTxDetail = "getTxDetail",
    GetPKrIndex = "getPKrIndex",
    CommitTx = "commitTx",
    GetPrice = "getPrice",
    GetPendingAndConfirming = "getPendingAndConfirming"
}


export interface Tx {
    From: string
    To: string
    Cy: string
    Value: string
    Data: string
    Gas: string
    GasPrice: string
    SK: string
    FeeCy?:string
    Tkts?:Map<string,string>
    BuyShare:BuyShareCmd
    FeeValue?:string
}

export interface BuyShareCmd {
    Value:string
    Vote:string
    Pool:string
}

export interface PriceTickect{
    quoteVolume: string
    baseVolume: string
    highestBid: string
    high24hr: string
    last: string
    lowestAsk: string
    elapsed: string
    result: string
    low24hr: string
    percentChange: string
}