package com.example.Notification_Reporting_Service.controller;

import com.example.Notification_Reporting_Service.dto.NotificationResponse;
import com.example.Notification_Reporting_Service.model.Notification;
import com.example.Notification_Reporting_Service.repository.NotificationRepository;
import com.example.Notification_Reporting_Service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> personal = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(principal.getUserId());

        List<NotificationResponse> result = new ArrayList<>(
                personal.stream().map(this::toResponse).collect(Collectors.toList()));

        if ("ADMIN".equals(principal.getRole())) {
            List<Notification> adminBroadcasts = notificationRepository
                    .findByRecipientIdOrderByCreatedAtDesc("ADMIN");
            result.addAll(adminBroadcasts.stream().map(this::toResponse).collect(Collectors.toList()));
            result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        if ("REFUND_OFFICE".equals(principal.getRole())) {
            List<Notification> refundBroadcasts = notificationRepository
                    .findByRecipientIdOrderByCreatedAtDesc("REFUND_OFFICE");
            result.addAll(refundBroadcasts.stream().map(this::toResponse).collect(Collectors.toList()));
            result.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/my/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationRepository.countByRecipientIdAndReadFalse(principal.getUserId());
        if ("ADMIN".equals(principal.getRole())) {
            count += notificationRepository.countByRecipientIdAndReadFalse("ADMIN");
        }
        if ("REFUND_OFFICE".equals(principal.getRole())) {
            count += notificationRepository.countByRecipientIdAndReadFalse("REFUND_OFFICE");
        }
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Transactional
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationRepository.findById(id).ifPresent(n -> {
            boolean isOwner = n.getRecipientId().equals(principal.getUserId());
            boolean isAdminBroadcast = "ADMIN".equals(n.getRecipientId()) && "ADMIN".equals(principal.getRole());
            boolean isRefundBroadcast = "REFUND_OFFICE".equals(n.getRecipientId()) && "REFUND_OFFICE".equals(principal.getRole());
            if (isOwner || isAdminBroadcast || isRefundBroadcast) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationRepository.markAllReadByRecipientId(principal.getUserId());
        if ("ADMIN".equals(principal.getRole())) {
            notificationRepository.markAllReadByRecipientId("ADMIN");
        }
        if ("REFUND_OFFICE".equals(principal.getRole())) {
            notificationRepository.markAllReadByRecipientId("REFUND_OFFICE");
        }
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .data(n.getData())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
