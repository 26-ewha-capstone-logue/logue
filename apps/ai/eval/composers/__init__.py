"""Case spec → 서비스 layer 호출용 request payload composer.

각 suite (특히 02 question_analysis) 의 평가 케이스는 dataset 참조 + question 같은 high-level
spec 형태이므로, 실제 호출 전에 full request payload 로 변환하는 단계가 필요하다.
"""

from eval.composers.question_analysis import compose_request as compose_question_analysis_request


__all__ = ["compose_question_analysis_request"]
