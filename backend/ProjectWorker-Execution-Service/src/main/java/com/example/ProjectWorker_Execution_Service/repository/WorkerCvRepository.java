package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkerCvRepository extends JpaRepository<WorkerCv, String> {

    Optional<WorkerCv> findByWorkerId(String workerId);

    boolean existsByWorkerId(String workerId);

    List<WorkerCv> findAllByPastFailuresGreaterThanOrderByPastFailuresDesc(int count);
}
