package com.capstone.logue.auth.dto;

public interface OAuth2UserInfo {
    //provider
    String getProvider();
    //provider가 발급해주는 고유 아이디
    String getProviderId();
    //email
    String getEmail();
    //name
    String getName();
    //profile image
    String getProfileImageUrl();
}
