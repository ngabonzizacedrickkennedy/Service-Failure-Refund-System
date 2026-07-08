package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.InterviewRequest;
import com.example.ProjectWorker_Execution_Service.dto.InterviewResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.model.Interview;
import com.example.ProjectWorker_Execution_Service.model.InterviewStatus;
import com.example.ProjectWorker_Execution_Service.repository.InterviewRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.InterviewService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository interviewRepository;
    private final WorkerCvRepository workerCvRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.base-url}")
    private String aiServiceBaseUrl;

    @Override
    @Transactional
    public InterviewResponse submitInterview(InterviewRequest request, UserPrincipal principal) {
        if (!"WORKER".equals(principal.getRole())) {
            throw new ForbiddenException("Only workers can submit interviews.");
        }

        Interview interview = interviewRepository.findByWorkerId(principal.getUserId())
                .orElse(Interview.builder()
                        .workerId(principal.getUserId())
                        .workerEmail(principal.getEmail())
                        .workerName(extractName(principal.getEmail()))
                        .build());

        interview.setAnswersJson(request.getAnswersJson());
        interview.setStatus(InterviewStatus.UNDER_REVIEW);
        Interview saved = interviewRepository.save(interview);

        callAiScoring(saved);
        return toResponse(interviewRepository.findById(saved.getId()).orElse(saved));
    }

    @Override
    public InterviewResponse getMyInterview(UserPrincipal principal) {
        Interview interview = interviewRepository.findByWorkerId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("No interview found. Submit your interview first."));
        return toResponse(interview);
    }

    @Override
    public List<InterviewResponse> getAllInterviews() {
        return interviewRepository.findAllByOrderBySubmittedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InterviewResponse scoreInterview(String interviewId, double score) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + interviewId));
        interview.setInterviewScore(score);
        interview.setStatus(InterviewStatus.SCORED);
        interview.setReviewedAt(LocalDateTime.now());
        interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Override
    @Transactional
    public InterviewResponse aiScoreInterview(String interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + interviewId));
        callAiScoring(interview);
        return toResponse(interviewRepository.findById(interviewId).orElse(interview));
    }

    // Calls the AI service to score the interview and persists the result.
    // Runs synchronously; if AI is unavailable the interview keeps UNDER_REVIEW status silently.
    private void callAiScoring(Interview interview) {
        try {
            String specialization = workerCvRepository
                    .findByWorkerId(interview.getWorkerId())
                    .map(cv -> cv.getSpecialization())
                    .orElse("General");

            ArrayNode answersArray = buildAnswersArray(interview.getAnswersJson());

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.set("answers", answersArray);
            requestBody.put("specialization", specialization);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            String url = aiServiceBaseUrl + "/api/ai/interview/score-answers";
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode body = objectMapper.readTree(response.getBody());
                int score = body.path("score").asInt(0);
                String reasoning = body.path("reasoning").asText("");

                interview.setInterviewScore(score);
                interview.setScoringReason(reasoning);
                interview.setStatus(InterviewStatus.SCORED);
                interview.setReviewedAt(LocalDateTime.now());
                interviewRepository.save(interview);
            }
        } catch (Exception e) {
            log.warn("[Interview] AI scoring failed for interview {} — {}", interview.getId(), e.getMessage());
        }
    }

    private ArrayNode buildAnswersArray(String answersJson) {
        ArrayNode result = objectMapper.createArrayNode();
        if (answersJson == null || answersJson.isBlank()) return result;

        try {
            JsonNode parsed = objectMapper.readTree(answersJson);
            if (!parsed.isArray()) return result;
            for (JsonNode ans : parsed) {
                ObjectNode item = objectMapper.createObjectNode();
                item.put("question", ans.path("question").asText(""));
                item.put("transcript", ans.path("transcript").asText(""));
                item.put("durationSec", ans.path("durationSec").asInt(0));
                result.add(item);
            }
        } catch (Exception e) {
            log.warn("[Interview] Failed to parse answersJson — {}", e.getMessage());
        }
        return result;
    }

    private InterviewResponse toResponse(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .workerId(i.getWorkerId())
                .workerName(i.getWorkerName())
                .workerEmail(i.getWorkerEmail())
                .answersJson(i.getAnswersJson())
                .interviewScore(i.getInterviewScore())
                .scoringReason(i.getScoringReason())
                .status(i.getStatus().name())
                .submittedAt(i.getSubmittedAt())
                .reviewedAt(i.getReviewedAt())
                .build();
    }

    private String extractName(String email) {
        if (email == null) return "Worker";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
