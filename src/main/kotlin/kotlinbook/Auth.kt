package kotlinbook

import at.favre.lib.crypto.bcrypt.BCrypt
import io.ktor.server.auth.Principal
import io.ktor.util.hex
import kotlinbook.db.mapFromRow
import kotliquery.Session
import kotliquery.queryOf
import java.security.SecureRandom

val bcryptHasher = BCrypt.withDefaults()
val bcryptVerifier = BCrypt.verifyer()

fun authenticateUser(
    dbSession: Session,
    email: String,
    passwordText: String
): Long? {
    return dbSession.single(
        queryOf("SELECT * FROM user_t WHERE email = ?", email),
        ::mapFromRow
    )?.let {
        val pwHash = it["password_hash"] as ByteArray

        return if (bcryptVerifier.verify(
                passwordText.toByteArray(Charsets.UTF_8),
                pwHash
            ).verified)
        {
            it["id"] as Long
        } else {
            null
        }
    }
}

fun createUser(
    dbSession: Session,
    email: String,
    name: String,
    passwordText: String,
    tosAccepted: Boolean = false
): Long {
    val userId = dbSession.updateAndReturnGeneratedKey(
        queryOf(
            """
                INSERT INTO user_t (email, name, tos_accepted, password_hash)
                VALUES (:email, :name, :tosAccepted, :passwordHash)
            """,
            mapOf(
                "email" to email,
                "name" to name,
                "tosAccepted" to tosAccepted,
                "passwordHash" to bcryptHasher.hash(
                    10,
                    passwordText.toByteArray(Charsets.UTF_8)
                )
            )
        )
    )

    return userId!!
}

fun getRandomBytesHex(length: Int) =
    ByteArray(length)
        .also { SecureRandom().nextBytes(it) }
        .let(::hex)

fun passwordToHash(password: String) =
    hex(
        bcryptHasher.hash(
        12,
        password.toByteArray(Charsets.UTF_8)
    )
)

data class UserSession(val userId: Long): Principal