package kotlinbook.db

import kotliquery.Row

fun mapFromRow(row: Row): Map<String, Any?> {
    return row.underlying.metaData
        .let {
            (1..it.columnCount).map(it::getColumnName)
        }
        .map {
            it to row.anyOrNull(it)
        }
        .toMap()
}