package kotlinbook.web.response

import com.google.gson.Gson
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.OutgoingContent
import io.ktor.http.withCharset

class KtorJsonWebResponse (
    val body: Any?,
    override val status: HttpStatusCode = HttpStatusCode.Companion.OK
) : OutgoingContent.ByteArrayContent() {
    override val contentType: ContentType = ContentType.Application.Json.withCharset(Charsets.UTF_8)

    override fun bytes() = Gson().toJson(body).toByteArray(Charsets.UTF_8)
}