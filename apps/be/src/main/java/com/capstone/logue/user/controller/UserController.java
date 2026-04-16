package com.capstone.logue.user.controller;

import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.global.response.ApiResponse;
import com.capstone.logue.user.dto.GetUserInfoResponse;
import com.capstone.logue.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final SecurityContextProvider securityContextProvider;
    private final UserRepository userRepository;

    @GetMapping("/api/user/me")
    public ApiResponse<GetUserInfoResponse> getMyInfo() {
        Long userId = securityContextProvider.getAuthenticatedUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new LogueException(ErrorCode.USER_NOT_FOUND));

        GetUserInfoResponse response = GetUserInfoResponse.from(user);
        return ApiResponse.success("사용자 정보 조회 성공", response);

    }
}
