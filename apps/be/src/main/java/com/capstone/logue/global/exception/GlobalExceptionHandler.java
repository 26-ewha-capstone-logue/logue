package com.capstone.logue.global.exception;

import com.capstone.logue.global.discord.DiscordWebhookService;
import com.capstone.logue.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final DiscordWebhookService discordWebhookService;

    @ExceptionHandler(LogueException.class)
    public ResponseEntity<ApiResponse<Void>> handleLogueException(LogueException e, HttpServletRequest request) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("[LogueException] code={}, message={}", errorCode.getCode(), errorCode.getMessage());

        if (errorCode.getHttpStatus().is5xxServerError()) {
            discordWebhookService.sendErrorNotification(
                    request.getMethod(), request.getRequestURI(),
                    errorCode.getCode(), errorCode.getHttpStatus().value(), e
            );
        }

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        log.warn("[ValidationException] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_INPUT));
    }

    /**
     * `@Validated` 가 적용된 컨트롤러에서 `@PathVariable` · `@RequestParam` 의
     * 제약 어노테이션(`@Min` · `@NotNull` 등) 위반 시 발생합니다. 핸들러 없으면 500 으로
     * 폴백되므로 RequestBody 검증 실패와 동일한 400 / `INVALID_INPUT` 으로 정렬합니다.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException e) {
        log.warn("[ConstraintViolation] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_INPUT));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestParameter(MissingServletRequestParameterException e) {
        log.warn("[MissingRequestParameter] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.MISSING_REQUEST_PARAMETER.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.MISSING_REQUEST_PARAMETER));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestHeader(MissingRequestHeaderException e) {
        log.warn("[MissingRequestHeader] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.MISSING_REQUEST_PARAMETER.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.MISSING_REQUEST_PARAMETER));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestPart(MissingServletRequestPartException e) {
        log.warn("[MissingRequestPart] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.MISSING_REQUEST_PARAMETER.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.MISSING_REQUEST_PARAMETER));
    }

    /**
     * multipart/form-data 가 아닌 Content-Type 으로 multipart 엔드포인트(예: 파일 업로드)
     * 호출 시 발생합니다. `MissingServletRequestPartException` 과는 다른 예외이므로
     * 별도 핸들러로 매핑하지 않으면 500 으로 폴백됩니다.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException e) {
        log.warn("[MediaTypeNotSupported] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.MISSING_REQUEST_PARAMETER.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.MISSING_REQUEST_PARAMETER));
    }


    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleArgumentTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("[ArgumentTypeMismatch] {}", e.getMessage());
        Class<?> requiredType = e.getRequiredType();
        if (requiredType != null && requiredType.isEnum()) {
            String allowedValues = Arrays.stream(requiredType.getEnumConstants())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            String message = String.format("잘못된 %s 값입니다. 허용값: %s", e.getName(), allowedValues);
            return ResponseEntity
                    .status(ErrorCode.INVALID_TYPE.getHttpStatus())
                    .body(ApiResponse.error(ErrorCode.INVALID_TYPE, message));
        }
        return ResponseEntity
                .status(ErrorCode.INVALID_TYPE.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_TYPE));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("[MessageNotReadable] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.INVALID_TYPE.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_TYPE));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("[MethodNotSupported] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.METHOD_NOT_ALLOWED.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.METHOD_NOT_ALLOWED));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException e, HttpServletRequest request) {
        log.warn("[NoResourceFound] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ResponseEntity
                .status(ErrorCode.RESOURCE_NOT_FOUND.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException e, HttpServletRequest request) {
        log.warn("[DataIntegrityViolation] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ResponseEntity
                .status(ErrorCode.DATASOURCE_IN_USE.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.DATASOURCE_IN_USE));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e, HttpServletRequest request) {
        log.error("[UnhandledException] {}", e.getMessage(), e);
        discordWebhookService.sendErrorNotification(
                request.getMethod(), request.getRequestURI(),
                ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus().value(), e
        );
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR));
    }
}
