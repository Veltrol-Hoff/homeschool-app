package com.example.homeschoolapp.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.example.homeschoolapp.data.local.entity.DailyLog
import kotlinx.coroutines.flow.Flow
import java.time.LocalDateTime

@Dao
interface DailyLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: DailyLog): Long

    @Update
    suspend fun updateLog(log: DailyLog)

    @Delete
    suspend fun deleteLog(log: DailyLog)

    @Query("SELECT * FROM daily_logs WHERE logId = :id")
    suspend fun getLogById(id: Long): DailyLog?

    @Query("SELECT * FROM daily_logs WHERE studentId = :studentId ORDER BY date DESC")
    fun getLogsForStudent(studentId: Long): Flow<List<DailyLog>>

    @Query("SELECT * FROM daily_logs WHERE academicYearId = :yearId ORDER BY date DESC")
    fun getLogsForAcademicYear(yearId: Long): Flow<List<DailyLog>>
    
    @Query("SELECT * FROM daily_logs WHERE date BETWEEN :startDate AND :endDate ORDER BY date DESC")
    fun getLogsByDateRange(startDate: LocalDateTime, endDate: LocalDateTime): Flow<List<DailyLog>>

    @Query("""
        SELECT SUM(durationMinutes) FROM daily_logs 
        WHERE studentId = :studentId AND academicYearId = :yearId AND subjectId = :subjectId
    """)
    fun getTotalDurationForSubject(studentId: Long, yearId: Long, subjectId: Long): Flow<Int?>

    @Query("""
        SELECT SUM(durationMinutes) FROM daily_logs 
        WHERE studentId = :studentId AND academicYearId = :yearId
    """)
    fun getTotalDurationForStudent(studentId: Long, yearId: Long): Flow<Int?>
}
