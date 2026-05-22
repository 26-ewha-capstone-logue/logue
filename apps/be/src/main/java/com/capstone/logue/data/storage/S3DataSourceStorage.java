package com.capstone.logue.data.storage;

import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.global.storage.s3.S3StorageProperties;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * AWS S3 기반 {@link DataSourceStorage} 구현체.
 *
 * <p>버킷 내에서 {@code {prefix}/{userId}/{YYYY/MM/DD}/{UUID}_{fileName}} 경로로 오브젝트를 저장합니다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class S3DataSourceStorage implements DataSourceStorage {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final S3Client s3Client;
    private final S3StorageProperties properties;

    @Override
    public String store(Long userId, String originalName, InputStream input, long size, String contentType) {
        String key = buildKey(userId, originalName);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .contentLength(size)
                .build();

        try {
            s3Client.putObject(request, RequestBody.fromInputStream(input, size));
        } catch (SdkException e) {
            log.error("[S3Storage] put failed key={} bucket={}", key, properties.bucket(), e);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }
        return key;
    }

    @Override
    public InputStream open(String storageKey) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(properties.bucket())
                .key(storageKey)
                .build();
        try {
            return s3Client.getObject(request);
        } catch (NoSuchKeyException e) {
            log.warn("[S3Storage] object not found key={}", storageKey);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        } catch (SdkException e) {
            log.error("[S3Storage] get failed key={}", storageKey, e);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }
    }

    @Override
    public boolean delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return false;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.bucket())
                    .key(storageKey)
                    .build());
            return true;
        } catch (SdkException e) {
            log.warn("[S3Storage] delete failed key={}", storageKey, e);
            return false;
        }
    }

    private String buildKey(Long userId, String originalName) {
        String safeName = sanitizeFileName(originalName);
        String datePath = LocalDate.now(ZoneOffset.UTC).format(DATE_FMT);
        return "%s/%d/%s/%s_%s".formatted(
                properties.prefix(),
                userId,
                datePath,
                UUID.randomUUID(),
                safeName
        );
    }

    private String sanitizeFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "upload.csv";
        }
        return originalName.replaceAll("[\\\\/\\s]+", "_");
    }
}
