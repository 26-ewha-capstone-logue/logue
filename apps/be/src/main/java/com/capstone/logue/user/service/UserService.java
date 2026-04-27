package com.capstone.logue.user.service;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.dto.SignUpRequest;
import com.capstone.logue.user.dto.SignUpResponse;
import com.capstone.logue.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    /** access token 만료 시간 */
    @Value("${spring.jwt.access-token.expiration-time}")
    private long ACCESS_TOKEN_EXPIRATION_TIME;

    private final JWTProvider jwtProvider;
    private final UserRepository userRepository;


    public User findById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new LogueException(ErrorCode.USER_NOT_FOUND));

        return user;
    }

    @Transactional
    public SignUpResponse signupUser(SignUpRequest request){
        if (userRepository.findByProviderUserId(request.providerUserId()).isPresent())
            throw new LogueException(ErrorCode.ALREADY_EXISTS_USER);

        User user = userRepository.save(
                SignUpRequest.toEntity(
                        request.provider(),
                        request.providerUserId(),
                        request.email(),
                        request.name(),
                        request.profileImageUrl()
                )
        );

        String accessToken = jwtProvider.generateToken(user.getId(), user.getEmail(), ACCESS_TOKEN_EXPIRATION_TIME);
        return new SignUpResponse(accessToken);
    }
}
