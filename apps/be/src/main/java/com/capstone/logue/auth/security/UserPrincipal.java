package com.capstone.logue.auth.security;

/**
 * JWT 인증 후 SecurityContext에 저장되는 사용자 정보 객체입니다.
 *
 * <p>DB 조회 없이 JWT 클레임에서 파싱한 정보만을 담으며,
 * {@code @CurrentUser} 어노테이션을 통해 컨트롤러 파라미터로 주입됩니다.</p>
 *
 * @param userId 사용자 ID
 * @param email  사용자 이메일
 */
public record UserPrincipal(Long userId, String email) {
}
