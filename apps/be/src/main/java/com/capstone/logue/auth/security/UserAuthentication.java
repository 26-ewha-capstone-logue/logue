package com.capstone.logue.auth.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * 사용자 인증 정보를 표현하는 커스텀 Authentication 객체입니다.
 *
 * <p>{@link UsernamePasswordAuthenticationToken}을 상속하여 구현되며,
 * principal에 사용자 ID를 저장하는 방식으로 인증을 처리합니다.</p>
 *
 * <p>JWT 인증 과정에서 토큰으로부터 추출한 userId를 기반으로 생성되며,
 * {@link org.springframework.security.core.context.SecurityContextHolder}에 저장되어
 * 이후 요청 처리 과정에서 인증된 사용자 정보를 참조할 수 있도록 합니다.</p>
 *
 * <p>현재 구현에서는 권한(Authority)을 별도로 사용하지 않으며,
 * 필요 시 roles/permissions 확장을 고려할 수 있습니다.</p>
 */
public class UserAuthentication extends UsernamePasswordAuthenticationToken {

    /**
     * 사용자 인증 객체를 생성합니다.
     *
     * @param principal 사용자 식별 정보 (현재는 userId)
     * @param credentials 인증 자격 정보 (사용하지 않음, 일반적으로 null)
     * @param authorities 사용자 권한 목록 (현재는 null 또는 비어 있음)
     */
    public UserAuthentication(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(principal, credentials, authorities);
    }
}
