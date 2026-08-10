package com.example.homeschoolapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "students")
data class Student(
    @PrimaryKey(autoGenerate = true) val studentId: Long = 0,
    val firstName: String,
    val lastName: String,
    val gradeLevel: Int,
    val color: Int // Color int for UI representation
)
