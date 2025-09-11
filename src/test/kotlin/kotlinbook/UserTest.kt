package kotlinbook

import kotlinbook.util.testDataSource
import kotlinbook.util.testTx
import kotliquery.sessionOf
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

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
}