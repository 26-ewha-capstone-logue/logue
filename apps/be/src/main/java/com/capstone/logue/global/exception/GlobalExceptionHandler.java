package com.capstone.logue.global.exception;

import com.capstone.logue.global.discord.DiscordWebhookService;
import com.capstone.logue.global.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestParameter(MissingServletRequestParameterException e) {
        log.warn("[MissingRequestParameter] {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.MISSING_REQUEST_PARAMETER.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.MISSING_REQUEST_PARAMETER));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleArgumentTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("[ArgumentTypeMismatch] {}", e.getMessage());
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
