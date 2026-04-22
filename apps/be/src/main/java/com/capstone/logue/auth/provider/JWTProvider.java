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

/**
 * JWT(Json Web Token)의 생성, 검증, 파싱을 담당하는 컴포넌트입니다.
 *
 * <p>사용자 인증을 위해 userId를 claim으로 포함한 토큰을 생성하며,
 * 요청 시 전달된 토큰의 유효성을 검증하고 사용자 정보를 추출합니다.</p>
 *
 * <p>토큰은 HS256 알고리즘을 사용하여 서명되며,
 * secret key는 application 설정값을 기반으로 생성됩니다.</p>
 */
@Slf4j
@Component
public class JWTProvider {

    /** JWT 서명 및 검증에 사용되는 비밀 키 */
    private final SecretKey secretKey;

    /**
     * SSM에 저장된 파라미터 `/logue/~/JWT_SECRET` 값을 기반으로 SecretKey를 생성합니다.
     *
     * @param secret JWT 서명용 비밀 문자열
     */
    public JWTProvider(@Value("${spring.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 사용자 ID를 기반으로 JWT access token을 생성합니다.
     *
     * <p>토큰에는 userId가 claim으로 포함되며,
     * 발급 시간과 만료 시간이 함께 설정됩니다.</p>
     *
     * @param userId 토큰에 포함할 사용자 ID
     * @param expirationMillis 토큰 만료 시간 (millisecond 단위)
     * @return 생성된 JWT 문자열
     */
    public String generateToken(Long userId, long expirationMillis) {
        return Jwts.builder()
                .claim("userId", userId)  // 사용자 ID를 claim에 담는다.
                .setIssuedAt(new Date(System.currentTimeMillis()))  // 토큰 발급 시간 설정
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))  // 토큰 만료 시간 설정
                .signWith(secretKey, SignatureAlgorithm.HS256)  // 서명을 생성한다.
                .compact();  // 최종적으로 JWT 문자열을 생성하여 반환한다.
    }

    /**
     * JWT 토큰의 유효성을 검증합니다.
     *
     * <p>토큰이 유효하지 않거나 만료된 경우 예외를 발생시킵니다.</p>
     *
     * @param token 검증할 JWT 문자열
     * @throws LogueException 토큰이 만료되었거나 유효하지 않은 경우
     */
    public void validateToken(String token) {
        tokenParser(token);  // 토큰을 파싱하고, 유효하지 않으면 예외를 발생시킨다.
    }

    /**
     * JWT 토큰을 파싱하여 Claims를 반환합니다.
     *
     * <p>서명을 검증하고 토큰의 payload를 해석합니다.
     * 만료되었거나 잘못된 토큰일 경우 {@link LogueException}을 발생시킵니다.</p>
     *
     * @param token 파싱할 JWT 문자열
     * @return 토큰의 Claims(payload)
     * @throws LogueException EXPIRED_TOKEN 또는 INVALID_TOKEN
     */
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

    /**
     * JWT 토큰에서 사용자 ID를 추출합니다.
     *
     * @param token JWT 문자열
     * @return 토큰에 포함된 userId
     */
    public Long getUserIdFromToken(String token) {
        return tokenParser(token).get("userId", Long.class);  // 토큰에서 userId를 추출하여 반환한다.
    }
}
