package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.request.FlowWarningKeyInfo;
import com.capstone.logue.anal.dto.fastapi.request.PredefinedMetricInfo;
import com.capstone.logue.anal.dto.fastapi.request.PreviousMessageInfo;
import com.capstone.logue.anal.dto.fastapi.request.QuestionAnalysisRequest;
import com.capstone.logue.anal.dto.fastapi.request.QuestionCatalogInfo;
import com.capstone.logue.anal.dto.fastapi.request.QuestionContextInfo;
import com.capstone.logue.anal.dto.fastapi.request.QuestionDataSourceColumnInfo;
import com.capstone.logue.anal.dto.fastapi.request.QuestionDataSourceInfo;
import com.capstone.logue.global.entity.AnalysisFlowColumn;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.DataSourceColumn;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.FlowWarningKey;
import com.capstone.logue.global.entity.enums.MetricType;
import com.capstone.logue.global.entity.enums.SemanticRoleType;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * FastAPI {@code POST /v1/llm/analysis-criteria/resolve} 호출용 요청 DTO를 빌드하는 컴포넌트입니다.
 *
 * <p>카탈로그(허용 ENUM·지표·기간·경고 정의)는 빌더 내부 상수로 고정되며, 컬럼별 시맨틱 역할은
 * 같은 플로우의 {@link AnalysisFlowColumn} 매핑이 있으면 사용하고 없으면 기본값 {@code "DIMENSION"} 으로 보냅니다.</p>
 */
@Component
@RequiredArgsConstructor
public class QuestionAnalysisRequestBuilder {

    private static final List<String> SUPPORTED_PERIODS = List.of(
            "today",
            "this_week",
            "last_week",
            "this_month",
            "last_month",
            "this_quarter",
            "last_quarter",
            "this_year",
            "last_year"
    );

    private static final List<PredefinedMetricInfo> PREDEFINED_METRICS = List.of(
            new PredefinedMetricInfo(
                    "conversion_rate",
                    "가입 전환율",
                    MetricType.RATIO.name(),
                    "signup_complete",
                    "landing_sessions"
            ),
            new PredefinedMetricInfo(
                    "total_count",
                    "총 건수",
                    MetricType.COUNT.name(),
                    null,
                    null
            )
    );

    private static final String DEFAULT_SEMANTIC_ROLE = SemanticRoleType.DIMENSION.name();

    /**
     * FastAPI 요청 DTO를 빌드합니다.
     *
     * @param requestId        Spring 이 발급한 요청 추적 ID (보통 jobId 문자열)
     * @param conversationId   대화 ID
     * @param question         현재 사용자 질문 원문
     * @param previousMessages 같은 플로우의 이전 메시지 목록 (시간순)
     * @param dataSource       분석 대상 데이터 소스
     * @param dataSourceColumns 데이터 소스 컬럼 메타데이터 목록
     * @param flowColumns      같은 플로우에서의 컬럼별 시맨틱 역할 매핑 (없으면 기본값 사용)
     * @return FastAPI 전송용 {@link QuestionAnalysisRequest}
     */
    public QuestionAnalysisRequest build(
            String requestId,
            Long conversationId,
            String question,
            List<Message> previousMessages,
            DataSource dataSource,
            List<DataSourceColumn> dataSourceColumns,
            List<AnalysisFlowColumn> flowColumns
    ) {
        Map<Long, String> semanticRoleByColumnId = flowColumns.stream()
                .collect(Collectors.toMap(
                        fc -> fc.getDataSourceColumn().getId(),
                        fc -> fc.getSemanticRole().name(),
                        (left, right) -> left
                ));

        List<QuestionDataSourceColumnInfo> columnInfos = dataSourceColumns.stream()
                .map(col -> new QuestionDataSourceColumnInfo(
                        col.getColumnName(),
                        col.getDataType(),
                        semanticRoleByColumnId.getOrDefault(col.getId(), DEFAULT_SEMANTIC_ROLE),
                        col.getNullRatio(),
                        coerceSampleValues(col.getSampleValues())
                ))
                .collect(Collectors.toList());

        QuestionDataSourceInfo dataSourceInfo = new QuestionDataSourceInfo(
                dataSource.getId(),
                columnInfos
        );

        QuestionContextInfo questionInfo = new QuestionContextInfo(
                question,
                previousMessages.stream()
                        .map(m -> new PreviousMessageInfo(m.getRole().name(), m.getContent()))
                        .collect(Collectors.toList())
        );

        QuestionCatalogInfo catalog = new QuestionCatalogInfo(
                Arrays.stream(AnalysisType.values()).map(Enum::name).collect(Collectors.toList()),
                Arrays.stream(MetricType.values()).map(Enum::name).collect(Collectors.toList()),
                PREDEFINED_METRICS,
                SUPPORTED_PERIODS,
                Arrays.stream(FlowWarningKey.values())
                        .map(k -> new FlowWarningKeyInfo(k.name(), k.getName(), k.getComment()))
                        .collect(Collectors.toList())
        );

        return new QuestionAnalysisRequest(requestId, conversationId, questionInfo, dataSourceInfo, catalog);
    }

    private JsonNode coerceSampleValues(JsonNode sampleValues) {
        return sampleValues;
    }
}
