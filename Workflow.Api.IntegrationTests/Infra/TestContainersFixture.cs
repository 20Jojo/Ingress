using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;
using Workflow.Infrastructure.Persistence;

namespace Workflow.Api.IntegrationTests.Infra;

public sealed class TestContainersFixture : IAsyncLifetime
{
    public PostgreSqlContainer Postgres { get; }
    public RedisContainer Redis { get; }
    public RabbitMqContainer RabbitMq { get; }

    public string PgConnectionString => Postgres.GetConnectionString();
    public string RedisConnectionString => Redis.GetConnectionString();
    public string RabbitMqConnectionString => RabbitMq.GetConnectionString();

    public TestContainersFixture()
    {
        Postgres = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("workflowdb")
            .WithUsername("workflow")
            .WithPassword("workflow")
            .Build();

        Redis = new RedisBuilder()
            .WithImage("redis:7-alpine")
            .Build();

        RabbitMq = new RabbitMqBuilder()
            .WithImage("rabbitmq:3.13-management-alpine")
            .WithUsername("workflow")
            .WithPassword("workflow")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await Postgres.StartAsync();
        await Redis.StartAsync();
        await RabbitMq.StartAsync();

        var options = new DbContextOptionsBuilder<WorkflowDbContext>()
            .UseNpgsql(PgConnectionString)
            .Options;

        await using var db = new WorkflowDbContext(options);
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await RabbitMq.DisposeAsync();
        await Redis.DisposeAsync();
        await Postgres.DisposeAsync();
    }
}
