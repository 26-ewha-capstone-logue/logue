package com.capstone.logue.auth.dto;

import lombok.AllArgsConstructor;

import java.util.Map;

/**
 * Google OAuth2 인증을 통해 전달받은 사용자 정보를 추상화한 구현체입니다.
 *
 * <p>Spring Security OAuth2 로그인 과정에서 제공되는 attribute(Map)를 기반으로
 * Google 사용자 정보(provider, id, email, name, profile image)를 추출합니다.</p>
 *
 * <p>각 필드는 Google의 표준 OpenID Connect(OIDC) 클레임을 따릅니다:
 * <ul>
 *     <li>sub: 사용자 고유 식별자</li>
 *     <li>email: 사용자 이메일</li>
 *     <li>name: 사용자 이름</li>
 *     <li>picture: 프로필 이미지 URL</li>
 * </ul>
 * </p>
 */
@AllArgsConstructor
public class GoogleUserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attribute;

    @Override
    public String getProvider() {
        return "google";
    }

    @Override
    public String getProviderId() {
        return attribute.get("sub").toString();
    }

    @Override
    public String getEmail() {
        return attribute.get("email").toString();
    }

    @Override
    public String getName() {
        return attribute.get("name").toString();
    }

    @Override
    public String getProfileImageUrl() {
        return attribute.get("picture").toString();
    }
}
