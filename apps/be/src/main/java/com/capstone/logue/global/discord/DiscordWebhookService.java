package com.capstone.logue.global.discord;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DiscordWebhookService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private static final int MAX_DESCRIPTION_LENGTH = 4000;
    private static final int MAX_STACK_LINES = 15;

    private final RestTemplate restTemplate;
    private final String webhookUrl;
    private final String appName;
    private final String activeProfile;

    public DiscordWebhookService(
            RestTemplate restTemplate,
            @Value("${DISCORD_WEBHOOK_URL:}") String webhookUrl,
            @Value("${spring.application.name:logue}") String appName,
            @Value("${spring.profiles.active:local}") String activeProfile
    ) {
        this.restTemplate = restTemplate;
        this.webhookUrl = webhookUrl;
        this.appName = appName;
        this.activeProfile = activeProfile;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void sendStartupNotification() {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            return;
        }

        try {
            String timestamp = LocalDateTime.now().format(FORMATTER);
            String description = String.format("""
                    **🧩 서비스** : %s
                    **🌐 환경** : %s
                    **⏰ 시간** : %s
                    """, appName, activeProfile, timestamp);

            Map<String, Object> embed = Map.of(
                    "title", "✅ 서버 시작",
                    "description", description,
                    "color", 3066993  // green
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    webhookUrl,
                    new HttpEntity<>(Map.of("embeds", List.of(embed)), headers),
                    String.class
            );
        } catch (Exception ex) {
            log.warn("[Discord] 시작 알림 전송 실패: {}", ex.getMessage());
        }
    }

    @Async
    public void sendErrorNotification(String method, String uri, String errorCode, int httpStatus, Exception e) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.debug("[Discord] Webhook URL이 설정되지 않아 알림을 건너뜁니다.");
            return;
        }

        try {
            String description = buildDescription(method, uri, errorCode, httpStatus, e);
            Map<String, Object> embed = Map.of(
                    "title", "🚨 에러 로그 🚨",
                    "description", description,
                    "color", 15158332  // red
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    webhookUrl,
                    new HttpEntity<>(Map.of("embeds", List.of(embed)), headers),
                    String.class
            );
        } catch (Exception ex) {
            log.warn("[Discord] 웹훅 전송 실패: {}", ex.getMessage());
        }
    }

    private String buildDescription(String method, String uri, String errorCode, int httpStatus, Exception e) {
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String location = extractLocation(e);
        String message = e.getMessage() != null ? e.getMessage() : "(no message)";
        String stackTrace = buildStackTrace(e);

        String info = String.format("""
                **🧩 서비스** : %s
                **🌐 환경** : %s
                **⏰ 시간** : %s
                **📍 위치** : %s
                **🛣️ 요청** : %s %s
                **🔢 코드/상태** : %s / %d
                **💬 에러 메시지** : %s
                """, appName, activeProfile, timestamp, location, method, uri, errorCode, httpStatus, message);

        String codeBlock = "```java\n" + stackTrace + "\n```";
        String full = info + "\n" + codeBlock;

        if (full.length() > MAX_DESCRIPTION_LENGTH) {
            int available = MAX_DESCRIPTION_LENGTH - info.length() - 20;
            if (available > 0 && stackTrace.length() > available) {
                stackTrace = stackTrace.substring(0, available) + "\n... (truncated)";
            }
            full = info + "\n```java\n" + stackTrace + "\n```";
        }

        return full;
    }

    private String extractLocation(Exception e) {
        StackTraceElement[] elements = e.getStackTrace();
        if (elements == null || elements.length == 0) return "N/A";
        StackTraceElement top = elements[0];
        return top.getClassName() + "." + top.getMethodName()
                + "(" + top.getFileName() + ":" + top.getLineNumber() + ")";
    }

    private String buildStackTrace(Exception e) {
        StackTraceElement[] elements = e.getStackTrace();
        StringBuilder sb = new StringBuilder();
        sb.append(e.getClass().getName()).append(": ")
                .append(e.getMessage() != null ? e.getMessage() : "(no message)").append("\n");

        if (elements != null && elements.length > 0) {
            int limit = Math.min(elements.length, MAX_STACK_LINES);
            for (int i = 0; i < limit; i++) {
                sb.append("  at ").append(elements[i]).append("\n");
            }
            if (elements.length > limit) {
                sb.append("  ... ").append(elements.length - limit).append(" more");
            }
        }

        return sb.toString().trim();
    }
}
