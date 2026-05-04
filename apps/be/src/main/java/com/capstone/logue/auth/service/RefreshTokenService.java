package com.capstone.logue.auth.service;

import com.capstone.logue.auth.repository.RefreshTokenRepository;
import com.capstone.logue.global.entity.RefreshToken;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${spring.jwt.refresh-token.expiration-time}")
    private long REFRESH_TOKEN_EXPIRATION_TIME;

    // 저장 (기존 토큰 있으면 덮어쓰기)
    public void saveRefreshToken(Long userId, String refreshToken) {
        refreshTokenRepository.save(userId, refreshToken);
    }

    // 삭제
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    // Refresh Token 재발급할 때 동시 요청 방어
    public boolean rotate(Long userId, String expectedOld, String newToken) {
        return refreshTokenRepository.rotate(userId, expectedOld, newToken);
    }
}
