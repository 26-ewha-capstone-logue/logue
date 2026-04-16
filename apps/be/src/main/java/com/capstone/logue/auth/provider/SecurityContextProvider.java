package com.capstone.logue.auth.provider;

import com.capstone.logue.auth.security.UserAuthentication;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Spring Security의 {@link SecurityContextHolder}로부터
 * 현재 인증된 사용자 정보를 조회하는 컴포넌트입니다.
 *
 * <p>주로 서비스 계층이나 비즈니스 로직에서
 * "현재 로그인한 사용자의 ID"가 필요할 때 사용됩니다.</p>
 *
 * <p>또한 테스트 환경에서 인증 정보를 직접 주입할 수 있도록
 * SecurityContext 설정 메서드를 함께 제공합니다.</p>
 */
@Slf4j
@Component
public class SecurityContextProvider {

    /**
     * 현재 SecurityContext에 저장된 인증 사용자 ID를 반환합니다.
     *
     * <p>인증 정보가 없거나 principal이 비어 있으면
     * {@link LogueException}을 발생시킵니다.</p>
     *
     * @return 현재 인증된 사용자 ID
     * @throws LogueException 인증되지 않은 요청인 경우
     */
    public Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        if (Objects.isNull(principal)) {
            throw new LogueException(ErrorCode.UNAUTHORIZED);  // 인증되지 않은 경우 예외 발생
        }
        return (Long) principal;  // 사용자 ID 반환
    }

    /**
     * 테스트 환경에서 사용할 SecurityContext를 직접 설정합니다.
     *
     * <p>지정한 userId를 principal로 가지는
     * {@link UserAuthentication} 객체를 생성하여
     * SecurityContext에 저장합니다.</p>
     *
     * @param userId 테스트용으로 주입할 사용자 ID
     */
    public void setupSecurityContextForTest(Long userId) {
        UserAuthentication authentication = new UserAuthentication(userId, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);  // 테스트 환경에서 사용자 인증 설정
    }
}
