package com.capstone.logue.user.controller;

import com.capstone.logue.auth.annotation.CurrentUser;
import com.capstone.logue.auth.dto.ReIssueTokenResponse;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.auth.service.AuthService;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.global.response.ApiResponse;
import com.capstone.logue.user.dto.GetUserInfoResponse;
import com.capstone.logue.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자 관련 API를 제공하는 컨트롤러입니다.
 *
 * <p>현재 로그인한 사용자의 정보를 조회하는 기능을 제공합니다.</p>
 */
@Tag(name = "User", description = "사용자 API")
@RestController
@RequiredArgsConstructor
public class UserController {
    /** 사용자 조회를 위한 repository */
    private final UserRepository userRepository;


    /**
     * 현재 로그인한 사용자의 정보를 조회합니다.
     *
     * <p>JWT 인증을 통해 {@link SecurityContextProvider}에서 userId를 가져온 후,
     * 해당 ID로 사용자를 조회하여 응답 DTO로 변환합니다.</p>
     *
     * <p>요청에는 별도의 Request Body가 필요하지 않으며,
     * Authorization 헤더에 포함된 JWT 토큰을 기반으로 인증이 수행됩니다.</p>
     *
     * @return 사용자 정보 조회 결과
     * @throws LogueException 사용자를 찾을 수 없는 경우 (USER_NOT_FOUND)
     */
    @Operation(summary = "내 정보 조회", description = "JWT 토큰 기반으로 현재 로그인한 사용자 정보를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 실패 (토큰 없음 또는 만료)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
    })
    @GetMapping("/api/user/me")
    public ResponseEntity<ApiResponse<GetUserInfoResponse>> getMyInfo(@CurrentUser UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new LogueException(ErrorCode.USER_NOT_FOUND));

        GetUserInfoResponse response = GetUserInfoResponse.from(user);
        return ResponseEntity.ok(ApiResponse.success("사용자 정보 조회 성공", response));
    }

    @Tag(name = "Auth", description = "인증 API")
    @RestController
    @RequiredArgsConstructor
    public class AuthController {

        private final AuthService authService;

        @Operation(summary = "토큰 재발급")
        @PostMapping("/api/auth/reissue")
        public ResponseEntity<ApiResponse<ReIssueTokenResponse>> reIssueToken(@RequestHeader("Refresh-Token") String refreshToken) {
            ReIssueTokenResponse response = authService.reIssueToken(refreshToken);
            return ResponseEntity.ok(ApiResponse.success("토큰 재발급 성공", response));
        }
    }

}
