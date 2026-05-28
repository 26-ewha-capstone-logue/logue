from fastapi import APIRouter

from schemas.api.file_analysis import FileAnalysisRequest, FileAnalysisResponse
from services.file_analysis_service import analyze_file

router = APIRouter(prefix="/v1/llm", tags=["01 file analysis"])


@router.post(
    "/data-sources/analyze",
    response_model=FileAnalysisResponse,
    summary="Analyze data source columns",
)
async def analyze_data_source(request: FileAnalysisRequest) -> FileAnalysisResponse:
    return await analyze_file(request)
