package kotlinbook.web.response

sealed class WebResponse {
    abstract val statusCode: Int
    abstract val headers: Map<String, List<String>>

    abstract fun copyResponse(
        statusCode: Int,
        headers: Map<String, List<String>>
    ) : WebResponse

    fun appendHeader(headerName: String, headerValue: String) = appendHeader(headerName, listOf(headerValue))

    fun appendHeader(
        headerName: String,
        headerValue: List<String>
    ) = copyResponse(
        statusCode,
        headers.plus(
            Pair(
                headerName,
                headers.getOrDefault(
                    headerName,
                    listOf()
                ).plus(headerValue)
            )
        )
    )

    fun headers(): Map<String, List<String>> = headers
        .map{it.key.lowercase() to it.value}
        .fold(mapOf()) {res, (k, v) ->
            res.plus(
                (
                        Pair(
                            k,
                            res.getOrDefault(k, listOf()).plus(v)
                        )
                        )
            )
        }
}