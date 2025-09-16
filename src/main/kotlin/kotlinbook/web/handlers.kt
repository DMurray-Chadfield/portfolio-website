package kotlinbook.web

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.call
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.util.pipeline.PipelineContext
import io.ktor.util.pipeline.PipelineInterceptor
import kotlinbook.web.response.KtorJsonWebResponse
import kotlinbook.web.response.WebResponse
import kotlinbook.web.response.JsonWebResponse
import kotlinbook.web.response.TextWebResponse
import kotliquery.Session
import kotliquery.TransactionalSession
import kotliquery.sessionOf
import javax.sql.DataSource
import kotlin.collections.component1
import kotlin.collections.component2
import kotlin.collections.iterator

fun webResponse(
    handler: suspend PipelineContext<Unit, ApplicationCall>.() -> WebResponse
): PipelineInterceptor<Unit, ApplicationCall> {
    return {
        val resp = this.handler()
        for ((name, values) in resp.headers())
            for (value in values)
                call.response.header(name, value)

        val statusCode = HttpStatusCode.fromValue(resp.statusCode)

        when (resp) {
            is TextWebResponse -> {
                call.respondText(
                    text = resp.body,
                    status = statusCode
                )
            }
            is JsonWebResponse -> {
                call.respond(KtorJsonWebResponse (
                    body = resp.body,
                    status = statusCode
                ))
            }
        }
    }
}

fun webResponseDb(
    dataSource: DataSource,
    handler: suspend PipelineContext<Unit, ApplicationCall>.(
        dbSess: Session
    ) -> WebResponse
) = webResponse {
    sessionOf(
        dataSource,
        returnGeneratedKey = true
    ).use { dbSess ->
        handler(dbSess)
    }
}

fun webResponseTx(
    dataSource: DataSource,
    handler: suspend PipelineContext<Unit, ApplicationCall>.(
        dbSess: TransactionalSession
    ) -> WebResponse) = webResponseDb(dataSource) {
        dbSess -> dbSess.transaction{
        txSess -> handler(txSess)
}
}