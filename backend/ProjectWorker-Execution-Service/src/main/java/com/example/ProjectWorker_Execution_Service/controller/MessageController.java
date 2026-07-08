package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.MessageRequest;
import com.example.ProjectWorker_Execution_Service.dto.MessageResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendMessage(request, principal));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable String otherUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(messageService.getConversation(otherUserId, principal));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<MessageResponse>> getLatestConversations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(messageService.getLatestConversations(principal));
    }

    @GetMapping("/range")
    public ResponseEntity<List<MessageResponse>> getMessagesInRange(
            @RequestParam("partnerId") String partnerId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(messageService.getMessagesInRange(partnerId, from, to, principal));
    }
}
