package com.example.homeschoolapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

@Entity(tableName = "academic_years")
data class AcademicYear(
    @PrimaryKey(autoGenerate = true) val yearId: Long = 0,
    val name: String, // e.g., "2023-2024"
    val startDate: LocalDate,
    val endDate: LocalDate,
    val totalHoursRequired: Double = 875.0,
    val isActive: Boolean = false
)
