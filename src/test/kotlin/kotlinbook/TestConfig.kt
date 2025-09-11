package kotlinbook

val testAppConfig = createAppConfig("test")
val testDataSource = createAndMigrateDataSource(testAppConfig)