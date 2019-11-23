export interface Database {
    databaseName: string
    tables: Array<DatabaseTable>
    version?: number
}

export interface DatabaseTable {
    name: string
    keyPath: string
    autoIncrement: boolean
    indexes: Array<RuleIndex>
}

export interface RuleIndex {
    index: string
    relativeIndex: string
    unique?: boolean
    multiEntry?: boolean
}
