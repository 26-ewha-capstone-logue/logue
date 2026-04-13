from fastapi.testclient import TestClient

import main

app = main.app


def test_health_endpoint() -> None:
    main.check_upstream_health = lambda url, timeout: (True, 200, None)  # type: ignore[assignment]
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["upstream"]["ok"] is True
    assert body["upstream"]["status_code"] == 200
