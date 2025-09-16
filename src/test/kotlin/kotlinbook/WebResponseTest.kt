package kotlinbook

import kotlinbook.web.response.TextWebResponse
import kotlin.test.assertEquals
import kotlin.test.BeforeTest
import kotlin.test.Test

class WebResponseTest {
    private lateinit var textResponse: TextWebResponse

    @BeforeTest
    fun setUp() {
        textResponse = TextWebResponse("body")
    }

    @Test
    fun testHeaders() {
        textResponse = textResponse.appendHeader("my-header", "value") as TextWebResponse
        textResponse = textResponse.appendHeader("My-Header", "Value") as TextWebResponse

        val newHeaders: Map<String, List<String>> = textResponse.headers()
        assertEquals(mapOf("my-header" to listOf("value", "Value")), newHeaders)
    }
}
