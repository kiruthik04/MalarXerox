package com.malar.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class KeepAliveTask {

    private static final Logger logger = LoggerFactory.getLogger(KeepAliveTask.class);

    @Value("${RENDER_EXTERNAL_URL:http://localhost:${server.port:8080}}")
    private String serverUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Runs every 14 minutes (840,000 ms) to keep the Render free instance awake
    @Scheduled(fixedRate = 840000)
    public void pingServer() {
        try {
            String url = serverUrl + "/api/ping";
            logger.info("Pinging server to keep alive: {}", url);
            String response = restTemplate.getForObject(url, String.class);
            logger.info("Ping response: {}", response);
        } catch (Exception e) {
            logger.error("Error pinging server: {}", e.getMessage());
        }
    }
}
