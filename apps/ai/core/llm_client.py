class LLMClient:
    """OpenAI SDK boundary for future model-backed implementations."""

    async def complete_json(self, prompt: str) -> dict:
        raise NotImplementedError("LLM integration is not wired in the API structure task.")
