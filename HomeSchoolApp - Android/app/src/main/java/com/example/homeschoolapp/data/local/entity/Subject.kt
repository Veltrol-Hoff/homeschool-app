package com.example.homeschoolapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "subjects")
data class Subject(
    @PrimaryKey(autoGenerate = true) val subjectId: Long = 0,
    val name: String,
    val isMandatory: Boolean = false, // Reading, Language Arts, Math, etc.
    val color: Int // Color int for UI representation
)
