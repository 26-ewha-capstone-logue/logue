package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.request.*;
import com.capstone.logue.global.entity.enums.SemanticRoleType;
import com.capstone.logue.global.entity.enums.SourceWarningKey;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DataSource 엔티티의 schemaJson으로부터 FastAPI 파일 분석 요청 DTO를 생성하는 빌더입니다.
 *
 * <p>컬럼별 null_ratio, unique_ratio, sample_values, data_type을 계산하여
 * {@link FileAnalysisRequest}를 구성합니다.</p>
 */
@Component
@RequiredArgsConstructor
public class FileAnalysisRequestBuilder {
    private final ObjectMapper objectMapper;

    /**
     * schemaJson에서 컬럼 메타데이터를 계산하여 {@link FileAnalysisRequest}를 생성합니다.
     *
     * @param requestId    Spring이 생성한 요청 추적 ID
     * @param dataSourceId DataSource ID
     * @param fileName     파일명
     * @param rowCount     전체 행 수
     * @param columnCount  전체 열 수
     * @param schemaJson   DataSource의 schemaJson
     * @return FastAPI 전송용 {@link FileAnalysisRequest}
     */
    public FileAnalysisRequest build(
            Long requestId,
            Long dataSourceId,
            String fileName,
            int rowCount,
            int columnCount,
            JsonNode schemaJson
    ) {
        List<String> headers = extractHeaders(schemaJson);
        List<List<String>> rows = extractRows(schemaJson);

        List<ColumnMetaInfo> columns = headers.stream()
                .map(header -> buildColumnMeta(header, headers, rows))
                .collect(Collectors.toList());

        DataSourceMetaInfo dataSourceMeta = new DataSourceMetaInfo(fileName, rowCount, columnCount, columns);

        List<String> semanticRoles = Arrays.stream(SemanticRoleType.values())
                .map(Enum::name)
                .collect(Collectors.toList());

        List<SourceWarningKeyInfo> warningKeys = Arrays.stream(SourceWarningKey.values())
                .map(w -> new SourceWarningKeyInfo(w.name(), w.getName(), w.getComment()))
                .collect(Collectors.toList());

        CatalogInfo catalog = new CatalogInfo(semanticRoles, warningKeys);

        return new FileAnalysisRequest(requestId, dataSourceMeta, catalog);
    }


    /**
     * 헤더명과 행 데이터를 기반으로 단일 컬럼의 메타데이터를 생성합니다.
     *
     * @param header  컬럼명
     * @param headers 전체 헤더 목록 (컬럼 인덱스 탐색용)
     * @param rows    전체 행 데이터
     * @return 해당 컬럼의 {@link ColumnMetaInfo}
     */
    private ColumnMetaInfo buildColumnMeta(String header, List<String> headers, List<List<String>> rows) {
        int colIndex = headers.indexOf(header);
        List<String> values = extractColumnValues(rows, colIndex);

        return new ColumnMetaInfo(header, inferDataType(values), calcNullRatio(values), calcUniqueRatio(values), extractSampleValues(values));
    }

    /**
     * 특정 컬럼 인덱스에 해당하는 값 목록을 추출합니다.
     *
     * @param rows     전체 행 데이터
     * @param colIndex 추출할 컬럼 인덱스
     * @return 해당 컬럼의 값 목록
     */
    private List<String> extractColumnValues(List<List<String>> rows, int colIndex) {
        return rows.stream()
                .filter(row -> colIndex < row.size())
                .map(row -> row.get(colIndex))
                .collect(Collectors.toList());
    }

    /**
     * NULL 값 비율을 계산합니다.
     *
     * <p>빈 문자열({@code ""}) 및 공백만 있는 문자열도 null로 처리합니다.</p>
     *
     * @param values 컬럼 값 목록
     * @return null 비율 (0.0 ~ 1.0)
     */
    private double calcNullRatio(List<String> values) {
        if (values.isEmpty()) return 0.0;
        long nullCount = values.stream()
                .filter(v -> v == null || v.isBlank())
                .count();
        return (double) nullCount / values.size();
    }

    /**
     * 고유값 비율을 계산합니다.
     *
     * @param values 컬럼 값 목록
     * @return 고유값 비율 (0.0 ~ 1.0)
     */
    private double calcUniqueRatio(List<String> values) {
        if (values.isEmpty()) return 0.0;
        long uniqueCount = values.stream().distinct().count();
        return (double) uniqueCount / values.size();
    }

    /**
     * 대표 샘플 값을 최대 10개 추출합니다.
     *
     * <p>null 및 공백 값은 제외하며, 중복을 제거한 후 추출합니다.</p>
     *
     * @param values 컬럼 값 목록
     * @return 샘플 값 목록 (최대 10개)
     */
    private List<String> extractSampleValues(List<String> values) {
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * 값 목록을 분석하여 데이터 타입을 추론합니다.
     *
     * <p>우선순위: {@code datetime > integer > double > string}</p>
     *
     * @param values 컬럼 값 목록
     * @return 추론된 데이터 타입 문자열 ({@code "datetime"}, {@code "integer"}, {@code "double"}, {@code "string"})
     */
    private String inferDataType(List<String> values) {
        List<String> nonNull = values.stream()
                .filter(v -> v != null && !v.isBlank())
                .collect(Collectors.toList());

        if (nonNull.isEmpty()) return "string";

        if (nonNull.stream().allMatch(this::isDatetime)) return "datetime";
        if (nonNull.stream().allMatch(this::isInteger)) return "integer";
        if (nonNull.stream().allMatch(this::isDouble)) return "double";
        return "string";
    }

    private boolean isDatetime(String value) {
        return value.matches("\\d{4}-\\d{2}-\\d{2}.*");
    }

    private boolean isInteger(String value) {
        try { Long.parseLong(value); return true; }
        catch (NumberFormatException e) { return false; }
    }

    private boolean isDouble(String value) {
        try { Double.parseDouble(value); return true; }
        catch (NumberFormatException e) { return false; }
    }

    /**
     * schemaJson에서 헤더 목록을 추출합니다.
     *
     * @param schemaJson DataSource의 schemaJson
     * @return 헤더(컬럼명) 목록
     */
    private List<String> extractHeaders(JsonNode schemaJson) {
        return objectMapper.convertValue(
                schemaJson.path("headers"),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
        );
    }

    /**
     * schemaJson에서 미리보기 행 데이터를 추출합니다.
     *
     * @param schemaJson DataSource의 schemaJson
     * @return 행 데이터 목록 (각 행은 문자열 목록)
     */
    private List<List<String>> extractRows(JsonNode schemaJson) {
        return objectMapper.convertValue(
                schemaJson.path("previewRows"),
                objectMapper.getTypeFactory().constructCollectionType(
                        List.class,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
                )
        );
    }

}
