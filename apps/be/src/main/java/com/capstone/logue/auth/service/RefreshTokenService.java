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
    @Transactional
    public void saveRefreshToken(Long userId, String token) {
        refreshTokenRepository.deleteByUserId(userId);
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(userId)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(REFRESH_TOKEN_EXPIRATION_TIME / 1000))
                .build());
    }

    // 조회
    public RefreshToken getRefreshToken(Long userId) {
        return refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new LogueException(ErrorCode.EXPIRED_TOKEN));
    }

    // 삭제
    @Transactional
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
