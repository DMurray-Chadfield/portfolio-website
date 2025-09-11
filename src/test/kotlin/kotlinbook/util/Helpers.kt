package kotlinbook.util

import kotliquery.TransactionalSession
import kotliquery.sessionOf

fun testTx(
    handler: (dbSess: TransactionalSession) -> Unit
) {
    sessionOf(
        testDataSource,
        returnGeneratedKey = true
    ).use {
        dbSess -> dbSess.transaction {
            dbSessTx -> try {
                handler(dbSessTx)
            } finally {
                dbSessTx.connection.rollback()
            }
        }
    }
}