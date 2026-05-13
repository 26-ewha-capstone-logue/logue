from routers.file_analysis import router as file_analysis_router
from routers.question_analysis import router as question_analysis_router
from routers.result_summary import router as result_summary_router

__all__ = [
    "file_analysis_router",
    "question_analysis_router",
    "result_summary_router",
]
