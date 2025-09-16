package kotlinbook.db

import kotlinbook.User
import kotlinbook.User.Companion.fromRow
import kotlinbook.db.mapFromRow
import kotliquery.Session
import kotliquery.queryOf

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
                "passwordHash" to passwordText.toByteArray(Charsets.UTF_8)
            )
        )
    )

    return userId!!
}

fun listUsers(dbSession: Session) =
    dbSession
        .list(queryOf("SELECT * FROM user_t"), ::mapFromRow)
        .map(User::fromRow)