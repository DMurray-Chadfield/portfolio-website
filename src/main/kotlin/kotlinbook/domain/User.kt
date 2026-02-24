package kotlinbook.domain

import java.nio.ByteBuffer
import java.sql.Timestamp
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.ZonedDateTime

data class User(
    val id: Long? = null,
    val createdAt: ZonedDateTime? = null,
    val updatedAt: ZonedDateTime? = null,
    val email: String,
    val tosAccepted: Boolean? = null,
    val name: String? = null,
    val passwordHash: ByteBuffer? = null,
    val password: String? = null
) {
    companion object {
        private fun Any?.toZoned(): ZonedDateTime? = when (this) {
            is OffsetDateTime -> this.toZonedDateTime()
            is Timestamp -> this.toInstant().atZone(ZoneOffset.UTC)
            null -> null
            else -> throw IllegalArgumentException(
                "Unexpected timestamp type: ${this.javaClass}"
            )
        }

        fun fromRow(row: Map<String, Any?>) = User(
            id = row["id"] as Long,
            createdAt = row["created_at"].toZoned(),
            updatedAt = row["updated_at"].toZoned(),
            email = row["email"] as String,
            name = row["name"] as? String,
            tosAccepted = row["tos_accepted"] as Boolean,
            passwordHash = ByteBuffer.wrap(
                row["password_hash"] as ByteArray
            )
        )
    }
}