package kotlinbook.web.html.tags

import kotlinx.html.FlowOrHeadingContent
import kotlinx.html.HTMLTag
import kotlinx.html.TagConsumer
import kotlinx.html.visit

class MyTag(consumer: TagConsumer<*>): HTMLTag(
    "my-tag", consumer, emptyMap(),
    inlineTag = true,
    emptyTag = false
)

fun FlowOrHeadingContent.myTag(
    block: MyTag.() -> Unit = {}
) {
    MyTag(consumer).visit(block)
}
