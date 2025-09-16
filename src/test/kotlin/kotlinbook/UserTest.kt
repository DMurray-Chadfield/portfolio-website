package kotlinbook

import kotlinbook.util.testDataSource
import kotlinbook.util.testTx
import kotliquery.sessionOf
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull

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
}