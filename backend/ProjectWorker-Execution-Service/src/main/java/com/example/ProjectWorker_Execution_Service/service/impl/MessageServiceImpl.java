package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.MessageRequest;
import com.example.ProjectWorker_Execution_Service.dto.MessageResponse;
import com.example.ProjectWorker_Execution_Service.model.Message;
import com.example.ProjectWorker_Execution_Service.repository.MessageRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;

    private static String conversationId(String a, String b) {
        return a.compareTo(b) <= 0 ? a + "_" + b : b + "_" + a;
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(MessageRequest request, UserPrincipal principal) {
        String convId = conversationId(principal.getUserId(), request.getRecipientId());
        Message msg = Message.builder()
                .conversationId(convId)
                .senderId(principal.getUserId())
                .senderName(extractName(principal.getEmail()))
                .recipientId(request.getRecipientId())
                .text(request.getText())
                .build();
        messageRepository.save(msg);
        return toResponse(msg);
    }

    @Override
    public List<MessageResponse> getConversation(String otherUserId, UserPrincipal principal) {
        String convId = conversationId(principal.getUserId(), otherUserId);
        return messageRepository.findByConversationIdOrderBySentAtAsc(convId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getLatestConversations(UserPrincipal principal) {
        return messageRepository.findDistinctByConversationIdContainingOrderBySentAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getMessagesInRange(String partnerId, LocalDateTime from, LocalDateTime to, UserPrincipal principal) {
        String convId = conversationId(principal.getUserId(), partnerId);
        return messageRepository.findByConversationIdAndSentAtBetween(convId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .recipientId(m.getRecipientId())
                .text(m.getText())
                .sentAt(m.getSentAt())
                .build();
    }

    private String extractName(String email) {
        if (email == null) return "User";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
