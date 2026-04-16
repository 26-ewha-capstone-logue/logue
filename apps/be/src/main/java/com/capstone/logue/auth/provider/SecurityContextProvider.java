package com.capstone.logue.auth.provider;

import com.capstone.logue.auth.security.UserAuthentication;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Slf4j
@Component
public class SecurityContextProvider {
    public Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        if (Objects.isNull(principal)) {
            throw new LogueException(ErrorCode.UNAUTHORIZED);  // 인증되지 않은 경우 예외 발생
        }
        return (Long) principal;  // 사용자 ID 반환
    }

    // 테스트를 위한 SecurityContext 설정 메서드
    public void setupSecurityContextForTest(Long userId) {
        UserAuthentication authentication = new UserAuthentication(userId, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);  // 테스트 환경에서 사용자 인증 설정
    }
}
