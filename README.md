# Dan's Portfolio Website

This is a website I am building in Kotlin, following *Pro Kotlin Webapps from Scratch* by August Lilleaas.
It is currently a just a pet project but will one day hopefully serve as a portfolio for any other coding projects I build.

## Table of Contents

*   [Installation](#installation)
*   [For developers](#for-developers)

## Installation

### Requirements
- jdk 17 or later
- gradle

The project uses gradle as its build system. Currently, to run just requires running the main clas. This can be done
using your IDE, or with gradle by running
```bash
./gradlew run
```
from the project root.

Switch between environment types using the `KOTLINBOOK_ENV` env variable, setting to either
`local` or `production`. If none is set, it will default to `local`.

## For developers
### Migration issues
If a migration fails, there are two general ways you will want to solve it
#### Rerunning a migration
After manually reverting a failed migration, and fixing the migration script, in order to make flyway forget that
migration has been run, you will need to execute:
```sql
DELETE FROM flyway_schema_history WHERE version = ${version};
```
where ${version} is the version number of the migration you want to rerun.
#### Finishing the migration manually
After manually running sql to finish a failed migration, in order to make flyway think the migration was successful,
you will need to execute:
```sql
UPDATE flyway_schema_history SET success = true WHERE version = ${version};
```
where ${version} is the version number of the migration you want to rerun.