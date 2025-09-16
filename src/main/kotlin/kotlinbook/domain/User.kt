package kotlinbook.domain

import java.nio.ByteBuffer
import java.time.OffsetDateTime
import java.time.ZonedDateTime

data class User(
    val id: Long,
    val createdAt: ZonedDateTime,
    val updatedAt: ZonedDateTime,
    val email: String,
    val tosAccepted: Boolean,
    val name: String?,
    val passwordHash: ByteBuffer
) {
    companion object {
        fun fromRow(row: Map<String, Any?>) = User(
            id = row["id"] as Long,
            createdAt = (row["created_at"] as OffsetDateTime)
                .toZonedDateTime(),
            updatedAt = (row["updated_at"] as OffsetDateTime)
                .toZonedDateTime(),
            email = row["email"] as String,
            name = row["name"] as? String,
            tosAccepted = row["tos_accepted"] as Boolean,
            passwordHash = ByteBuffer.wrap(
                row["password_hash"] as ByteArray
            )
        )
    }
}