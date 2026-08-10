package com.example.homeschoolapp.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "media_attachments",
    foreignKeys = [
        ForeignKey(
            entity = DailyLog::class,
            parentColumns = ["logId"],
            childColumns = ["logId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("logId")
    ]
)
data class MediaAttachment(
    @PrimaryKey(autoGenerate = true) val mediaId: Long = 0,
    val logId: Long,
    val uri: String, // URI string to the file
    val mimeType: String, // e.g., "image/jpeg", "video/mp4"
    val description: String? = null
)
