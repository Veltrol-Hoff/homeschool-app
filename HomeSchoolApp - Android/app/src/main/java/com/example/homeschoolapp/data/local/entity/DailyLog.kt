package com.example.homeschoolapp.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.time.LocalDateTime

@Entity(
    tableName = "daily_logs",
    foreignKeys = [
        ForeignKey(
            entity = Student::class,
            parentColumns = ["studentId"],
            childColumns = ["studentId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Subject::class,
            parentColumns = ["subjectId"],
            childColumns = ["subjectId"],
            onDelete = ForeignKey.RESTRICT
        ),
        ForeignKey(
            entity = AcademicYear::class,
            parentColumns = ["yearId"],
            childColumns = ["academicYearId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("studentId"),
        Index("subjectId"),
        Index("academicYearId"),
        Index("date")
    ]
)
data class DailyLog(
    @PrimaryKey(autoGenerate = true) val logId: Long = 0,
    val studentId: Long,
    val subjectId: Long,
    val academicYearId: Long,
    val date: LocalDateTime,
    val durationMinutes: Int, // Duration of the activity in minutes
    val description: String?,
    val createddat: Long = System.currentTimeMillis()
)
