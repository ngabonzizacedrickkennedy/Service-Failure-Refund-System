package com.example.Evaluation_Decision_Service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EvaluationDecisionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EvaluationDecisionServiceApplication.class, args);
	}

}
