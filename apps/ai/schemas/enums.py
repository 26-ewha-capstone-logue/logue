"""분석 도메인 ENUM 정의.

Spring `com.capstone.logue.global.entity.enums` 와 1:1로 동기화된다.
값(value)을 변경하거나 멤버를 추가할 때는 양쪽을 함께 수정해야 한다.
"""

from enum import StrEnum


class AnalysisType(StrEnum):
    """분석 방식(질문 유형)."""

    COMPARISON = "COMPARISON"
    RANKING = "RANKING"


class MetricType(StrEnum):
    """지표 계산 방식."""

    RATIO = "RATIO"
    COUNT = "COUNT"
    SUM = "SUM"


class DataType(StrEnum):
    """데이터 소스 컬럼의 파싱된 데이터 타입. wire는 소문자."""

    STRING = "string"
    INTEGER = "integer"
    DOUBLE = "double"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"


class SemanticRoleType(StrEnum):
    """데이터 소스 컬럼의 시맨틱 역할."""

    DATE_CRITERIA = "DATE_CRITERIA"
    MEASURE = "MEASURE"
    DIMENSION = "DIMENSION"
    STATUS_CONDITION = "STATUS_CONDITION"
    FLAG = "FLAG"
    ID_CRITERIA = "ID_CRITERIA"


class FlowWarningKey(StrEnum):
    """분석 기준(플로우) 수준 경고 코드."""

    QUESTION_DATA_MISMATCH = "QUESTION_DATA_MISMATCH"
    CRITICAL_NULL_DETECTED = "CRITICAL_NULL_DETECTED"


class MessageRole(StrEnum):
    """대화 메시지 발신 주체."""

    USER = "USER"
    LOGUE = "LOGUE"


class Operator(StrEnum):
    """필터 비교 연산자. 값(value)이 wire 표현."""

    EQ = "="
    NEQ = "!="
    GT = ">"
    LT = "<"
    GTE = ">="
    LTE = "<="
    IN = "in"
    NOT_IN = "not_in"


class SortDirection(StrEnum):
    """정렬 방향."""

    ASC = "asc"
    DESC = "desc"
