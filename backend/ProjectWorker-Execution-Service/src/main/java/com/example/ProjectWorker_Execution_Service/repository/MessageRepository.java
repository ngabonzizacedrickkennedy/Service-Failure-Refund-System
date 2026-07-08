package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);

    List<Message> findDistinctByConversationIdContainingOrderBySentAtDesc(String userId);

    @Query("SELECT m FROM Message m WHERE m.conversationId = :convId AND m.sentAt >= :from AND m.sentAt <= :to ORDER BY m.sentAt ASC")
    List<Message> findByConversationIdAndSentAtBetween(
            @Param("convId") String conversationId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
