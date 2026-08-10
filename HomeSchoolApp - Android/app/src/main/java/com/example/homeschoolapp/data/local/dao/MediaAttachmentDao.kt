package com.example.homeschoolapp.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.homeschoolapp.data.local.entity.MediaAttachment
import kotlinx.coroutines.flow.Flow

@Dao
interface MediaAttachmentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedia(media: MediaAttachment): Long

    @Delete
    suspend fun deleteMedia(media: MediaAttachment)

    @Query("SELECT * FROM media_attachments WHERE logId = :logId")
    fun getMediaForLog(logId: Long): Flow<List<MediaAttachment>>
}
