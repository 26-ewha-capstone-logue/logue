package com.capstone.logue.auth.controller;

import com.capstone.logue.auth.dto.ReIssueTokenResponse;
import com.capstone.logue.auth.service.AuthService;
import com.capstone.logue.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "토큰 재발급", description = "Refresh Token으로 Access Token과 Refresh Token을 재발급합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "재발급 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "유효하지 않은 토큰"),
    })
    @PostMapping("/api/auth/reissue")
    public ResponseEntity<ApiResponse<ReIssueTokenResponse>> reIssueToken(@RequestHeader("Refresh-Token") String refreshToken) {
        ReIssueTokenResponse response = authService.reIssueToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("토큰 재발급 성공", response));
    }
}
