package com.capstone.logue.user.dto;

import com.capstone.logue.global.entity.User;
import lombok.Builder;
import lombok.Getter;

/**
 * 사용자 회원가입 요청을 위한 DTO입니다.
 *
 * <p>{@link com.capstone.logue.user.controller.UserController}의
 * /api/user/signup API에서 사용됩니다.</p>
 */
public record SignUpRequest(
        String email,
        String name,
        String provider,
        String providerUserId,
        String profileImageUrl
) {

    public static User toEntity(String provider, String providerUserId, String email, String name, String profileImageUrl) {
        return User.builder()
                .provider(provider)
                .providerUserId(providerUserId)
                .email(email)
                .name(name)
                .profileImageUrl(profileImageUrl)
                .build();
    }
}
