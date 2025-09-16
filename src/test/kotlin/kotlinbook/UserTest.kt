package kotlinbook

import kotlinbook.db.createUser
import kotlinbook.db.getUser
import kotlinbook.db.listUsers
import kotlinbook.util.testDataSource
import kotlinbook.util.testTx
import kotliquery.sessionOf
import kotlin.test.Test
import kotlin.test.assertEquals
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
}