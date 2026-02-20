using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Workflow.Api.IntegrationTests.Infra;

public sealed class WorkflowApiFactory : WebApplicationFactory<Program>
{
    private readonly TestContainersFixture _fx;

    public WorkflowApiFactory(TestContainersFixture fx)
    {
        _fx = fx;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        var apiContentRoot = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "src", "Workflow.Api"));
        var apiWebRoot = Path.Combine(apiContentRoot, "wwwroot");
        Directory.CreateDirectory(apiWebRoot);

        builder.UseSetting(WebHostDefaults.ContentRootKey, apiContentRoot);
        builder.UseSetting(WebHostDefaults.WebRootKey, apiWebRoot);

        builder.ConfigureAppConfiguration((_, config) =>
        {
            var overrides = new Dictionary<string, string?>
            {
                ["ConnectionStrings:WorkflowDb"] = _fx.PgConnectionString,
                ["ConnectionStrings:Redis"] = _fx.RedisConnectionString,
                ["ConnectionStrings:RabbitMq"] = _fx.RabbitMqConnectionString,
                ["Jwt:Issuer"] = "Workflow.Api",
                ["Jwt:Audience"] = "Workflow.Client",
                ["Jwt:SigningKey"] = "CHANGE_ME_TO_A_LONG_RANDOM_DEV_SECRET_50+_CHARS",
                ["Jwt:AccessTokenMinutes"] = "60",
                ["Jwt:RefreshTokenDays"] = "14",
                ["OpenTelemetry:OtlpEndpoint"] = "http://localhost:4317"
            };

            config.AddInMemoryCollection(overrides);
        });
    }
}
