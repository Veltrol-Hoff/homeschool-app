package com.example.homeschoolapp.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.homeschoolapp.data.local.entity.AcademicYear
import kotlinx.coroutines.flow.Flow

@Dao
interface AcademicYearDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAcademicYear(year: AcademicYear): Long

    @Update
    suspend fun updateAcademicYear(year: AcademicYear)

    @Delete
    suspend fun deleteAcademicYear(year: AcademicYear)

    @Query("SELECT * FROM academic_years WHERE yearId = :id")
    suspend fun getAcademicYearById(id: Long): AcademicYear?

    @Query("SELECT * FROM academic_years ORDER BY startDate DESC")
    fun getAllAcademicYears(): Flow<List<AcademicYear>>

    @Query("SELECT * FROM academic_years WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveAcademicYear(): AcademicYear?
}
