package kotlinbook.util

val testAppConfig = _root_ide_package_.kotlinbook.createAppConfig("test")
val testDataSource = _root_ide_package_.kotlinbook.db.datasource.createAndMigrateDataSource(testAppConfig)