package com.capstone.logue.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepository {

    private static final DefaultRedisScript<Long> COMPARE_AND_SET_SCRIPT =
            new DefaultRedisScript<>(
                    "if redis.call('GET', KEYS[1]) == ARGV[1] then " +
                            "  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]) " +
                            "  return 1 " +
                            "else return 0 end",
                    Long.class);

    private final StringRedisTemplate redisTemplate;

    @Value("${spring.jwt.refresh-token.expiration-time}")
    private long REFRESH_TOKEN_EXPIRATION_TIME;

    public void save(Long userId, String refreshToken) {
        redisTemplate.opsForValue().set(
                buildKey(userId),
                hash(refreshToken),
                Duration.ofMillis(REFRESH_TOKEN_EXPIRATION_TIME)
        );
    }

    public void deleteByUserId(Long userId) {
        redisTemplate.delete(buildKey(userId));
    }

    public boolean rotate(Long userId, String expectedOld, String newToken) {
        long ttlSeconds = REFRESH_TOKEN_EXPIRATION_TIME / 1000;
        Long result = redisTemplate.execute(
                COMPARE_AND_SET_SCRIPT,
                List.of(buildKey(userId)),
                hash(expectedOld),
                hash(newToken),
                String.valueOf(ttlSeconds)
        );
        return Long.valueOf(1L).equals(result);
    }

    private String buildKey(Long userId) {
        return "refresh:" + userId;
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다", e);
        }
    }
}
