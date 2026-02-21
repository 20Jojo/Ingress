# Backend Command Reference

Complete command reference for backend/API development in this repository.

## Where to run

Run from repository root:

```powershell
cd C:\Users\Admin\desktop\workflowplatform
```

Primary solution:
- `WorkflowPlatform.sln`

Projects:
- `src/Workflow.Api/Workflow.Api.csproj`
- `src/Workflow.Application/Workflow.Application.csproj`
- `src/Workflow.Domain/Workflow.Domain.csproj`
- `src/Workflow.Infrastructure/Workflow.Infrastructure.csproj`
- `Workflow.Api.IntegrationTests/Workflow.Api.IntegrationTests.csproj`

## .NET Restore / Build / Run

1. Restore all projects

```powershell
dotnet restore WorkflowPlatform.sln
```

What it does:
- Restores NuGet packages for all solution projects.

2. Build solution

```powershell
dotnet build WorkflowPlatform.sln
```

What it does:
- Compiles all projects in Debug configuration.

3. Run API locally (non-Docker)

```powershell
dotnet run --project .\src\Workflow.Api\Workflow.Api.csproj
```

What it does:
- Starts the API using local appsettings/launch profile.

## Test Commands

1. Run all tests in solution

```powershell
dotnet test WorkflowPlatform.sln
```

What it does:
- Executes all test projects in the solution.

2. Run integration tests only

```powershell
dotnet test Workflow.Api.IntegrationTests\Workflow.Api.IntegrationTests.csproj
```

What it does:
- Runs backend API integration tests.
- Uses Testcontainers (requires Docker running).

3. Run one integration test by name

```powershell
dotnet test Workflow.Api.IntegrationTests\Workflow.Api.IntegrationTests.csproj --filter "FullyQualifiedName~RealtimePropagationTests"
```

What it does:
- Executes only matching tests for faster diagnosis.

## Docker Compose Commands (Backend Stack)

Uses `docker-compose.yml` services:
- `postgres`, `redis`, `rabbitmq`, `api`, `otel-collector`, `jaeger`, `prometheus`

1. Build + start all services

```powershell
docker compose up -d --build
```

2. Start stack without rebuild

```powershell
docker compose up -d
```

3. Stop stack

```powershell
docker compose down
```

4. Stop stack and remove volumes (destructive)

```powershell
docker compose down -v
```

What it does:
- Deletes persisted Postgres/Redis data volumes.

## Docker Status / Logs

1. Service status

```powershell
docker compose ps
```

2. General container status

```powershell
docker ps
docker ps -a
```

3. Service logs

```powershell
docker logs workflow-api --tail 200
docker logs workflow-rabbitmq --tail 200
docker logs workflow-postgres --tail 200
```

4. Rebuild/restart API only

```powershell
docker compose build api
docker compose up -d --build api
docker compose restart api
```

## Health / Smoke Checks

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/health/ready
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/swagger
curl.exe -s -o NUL -w "%{http_code}" http://localhost:15672
```

Expected:
- `200` for ready/swagger/Rabbit UI when stack is healthy.

## EF Core Migration Commands

1. Add migration

```powershell
dotnet ef migrations add <Name> -p src\Workflow.Infrastructure\Workflow.Infrastructure.csproj -s src\Workflow.Api\Workflow.Api.csproj -o Persistence/Migrations
```

2. Apply migrations

```powershell
dotnet ef database update -p src\Workflow.Infrastructure\Workflow.Infrastructure.csproj -s src\Workflow.Api\Workflow.Api.csproj
```

3. Container fallback for EF (when host tooling fails)

```powershell
docker run --rm -v "C:\Users\Admin\Desktop\WorkflowPlatform:/src" -w /src --network workflowplatform_default `
  -e ConnectionStrings__WorkflowDb="Host=postgres;Port=5432;Database=workflowdb;Username=workflow;Password=joe@22" `
  -e ConnectionStrings__RabbitMq="amqp://workflow:joe%4022@rabbitmq:5672" `
  mcr.microsoft.com/dotnet/sdk:10.0 bash -lc "dotnet tool install --tool-path /tmp/tools dotnet-ef && dotnet restore src/Workflow.Api/Workflow.Api.csproj && /tmp/tools/dotnet-ef database update -p src/Workflow.Infrastructure/Workflow.Infrastructure.csproj -s src/Workflow.Api/Workflow.Api.csproj"
```

## DB / Queue Utility Commands

1. Open psql and inspect tables

```powershell
docker exec -it workflow-postgres psql -U workflow -d workflowdb -c "\dt"
```

2. Example outbox check

```powershell
docker exec -it workflow-postgres psql -U workflow -d workflowdb -c "SELECT COUNT(*) FROM \"OutboxMessage\";"
```

3. Restart RabbitMQ quickly

```powershell
docker stop workflow-rabbitmq
docker start workflow-rabbitmq
```

## Cleanup Commands

```powershell
docker builder prune -af
docker image prune -af
docker volume prune -f
```

Notes:
- `volume prune` removes only unused volumes.
- Be careful when running in shared environments.

## Important Local URLs/Ports

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Hangfire: `http://localhost:8080/hangfire`
- RabbitMQ UI: `http://localhost:15672`
- Jaeger UI: `http://localhost:16686`
- Prometheus: `http://localhost:9090`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- OTel gRPC: `localhost:4317`
- OTel HTTP: `localhost:4318`

## Recommended Command Order

Local backend validation:

1. `dotnet restore WorkflowPlatform.sln`
2. `dotnet build WorkflowPlatform.sln`
3. `dotnet test Workflow.Api.IntegrationTests\Workflow.Api.IntegrationTests.csproj`

Containerized backend validation:

1. `docker compose up -d --build`
2. Health checks (`/health/ready`, `/swagger`)
3. `dotnet test Workflow.Api.IntegrationTests\Workflow.Api.IntegrationTests.csproj`

Release confidence pass:

1. `dotnet build WorkflowPlatform.sln -c Release`
2. `dotnet test WorkflowPlatform.sln -c Release`
3. Optional smoke checks against Docker stack
