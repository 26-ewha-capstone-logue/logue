package com.capstone.logue.user.dto;

import com.capstone.logue.global.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GetUserInfoResponse {

    private Long id;
    private String email;
    private String name;
    private String provider;
    private String profileImageUrl;

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
