package com.example.Refund_Processing_Service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RefundProcessingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(RefundProcessingServiceApplication.class, args);
	}

}
