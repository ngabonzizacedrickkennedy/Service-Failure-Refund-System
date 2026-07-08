package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, String> {

    Optional<Interview> findByWorkerId(String workerId);

    List<Interview> findAllByOrderBySubmittedAtDesc();
}
