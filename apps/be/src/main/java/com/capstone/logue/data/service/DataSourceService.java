package com.capstone.logue.data.service;

import com.capstone.logue.data.dto.FilePreview;
import com.capstone.logue.data.dto.GetFileResponse;
import com.capstone.logue.data.dto.UploadFileResponse;
import com.capstone.logue.data.exception.DataSourceErrorCode;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.data.repository.UserLookupRepository;
import com.capstone.logue.data.service.CsvPreviewExtractor.ExtractResult;
import com.capstone.logue.data.storage.DataSourceStorage;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * DataSource CRUD 비즈니스 로직 서비스.
 *
 * <p>업로드 / 단건 조회 / 단건·다건 삭제 기능을 제공합니다. 소유자 검증을 포함한 권한 체크는
 * 이 서비스 단에서 수행합니다. 목록 조회는 후속 이슈에서 추가됩니다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataSourceService {

    private static final String SCHEMA_HEADERS = "headers";
    private static final String SCHEMA_PREVIEW_ROWS = "previewRows";

    private final DataSourceRepository dataSourceRepository;
    private final UserLookupRepository userLookupRepository;
    private final DataSourceStorage storage;
    private final CsvPreviewExtractor csvPreviewExtractor;
    private final ObjectMapper objectMapper;

    /**
     * CSV 파일을 업로드해 DataSource 엔티티로 저장합니다.
     *
     * @param userId 업로드 사용자 id
     * @param file   multipart CSV 파일
     * @return 생성된 DataSource id 를 담은 응답 DTO
     */
    @Transactional
    public UploadFileResponse upload(Long userId, MultipartFile file) {
        validateCsv(file);
        User user = loadUser(userId);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            log.error("[DataSourceService] read upload bytes failed", e);
            throw new LogueException(DataSourceErrorCode.STORAGE_ERROR);
        }

        ExtractResult extracted = csvPreviewExtractor.extract(
                new ByteArrayInputStream(bytes),
                CsvPreviewExtractor.DEFAULT_PREVIEW_ROWS
        );

        String storageKey = storage.store(
                userId,
                file.getOriginalFilename(),
                new ByteArrayInputStream(bytes),
                bytes.length,
                file.getContentType()
        );

        DataSource saved = dataSourceRepository.save(DataSource.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .fileSize((long) bytes.length)
                .storageKey(storageKey)
                .schemaJson(buildSchemaJson(extracted.preview()))
                .rowCount(Math.toIntExact(extracted.totalRows()))
                .columnCount(extracted.columnCount())
                .build());

        return new UploadFileResponse(saved.getId());
    }

    /**
     * DataSource 단건 조회.
     *
     * @param userId       요청 사용자 id
     * @param dataSourceId 조회할 DataSource id
     * @return 파일 메타 및 미리보기 포함 응답 DTO
     */
    @Transactional(readOnly = true)
    public GetFileResponse getOne(Long userId, Long dataSourceId) {
        DataSource dataSource = loadOwnedDataSource(userId, dataSourceId);
        FilePreview preview = readPreviewFromSchema(dataSource.getSchemaJson());
        return new GetFileResponse(
                dataSource.getFileName(),
                dataSource.getFileSize(),
                dataSource.getCreatedAt() == null ? null : dataSource.getCreatedAt().toInstant(),
                preview
        );
    }

    /**
     * DataSource 단건 삭제. 스토리지 파일도 best-effort 로 제거합니다.
     */
    @Transactional
    public void deleteOne(Long userId, Long dataSourceId) {
        DataSource dataSource = loadOwnedDataSource(userId, dataSourceId);
        deleteStorageQuietly(dataSource.getStorageKey());
        dataSourceRepository.delete(dataSource);
    }

    /**
     * DataSource 다건 삭제.
     *
     * <p>요청 id 중 하나라도 존재하지 않으면 404, 타 사용자 소유면 403 을 발생시키며
     * 전체 요청을 실패 처리합니다. 모든 id 가 현재 사용자 소유여야 삭제가 수행됩니다.</p>
     */
    @Transactional
    public void deleteMany(Long userId, Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new LogueException(DataSourceErrorCode.NOT_FOUND);
        }
        List<DataSource> found = dataSourceRepository.findAllByIdIn(ids);
        Set<Long> foundIds = found.stream().map(DataSource::getId).collect(java.util.stream.Collectors.toSet());
        for (Long requestedId : ids) {
            if (!foundIds.contains(requestedId)) {
                throw new LogueException(DataSourceErrorCode.NOT_FOUND);
            }
        }
        for (DataSource dataSource : found) {
            if (!dataSource.getUser().getId().equals(userId)) {
                throw new LogueException(DataSourceErrorCode.FORBIDDEN);
            }
        }
        for (DataSource dataSource : found) {
            deleteStorageQuietly(dataSource.getStorageKey());
        }
        dataSourceRepository.deleteAll(found);
    }

    private void validateCsv(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new LogueException(DataSourceErrorCode.INVALID_FILE);
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            throw new LogueException(DataSourceErrorCode.INVALID_FILE);
        }
    }

    private User loadUser(Long userId) {
        return userLookupRepository.findById(userId)
                .orElseThrow(() -> new LogueException(DataSourceErrorCode.FORBIDDEN));
    }

    private DataSource loadOwnedDataSource(Long userId, Long dataSourceId) {
        DataSource dataSource = dataSourceRepository.findById(dataSourceId)
                .orElseThrow(() -> new LogueException(DataSourceErrorCode.NOT_FOUND));
        if (!dataSource.getUser().getId().equals(userId)) {
            throw new LogueException(DataSourceErrorCode.FORBIDDEN);
        }
        return dataSource;
    }

    private void deleteStorageQuietly(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        boolean ok = storage.delete(storageKey);
        if (!ok) {
            log.warn("[DataSourceService] storage delete failed (continuing) key={}", storageKey);
        }
    }

    private JsonNode buildSchemaJson(FilePreview preview) {
        ObjectNode node = objectMapper.createObjectNode();
        node.set(SCHEMA_HEADERS, objectMapper.valueToTree(preview.headers()));
        node.set(SCHEMA_PREVIEW_ROWS, objectMapper.valueToTree(preview.rows()));
        return node;
    }

    private FilePreview readPreviewFromSchema(JsonNode schemaJson) {
        if (schemaJson == null) {
            return new FilePreview(List.of(), List.of());
        }
        try {
            List<String> headers = objectMapper.convertValue(
                    schemaJson.path(SCHEMA_HEADERS),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            List<List<String>> rows = objectMapper.convertValue(
                    schemaJson.path(SCHEMA_PREVIEW_ROWS),
                    objectMapper.getTypeFactory().constructCollectionType(
                            List.class,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                    )
            );
            return new FilePreview(
                    headers == null ? List.of() : headers,
                    rows == null ? List.of() : rows
            );
        } catch (IllegalArgumentException e) {
            log.warn("[DataSourceService] schemaJson parse failed", e);
            return new FilePreview(List.of(), List.of());
        }
    }
}
