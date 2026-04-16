package com.capstone.logue.auth.provider;

import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.ExpiredJwtException;

@Slf4j
@Component
public class JWTProvider {
    private final SecretKey secretKey;

    public JWTProvider(@Value("${spring.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // 토큰 생성 메서드
    public String generateToken(Long userId, long expirationMillis) {
        return Jwts.builder()
                .claim("userId", userId)  // 사용자 ID를 claim에 담는다.
                .setIssuedAt(new Date(System.currentTimeMillis()))  // 토큰 발급 시간 설정
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))  // 토큰 만료 시간 설정
                .signWith(secretKey, SignatureAlgorithm.HS256)  // 서명을 생성한다.
                .compact();  // 최종적으로 JWT 문자열을 생성하여 반환한다.
    }

    // 토큰 유효성 검증 메서드
    public void validateToken(String token) {
        tokenParser(token);  // 토큰을 파싱하고, 유효하지 않으면 예외를 발생시킨다.
    }

    // 토큰 파싱 메서드
    private Claims tokenParser(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)  // 서명을 검증할 비밀 키를 설정한다.
                    .build()
                    .parseClaimsJws(token)  // JWT를 파싱하고, 서명을 검증한다.
                    .getBody();  // 파싱 결과로 Claims(토큰의 내용)를 반환한다.
        } catch (ExpiredJwtException e) {
            throw new LogueException(ErrorCode.EXPIRED_TOKEN);  // 만료된 토큰에 대한 예외 처리
        } catch (Exception e) {
            throw new LogueException(ErrorCode.INVALID_TOKEN);  // 잘못된 토큰에 대한 예외 처리
        }
    }

    // 토큰에서 사용자 ID를 추출하는 메서드
    public Long getUserIdFromToken(String token) {
        return tokenParser(token).get("userId", Long.class);  // 토큰에서 userId를 추출하여 반환한다.
    }
}
