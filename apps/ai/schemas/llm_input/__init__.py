"""LLM 호출용 정규화 입력 DTO.

API 요청 DTO(`schemas.api.*`) 에서 LLM 판단에 불필요한 필드를 제거한 형태.
서비스 레이어가 LLMClient 호출 직전에 `*LLMInput.from_request()` 로 변환해 전달한다.
"""
