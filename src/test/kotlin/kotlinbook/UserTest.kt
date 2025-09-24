package kotlinbook


import kotlinbook.db.getUser
import kotlinbook.db.listUsers
import kotlinbook.db.mapFromRow
import kotlinbook.util.testDataSource
import kotlinbook.util.testTx
import kotliquery.queryOf
import kotliquery.sessionOf
import java.util.Arrays
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class UserTest {
    @Test
    fun testHelloWorld() {
        assertEquals(1, 1)
    }

    @Test
    fun testCreateUser() {
        testTx {
            dbSess -> val userAId = createUser(
                dbSess,
                email = "test1@mail.com",
                name = "Test User 1",
                passwordText = "1234"
            )
            val userBId = createUser(
                dbSess,
                email = "test2@mail.com",
                name = "Test User 2",
                passwordText = "5678"
            )

            assertNotEquals(userAId, userBId)
        }
    }

    @Test
    fun testRollbackAfterTransaction() {
        testTx {
            dbSess -> val userAId = createUser(
                dbSess,
                email = "test1@mail.com",
                name = "Test User 1",
                passwordText = "1234"
            )
        }
    }

    @Test
    fun testListUsers() {
        testTx {
            dbSess ->
                val usersBefore = listUsers(dbSess)

                val userAId = createUser(dbSess,
                    email = "augustlilleaas@me.com",
                    name = "August Lilleaas",
                    passwordText = "1234"
                )

                val userBId = createUser(dbSess,
                    email = "august@augustl.com",
                    name = "August Lilleaas",
                    passwordText = "1234"
                )

                val usersAfter = listUsers(dbSess)
                assertEquals(2, usersAfter.size - usersBefore.size)
                assertNotNull(usersAfter.find {it.id == userAId})
                assertNotNull(usersAfter.find {it.id == userBId})
        }
    }

    @Test
    fun testGetUser() {
        testTx {
            dbSess ->
                val userId = createUser(
                    dbSess,
                    email = "someeamil@mail.com",
                    name = "some fella",
                    passwordText = "1234",
                    tosAccepted = true
                )

                assertNull(getUser(dbSess, -9000))

                val user = getUser(dbSess, userId)
                assertNotNull(user)
                assertEquals(user.email, "someeamil@mail.com")
        }
    }

    @Test
    fun testVerifyUserPassword() = testTx { dbSess ->
        val userId = createUser(
            dbSess,
            email = "a@b.com",
            name = "Dave Silverman",
            passwordText = "1234",
            tosAccepted = true
        )

        assertEquals(
            userId,
            authenticateUser(dbSess, "a@b.com", "1234")
        )
        assertEquals(
            null,
            authenticateUser(dbSess, "a@b.com", "incorrect")
        )
        assertEquals(
            null,
            authenticateUser(dbSess, "does@not.exist", "1234")
        )
    }

    @Test
    fun testUserPasswordSalting() = testTx { dbSess ->
        val userAId = createUser(
            dbSess,
            email = "a@b.com",
            name = "A",
            passwordText = "1234",
            tosAccepted = true
        )

        val userBId = createUser(
            dbSess,
            email = "x@b.com",
            name = "X",
            passwordText = "1234",
            tosAccepted = true
        )

        val userAHash = dbSess.single(
            queryOf("SELECT * FROM user_t WHERE id = ?", userAId),
            ::mapFromRow
        )!!["password_hash"] as ByteArray

        val userBHash = dbSess.single(
            queryOf("SELECT * FROM user_t WHERE id = ?", userBId),
            ::mapFromRow
        )!!["password_hash"] as ByteArray

        assertFalse(Arrays.equals(userAHash, userBHash))
    }
}