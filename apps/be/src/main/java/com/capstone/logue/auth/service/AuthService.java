package com.capstone.logue.auth.service;

import com.capstone.logue.auth.dto.ReIssueTokenResponse;
import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.auth.repository.RefreshTokenRepository;
import com.capstone.logue.global.entity.RefreshToken;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final JWTProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    @Value("${spring.jwt.access-token.expiration-time}")
    private long ACCESS_TOKEN_EXPIRATION_TIME;

    @Value("${spring.jwt.refresh-token.expiration-time}")
    private long REFRESH_TOKEN_EXPIRATION_TIME;

    @Transactional
    public ReIssueTokenResponse reIssueToken(String refreshToken) {
        // 1. 토큰에서 userId 추출
        Claims claims = jwtProvider.validateToken(refreshToken);
        Long userId = jwtProvider.getUserIdFromToken(claims);
        String email = jwtProvider.getEmailFromToken(claims);

        // 2. CAS로 rotate (이전 토큰 일치 확인 + 새 토큰 저장 원자 실행)
        String newAccessToken = jwtProvider.generateToken(userId, email, ACCESS_TOKEN_EXPIRATION_TIME);
        String newRefreshToken = jwtProvider.generateToken(userId, email, REFRESH_TOKEN_EXPIRATION_TIME);

        boolean rotated = refreshTokenService.rotate(userId, refreshToken, newRefreshToken);
        if (!rotated) {
            throw new LogueException(ErrorCode.INVALID_TOKEN);
        }

        return new ReIssueTokenResponse(newAccessToken, newRefreshToken);
    }
}
