application {
    mainClass = "kotlinbook.MainSpringSecurityKt"
}

plugins {
    kotlin("jvm") version "2.0.21"
    application
    id("com.github.johnrengelman.shadow") version "7.1.2"
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
    implementation("org.postgresql:postgresql:42.6.0")
    implementation("org.flywaydb:flyway-core:9.5.1")
    implementation("com.github.seratch:kotliquery:1.9.0")
    implementation("io.ktor:ktor-client-core:2.1.2")
    implementation("io.ktor:ktor-client-cio:2.1.2")
    implementation("io.arrow-kt:arrow-fx-coroutines:1.1.2")
    implementation("io.arrow-kt:arrow-fx-stm:1.1.2")
    implementation("io.ktor:ktor-server-html-builder:2.1.2")
    implementation("at.favre.lib:bcrypt:0.9.0")
    implementation("io.ktor:ktor-server-auth:2.1.2")
    implementation("io.ktor:ktor-server-sessions:2.1.2")
    implementation("io.ktor:ktor-server-forwarded-header:2.1.2")
    implementation("org.springframework:spring-context:5.3.23")
    implementation("io.ktor:ktor-server-servlet:2.1.2")
    implementation("org.eclipse.jetty:jetty-server:9.4.49.v20220914")
    implementation("org.eclipse.jetty:jetty-servlet:9.4.49.v20220914")
    implementation("org.springframework.security:spring-security-web:5.7.3")
    implementation("org.springframework.security:spring-security-config:5.7.3")
    implementation("org.springframework:spring-context:5.3.23")
    implementation("io.ktor:ktor-server-servlet:2.1.2")
    implementation("org.eclipse.jetty:jetty-server:9.4.49.v20220914")
    implementation("org.eclipse.jetty:jetty-servlet:9.4.49.v20220914")
    implementation("org.springframework.security:spring-security-web:5.7.3")
    implementation("org.springframework.security:spring-security-config:5.7.3")
}

tasks.test {
    useJUnitPlatform()
}

val frontendDir = layout.projectDirectory.dir("frontend")
val frontendPackageJson = frontendDir.file("package.json")
val frontendDistDir = frontendDir.dir("dist")
val publicAssetsDir = layout.projectDirectory.dir("src/main/resources/public")

val frontendInstall by tasks.registering(Exec::class) {
    workingDir(frontendDir)
    commandLine("npm", "install")
    inputs.file(frontendPackageJson)
    outputs.dir(frontendDir.dir("node_modules"))
    onlyIf { frontendPackageJson.asFile.exists() }
}

val frontendBuild by tasks.registering(Exec::class) {
    dependsOn(frontendInstall)
    workingDir(frontendDir)
    commandLine("npm", "run", "build")
    inputs.file(frontendPackageJson)
    inputs.file(frontendDir.file("vite.config.js"))
    inputs.file(frontendDir.file("index.html"))
    inputs.dir(frontendDir.dir("src"))
    outputs.dir(frontendDistDir)
    onlyIf { frontendPackageJson.asFile.exists() }
}

val buildFrontend by tasks.registering(Copy::class) {
    dependsOn(frontendBuild)
    from(frontendDistDir)
    into(publicAssetsDir)
    doFirst {
        delete(
            publicAssetsDir.file("index.html"),
            publicAssetsDir.dir("assets")
        )
    }
    onlyIf { frontendPackageJson.asFile.exists() }
}

tasks.named("processResources") {
    dependsOn(buildFrontend)
}

tasks.withType<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar> {
    mergeServiceFiles()
}
