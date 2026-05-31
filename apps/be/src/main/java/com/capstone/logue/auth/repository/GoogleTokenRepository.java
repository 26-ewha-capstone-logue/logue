package com.capstone.logue.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GoogleTokenRepository {

    private static final Duration FALLBACK_TTL = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;

    public void save(Long userId, String googleAccessToken, Instant expiresAt) {
        Duration ttl = (expiresAt != null) ? Duration.between(Instant.now(), expiresAt) : FALLBACK_TTL;
        if (ttl.isNegative() || ttl.isZero()) {
            ttl = FALLBACK_TTL;
        }
        redisTemplate.opsForValue().set(buildKey(userId), googleAccessToken, ttl);
    }

    public Optional<String> findByUserId(Long userId) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(buildKey(userId)));
    }

    public void deleteByUserId(Long userId) {
        redisTemplate.delete(buildKey(userId));
    }

    private String buildKey(Long userId) {
        return "google_token:" + userId;
    }
}
