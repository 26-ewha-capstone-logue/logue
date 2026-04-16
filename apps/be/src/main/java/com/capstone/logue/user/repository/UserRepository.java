package com.capstone.logue.user.repository;

import com.capstone.logue.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Logue 서비스를 사용하는 사용자 정보에 접근하는 레포지토리입니다.
 *
 * <p>소셜 로그인(Google OAuth2)을 통해 인증되며,
 * {소셜 서버에서 받은 providerId로 유저의 존재 여부를 체크 할 수 있도록 한다.</p>
 */
public interface UserRepository extends JpaRepository<User, Long> {
    User findByProviderId(String providerId);
}
