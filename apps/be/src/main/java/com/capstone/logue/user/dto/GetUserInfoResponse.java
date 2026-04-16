package com.capstone.logue.user.dto;

import com.capstone.logue.global.entity.User;
import lombok.Builder;
import lombok.Getter;

/**
 * 현재 로그인한 사용자 정보를 반환하기 위한 응답 DTO입니다.
 *
 * <p>{@link com.capstone.logue.user.controller.UserController}의
 * /api/user/me API에서 사용되며,
 * 내부 User 엔티티를 클라이언트에 전달할 형태로 변환합니다.</p>
 */
@Getter
@Builder
public class GetUserInfoResponse {

    /** 사용자 ID */
    private Long id;

    /** 사용자 이메일 */
    private String email;

    /** 사용자 이름 */
    private String name;

    /** OAuth 제공자 (google) */
    private String provider;

    /** 사용자 프로필 이미지 URL */
    private String profileImageUrl;


    /**
     * {@link User} 엔티티를 {@link GetUserInfoResponse} DTO로 변환합니다.
     *
     * <p>엔티티 내부 정보를 클라이언트 응답 형태로 매핑하며,
     * provider는 소문자로 변환하여 반환합니다.</p>
     *
     * @param user 변환할 사용자 엔티티
     * @return 사용자 정보 응답 DTO
     */
    public static GetUserInfoResponse from(User user) {
        return GetUserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .provider(user.getProvider().toLowerCase())
                .profileImageUrl(null)
                .build();
    }
}
