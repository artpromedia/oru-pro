# Agent Orchestrator Service

This FastAPI service coordinates the in-process decision agents used by the platform. It exposes REST and WebSocket endpoints for deploying agents, executing actions, and streaming heartbeats. Redis is used for coordination and persistence of activity logs.

## Local development

1. Create a virtual environment with Python 3.11+ and install the service in editable mode:

   ```bash
   pip install -e .
   ```

2. Run the API locally:

   ```bash
   uvicorn main:app --reload
   ```

3. Ensure Redis is running (the default URL points to `redis://localhost:6379`).

## Endpoints

- `GET /health` – service health and agent roster
- `POST /agents/deploy` – register a new configured agent
- `POST /agents/{agent_id}/execute` – invoke an action on an agent
- `GET /agents/{agent_id}/status` – inspect metrics and activity
- `POST /agents/{agent_id}/control` – start/stop/pause/resume an agent
- `WS /ws/agents/{agent_id}` – stream heartbeats and events from an agent

Each built-in domain agent lives under `agents/` and extends the common `BaseAgent` for lifecycle control, telemetry, and Redis event emission.
