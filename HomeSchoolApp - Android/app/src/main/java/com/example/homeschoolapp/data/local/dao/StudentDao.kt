package com.example.homeschoolapp.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.homeschoolapp.data.local.entity.Student
import kotlinx.coroutines.flow.Flow

@Dao
interface StudentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStudent(student: Student): Long

    @Update
    suspend fun updateStudent(student: Student)

    @Delete
    suspend fun deleteStudent(student: Student)

    @Query("SELECT * FROM students WHERE studentId = :id")
    suspend fun getStudentById(id: Long): Student?

    @Query("SELECT * FROM students ORDER BY firstName ASC")
    fun getAllStudents(): Flow<List<Student>>
}
