application {
    mainClass = "kotlinbook.MainKt"
}

plugins {
    kotlin("jvm") version "2.0.21"
    application
}

group = "com.danmc"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation("io.ktor:ktor-server-core:2.1.2")
    implementation("io.ktor:ktor-server-netty:2.1.2")
    implementation("ch.qos.logback:logback-classic:1.4.4")
    implementation("org.slf4j:slf4j-api:2.0.3")
    implementation("io.ktor:ktor-server-status-pages:2.1.2")
    implementation("com.typesafe:config:1.4.2")
    implementation("com.google.code.gson:gson:2.10")
    implementation("com.zaxxer:HikariCP:5.0.1")
    implementation("com.h2database:h2:2.1.214")
    implementation("org.flywaydb:flyway-core:9.5.1")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(11)
}