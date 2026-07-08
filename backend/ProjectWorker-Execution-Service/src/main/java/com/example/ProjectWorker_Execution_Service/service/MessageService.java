package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.MessageRequest;
import com.example.ProjectWorker_Execution_Service.dto.MessageResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageService {

    MessageResponse sendMessage(MessageRequest request, UserPrincipal principal);

    List<MessageResponse> getConversation(String otherUserId, UserPrincipal principal);

    List<MessageResponse> getLatestConversations(UserPrincipal principal);

    List<MessageResponse> getMessagesInRange(String partnerId, LocalDateTime from, LocalDateTime to, UserPrincipal principal);
}
