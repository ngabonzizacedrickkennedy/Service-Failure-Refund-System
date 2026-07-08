package com.example.ProjectWorker_Execution_Service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ProjectWorkerExecutionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProjectWorkerExecutionServiceApplication.class, args);
	}

}
