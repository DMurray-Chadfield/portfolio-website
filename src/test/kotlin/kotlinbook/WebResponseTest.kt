package kotlinbook

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class WebResponseTest {
    private lateinit var textResponse: TextWebResponse

    @BeforeEach
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
