# WorkflowPlatform Runbook

## Start / Stop
```powershell
docker compose up -d --build    # build images + start all services
docker compose up -d            # start/recreate without rebuilding
docker compose down             # stop/remove containers (keeps volumes/data)
docker compose down -v          # stop/remove containers + volumes (DELETES DB DATA)
```

## Status / Logs
```powershell
docker compose ps                               # service status + ports
docker ps                                       # all running containers
docker ps -a                                    # including exited containers
docker logs workflow-api --tail 200             # API logs
docker logs workflow-rabbitmq --tail 200        # Rabbit logs
docker logs workflow-postgres --tail 200        # Postgres logs
```

## Build / Restart specific service
```powershell
docker compose build api              # build only API image
docker compose up -d --build api      # rebuild + restart only API
docker compose restart api            # restart API without rebuild
```

## Health / Quick checks
```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/health/ready
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/swagger
curl.exe -s -o NUL -w "%{http_code}" http://localhost:15672
```

## Run API locally (non-docker)
```powershell
dotnet run --project .\src\Workflow.Api\Workflow.Api.csproj
```
Note: local `dotnet run` uses launch profile port (currently `5050`), docker API uses `8080`.

## EF migrations (local)
```powershell
dotnet ef migrations add <Name> -p src\Workflow.Infrastructure\Workflow.Infrastructure.csproj -s src\Workflow.Api\Workflow.Api.csproj -o Persistence/Migrations
dotnet ef database update -p src\Workflow.Infrastructure\Workflow.Infrastructure.csproj -s src\Workflow.Api\Workflow.Api.csproj
```

## EF migrations (container fallback)
Use this when local `dotnet ef` fails in the host environment:

```powershell
docker run --rm -v "C:\Users\Admin\Desktop\WorkflowPlatform:/src" -w /src --network workflowplatform_default `
  -e ConnectionStrings__WorkflowDb="Host=postgres;Port=5432;Database=workflowdb;Username=workflow;Password=joe@22" `
  -e ConnectionStrings__RabbitMq="amqp://workflow:joe%4022@rabbitmq:5672" `
  mcr.microsoft.com/dotnet/sdk:10.0 bash -lc "dotnet tool install --tool-path /tmp/tools dotnet-ef && dotnet restore src/Workflow.Api/Workflow.Api.csproj && /tmp/tools/dotnet-ef database update -p src/Workflow.Infrastructure/Workflow.Infrastructure.csproj -s src/Workflow.Api/Workflow.Api.csproj"
```

## RabbitMQ / Postgres helpers
```powershell
docker exec -it workflow-postgres psql -U workflow -d workflowdb -c "\dt"
docker exec -it workflow-postgres psql -U workflow -d workflowdb -c "SELECT COUNT(*) FROM \"OutboxMessage\";"
docker stop workflow-rabbitmq
docker start workflow-rabbitmq
```

## Cleanup
```powershell
docker builder prune -af
docker image prune -af
docker volume prune -f   # only removes UNUSED volumes
```

## Important URLs / Ports
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Hangfire: `http://localhost:8080/hangfire`
- RabbitMQ UI: `http://localhost:15672`
- Jaeger: `http://localhost:16686`
- Prometheus: `http://localhost:9090`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- OTel gRPC: `localhost:4317`
- OTel HTTP: `localhost:4318`
- OTel Prom metrics scrape endpoint: http://localhost:9464/metrics
