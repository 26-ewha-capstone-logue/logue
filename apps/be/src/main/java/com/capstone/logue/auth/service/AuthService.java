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

        // 2. DB에서 저장된 토큰 조회 및 검증
        RefreshToken storedToken = refreshTokenService.getRefreshToken(userId);

        if (!storedToken.getToken().equals(refreshToken)) {
            throw new LogueException(ErrorCode.INVALID_TOKEN);
        }

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenService.deleteByUserId(userId);
            throw new LogueException(ErrorCode.EXPIRED_TOKEN);
        }

        // 3. 새 토큰 발급 및 저장
        String newAccessToken = jwtProvider.generateToken(userId, email, ACCESS_TOKEN_EXPIRATION_TIME);
        String newRefreshToken = jwtProvider.generateToken(userId, email, REFRESH_TOKEN_EXPIRATION_TIME);

        refreshTokenService.saveRefreshToken(userId, newRefreshToken);

        return new ReIssueTokenResponse(newAccessToken, newRefreshToken);
    }
}
