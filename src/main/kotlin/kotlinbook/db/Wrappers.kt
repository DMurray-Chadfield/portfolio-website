package kotlinbook.db

import kotlinbook.domain.User
import kotliquery.Session
import kotliquery.queryOf

fun listUsers(dbSession: Session) =
    dbSession
        .list(queryOf("SELECT * FROM user_t"), ::mapFromRow)
        .map(User::fromRow)

fun getUser(dbSess: Session, id: Long): User? {
    return dbSess
        .single(
            queryOf("SELECT * FROM user_t WHERE id = ?", id),
            ::mapFromRow
        )
        ?.let(User::fromRow)
}