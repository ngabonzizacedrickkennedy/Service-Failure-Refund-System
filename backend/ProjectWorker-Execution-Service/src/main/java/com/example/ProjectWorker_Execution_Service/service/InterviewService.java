package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.InterviewRequest;
import com.example.ProjectWorker_Execution_Service.dto.InterviewResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;

import java.util.List;

public interface InterviewService {

    InterviewResponse submitInterview(InterviewRequest request, UserPrincipal principal);

    InterviewResponse getMyInterview(UserPrincipal principal);

    List<InterviewResponse> getAllInterviews();

    InterviewResponse scoreInterview(String interviewId, double score);

    InterviewResponse aiScoreInterview(String interviewId);
}
