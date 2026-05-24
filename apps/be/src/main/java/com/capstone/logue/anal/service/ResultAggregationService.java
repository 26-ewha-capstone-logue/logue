package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.request.ChartDataInfo;
import com.capstone.logue.anal.dto.spring.response.GetQuestionResultResponse;
import com.capstone.logue.data.dto.FilePreview;
import com.capstone.logue.data.service.CsvParser;
import com.capstone.logue.data.storage.DataSourceStorage;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.DoubleNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 확정된 분석 기준({@link AnalysisCriteria}) 으로 DataSource CSV 를 메모리에서 집계해
 * FastAPI 요청용 / 클라이언트 응답용 차트 데이터를 만드는 서비스입니다.
 *
 * <p>MVP 구현이므로 다음 단순화를 적용합니다:</p>
 * <ul>
 *   <li>groupBy 컬럼별로 row 수를 집계해 metric value 로 사용</li>
 *   <li>filters 의 string 파싱은 적용하지 않음 — 전체 행을 사용</li>
 *   <li>sortDirection 만 적용 (집계값 기준), limitNum 적용</li>
 *   <li>탭은 groupBy 첫 컬럼명 한 개로 단순화 (탭 전환 없는 단일 차트)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResultAggregationService {

    private final DataSourceStorage dataSourceStorage;
    private final CsvParser csvParser;
    private final ObjectMapper objectMapper;

    /**
     * AnalysisCriteria 에 따라 DataSource CSV 를 메모리에서 집계합니다.
     *
     * @param criteria   확정된 분석 기준
     * @param dataSource 분석 대상 데이터 소스
     * @return 그룹키 별 집계 결과 (라벨 + 값 목록)
     */
    public AggregationResult aggregate(AnalysisCriteria criteria, DataSource dataSource) {
        List<String> groupBy = jsonArrayToStringList(criteria.getGroupBy());
        if (groupBy.isEmpty()) {
            throw new LogueException(ErrorCode.INVALID_INPUT);
        }

        FilePreview preview;
        try (InputStream in = dataSourceStorage.open(dataSource.getStorageKey())) {
            preview = csvParser.parse(in);
        } catch (Exception e) {
            log.error("[ResultAggregationService] CSV 읽기 실패: dataSourceId={}", dataSource.getId(), e);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }

        List<String> headers = preview.headers();
        for (String column : groupBy) {
            if (!headers.contains(column)) {
                throw new LogueException(ErrorCode.COLUMN_NOT_FOUND);
            }
        }

        List<Integer> groupColumnIndexes = groupBy.stream().map(headers::indexOf).toList();

        Map<List<String>, Long> countsByGroup = new LinkedHashMap<>();
        for (List<String> row : preview.rows()) {
            List<String> key = extractValues(row, groupColumnIndexes);
            countsByGroup.merge(key, 1L, Long::sum);
        }

        List<AggregationRow> aggregated = new ArrayList<>();
        for (Map.Entry<List<String>, Long> entry : countsByGroup.entrySet()) {
            aggregated.add(new AggregationRow(entry.getKey(), entry.getValue().doubleValue()));
        }

        applySort(aggregated, criteria.getSortDirection());
        applyLimit(aggregated, criteria.getLimitNum());

        return new AggregationResult(groupBy, criteria.getMetricName(), aggregated);
    }

    /**
     * 집계 결과를 FastAPI 요청용 {@link ChartDataInfo} 로 변환합니다.
     *
     * <p>{@code columns} 는 groupBy 컬럼명 + metric 컬럼, {@code rows} 는 각 그룹의 값을 차례대로 채웁니다.</p>
     */
    public ChartDataInfo toFastApiChartData(AggregationResult result) {
        List<String> columns = new ArrayList<>(result.groupBy());
        columns.add(result.metricName());

        List<List<JsonNode>> rows = new ArrayList<>();
        for (AggregationRow row : result.rows()) {
            List<JsonNode> values = new ArrayList<>();
            for (String groupValue : row.groupValues()) {
                values.add(new TextNode(groupValue));
            }
            values.add(new DoubleNode(row.value()));
            rows.add(values);
        }

        return new ChartDataInfo(columns, rows);
    }

    /**
     * 집계 결과를 클라이언트 응답용 차트 데이터로 변환합니다.
     *
     * <p>MVP 는 단일 탭(groupBy 첫 컬럼명)으로 노출하며,
     * 라벨은 groupBy 컬럼 값들을 {@code " / "} 로 이어 붙인 문자열입니다.</p>
     */
    public GetQuestionResultResponse.ChartDataInfo toClientChartData(AggregationResult result) {
        String tabName = result.groupBy().isEmpty() ? "기본" : result.groupBy().get(0);

        List<String> labels = new ArrayList<>();
        List<Double> values = new ArrayList<>();
        for (AggregationRow row : result.rows()) {
            labels.add(String.join(" / ", row.groupValues()));
            values.add(row.value());
        }

        GetQuestionResultResponse.SeriesInfo series =
                new GetQuestionResultResponse.SeriesInfo(result.metricName(), values);
        GetQuestionResultResponse.ChartInfo chart =
                new GetQuestionResultResponse.ChartInfo("", labels, List.of(series));
        GetQuestionResultResponse.TabResultInfo tabResult =
                new GetQuestionResultResponse.TabResultInfo(tabName, chart);

        return new GetQuestionResultResponse.ChartDataInfo(
                List.of(tabName),
                tabName,
                List.of(tabResult),
                true
        );
    }

    /**
     * 집계 결과를 {@code analysis_results.chart_data} 컬럼에 저장할 JSON 으로 직렬화합니다.
     */
    public JsonNode toPersistedChartData(GetQuestionResultResponse.ChartDataInfo chartData) {
        return objectMapper.valueToTree(chartData);
    }

    private List<String> jsonArrayToStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> result = new ArrayList<>();
        node.forEach(n -> result.add(n.asText()));
        return result;
    }

    private List<String> extractValues(List<String> row, List<Integer> indexes) {
        List<String> values = new ArrayList<>(indexes.size());
        for (int idx : indexes) {
            values.add(idx < row.size() ? row.get(idx) : "");
        }
        return values;
    }

    private void applySort(List<AggregationRow> rows, String sortDirection) {
        Comparator<AggregationRow> byValue = Comparator.comparingDouble(AggregationRow::value);
        boolean descending = sortDirection != null
                && (sortDirection.equalsIgnoreCase("desc") || sortDirection.contains("높은"));
        if (descending) {
            rows.sort(byValue.reversed());
        } else {
            rows.sort(byValue);
        }
    }

    private void applyLimit(List<AggregationRow> rows, Long limitNum) {
        if (limitNum == null || limitNum <= 0 || rows.size() <= limitNum) return;
        rows.subList(limitNum.intValue(), rows.size()).clear();
    }

    /**
     * 집계 결과 전체입니다.
     */
    public record AggregationResult(
            List<String> groupBy,
            String metricName,
            List<AggregationRow> rows
    ) {
    }

    /**
     * 집계 결과의 단일 행 — groupBy 컬럼 값 목록과 metric 값입니다.
     */
    public record AggregationRow(
            List<String> groupValues,
            double value
    ) {
    }
}
