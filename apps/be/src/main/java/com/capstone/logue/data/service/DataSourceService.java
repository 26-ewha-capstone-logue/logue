package com.capstone.logue.data.service;

import com.capstone.logue.data.dto.DataSourceSummary;
import com.capstone.logue.data.dto.FilePreview;
import com.capstone.logue.data.dto.GetDataSourceListResponse;
import com.capstone.logue.data.dto.GetFileResponse;
import com.capstone.logue.data.dto.SortType;
import com.capstone.logue.data.dto.UploadFileResponse;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.data.repository.UserLookupRepository;
import com.capstone.logue.data.storage.DataSourceStorage;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * DataSource CRUD 비즈니스 로직 서비스.
 *
 * <p>업로드 / 단건 조회 / 단건·다건 삭제 / 목록 조회(정렬·페이지네이션) 기능을 제공합니다.
 * 소유자 검증을 포함한 권한 체크는 이 서비스 단에서 수행합니다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataSourceService {

    private static final String SCHEMA_HEADERS = "headers";
    private static final String SCHEMA_PREVIEW_ROWS = "previewRows";

    /**
     * 목록 조회 한 페이지당 허용되는 최대 항목 수.
     *
     * <p>클라이언트가 과도한 size 값을 넘겨 DB 부하를 유발하는 것을 방지하기 위한 상한입니다.
     * 이 값을 초과하면 {@link ErrorCode#DATASOURCE_INVALID_PAGE_PARAM} 예외가 발생합니다.</p>
     */
    private static final int MAX_PAGE_SIZE = 100;

    private final DataSourceRepository dataSourceRepository;
    private final UserLookupRepository userLookupRepository;
    private final DataSourceStorage storage;
    private final CsvParser csvParser;
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
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }

        FilePreview preview = csvParser.parse(new ByteArrayInputStream(bytes));

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
                .schemaJson(buildSchemaJson(preview))
                .rowCount(preview.rows().size())
                .columnCount(preview.headers().size())
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
     * 특정 사용자의 DataSource 목록을 정렬·페이지네이션 조건에 맞춰 조회합니다.
     *
     * <p>정렬 기준이 {@code null} 이면 {@link SortType#LATEST} 를 기본값으로 사용합니다.
     * {@link SortType#LATEST} 는 업로드 시각 내림차순, {@link SortType#MOST_USED} 는
     * AnalysisFlow 참조 수 내림차순(동률 시 파일명 오름차순) 으로 정렬합니다.</p>
     *
     * <p>{@code page < 0}, {@code size <= 0}, {@code size > }{@value #MAX_PAGE_SIZE} 조건 중
     * 하나라도 해당하면 {@link ErrorCode#DATASOURCE_INVALID_PAGE_PARAM} 예외가 발생합니다.
     * 응답의 {@code sort} 필드에는 기본값 보정이 반영된 값이 그대로 담겨 반환됩니다.</p>
     *
     * @param userId 요청 사용자 id
     * @param sort   정렬 기준 (null 허용, null 이면 LATEST)
     * @param page   0-base 페이지 번호
     * @param size   페이지당 항목 수 (1 이상 {@value #MAX_PAGE_SIZE} 이하)
     * @return 정렬·페이지네이션이 적용된 목록 응답 DTO
     */
    @Transactional(readOnly = true)
    public GetDataSourceListResponse getList(Long userId, SortType sort, int page, int size) {
        if (page < 0 || size <= 0 || size > MAX_PAGE_SIZE) {
            throw new LogueException(ErrorCode.DATASOURCE_INVALID_PAGE_PARAM);
        }
        SortType resolvedSort = SortType.fromNullable(sort);

        Page<DataSource> result;
        if (resolvedSort == SortType.MOST_USED) {
            Pageable pageable = PageRequest.of(page, size);
            result = dataSourceRepository.findAllByUserIdOrderByUsageDesc(userId, pageable);
        } else {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            result = dataSourceRepository.findAllByUserId(userId, pageable);
        }

        List<DataSourceSummary> items = result.getContent().stream()
                .map(DataSourceSummary::from)
                .toList();

        return new GetDataSourceListResponse(
                resolvedSort,
                page,
                size,
                result.getTotalPages(),
                items
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
            throw new LogueException(ErrorCode.DATASOURCE_NOT_FOUND);
        }
        List<DataSource> found = dataSourceRepository.findAllByIdIn(ids);
        Set<Long> foundIds = found.stream().map(DataSource::getId).collect(java.util.stream.Collectors.toSet());
        for (Long requestedId : ids) {
            if (!foundIds.contains(requestedId)) {
                throw new LogueException(ErrorCode.DATASOURCE_NOT_FOUND);
            }
        }
        for (DataSource dataSource : found) {
            if (!dataSource.getUser().getId().equals(userId)) {
                throw new LogueException(ErrorCode.DATASOURCE_FORBIDDEN);
            }
        }
        for (DataSource dataSource : found) {
            deleteStorageQuietly(dataSource.getStorageKey());
        }
        dataSourceRepository.deleteAll(found);
    }

    private void validateCsv(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new LogueException(ErrorCode.DATASOURCE_INVALID_FILE);
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".csv")) {
            throw new LogueException(ErrorCode.DATASOURCE_INVALID_FILE);
        }
    }

    private User loadUser(Long userId) {
        return userLookupRepository.findById(userId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_FORBIDDEN));
    }

    private DataSource loadOwnedDataSource(Long userId, Long dataSourceId) {
        DataSource dataSource = dataSourceRepository.findById(dataSourceId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));
        if (!dataSource.getUser().getId().equals(userId)) {
            throw new LogueException(ErrorCode.DATASOURCE_FORBIDDEN);
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
