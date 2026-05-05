package com.capstone.logue.auth.dto;

/**
 * OAuth2 제공자별 사용자 정보를 공통 인터페이스로 추상화합니다.
 *
 * <p>Google, Kakao, Naver 등 다양한 OAuth2 제공자마다 응답 구조가 다르기 때문에,
 * 이를 통일된 방식으로 처리하기 위해 사용됩니다.</p>
 *
 * <p>각 구현체는 provider별 attribute 구조에 맞게 데이터를 파싱하여,
 * 아래 메서드들을 통해 표준화된 사용자 정보를 반환해야 합니다.</p>
 */
public interface OAuth2UserInfo {

    /**
     * OAuth 제공자 이름을 반환합니다.
     *
     * @return 예: "google", "kakao", "naver"
     */
    String getProvider();

    /**
     * OAuth 제공자가 발급한 사용자 고유 식별자를 반환합니다.
     *
     * <p>provider 내부에서 유일한 값으로,
     * 서비스 내부 사용자 식별 키로 활용됩니다.</p>
     *
     * @return provider 고유 사용자 ID
     */
    String getProviderUserId();

    /**
     * 사용자 이메일을 반환합니다.
     *
     * @return 이메일 주소
     */
    String getEmail();

    /**
     * 사용자 이름을 반환합니다.
     *
     * @return 사용자 이름
     */
    String getName();

    /**
     * 사용자 프로필 이미지 URL을 반환합니다.
     *
     * @return 프로필 이미지 URL
     */
    String getProfileImageUrl();
}
