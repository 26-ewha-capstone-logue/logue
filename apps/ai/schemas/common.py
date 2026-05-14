from typing import Any, Literal

from pydantic import BaseModel


AnalysisType = Literal["COMPARISON", "RANKING"]
DataType = Literal["string", "integer", "double", "boolean", "date", "datetime"]
MetricType = Literal["RATIO", "COUNT", "SUM"]
MessageRole = Literal["USER", "LOGUE"]
SemanticRoleType = Literal[
    "DATE_CRITERIA",
    "MEASURE",
    "DIMENSION",
    "STATUS_CONDITION",
    "FLAG",
    "ID_CRITERIA",
]
SortDirection = Literal["asc", "desc"]
FilterOperator = Literal["=", "!=", ">", "<", ">=", "<=", "in", "not_in"]


class ErrorResponse(BaseModel):
    success: bool = False
    code: str
    message: str
    data: None = None


JsonValue = Any
