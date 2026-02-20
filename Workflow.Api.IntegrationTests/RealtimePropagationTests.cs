using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Workflow.Api.IntegrationTests.Infra;
using Workflow.Api.Realtime;

namespace Workflow.Api.IntegrationTests;

[Collection("api")]
public sealed class RealtimePropagationTests
{
    private readonly WorkflowApiFactory _factory;
    private readonly HttpClient _client;

    public RealtimePropagationTests(TestContainersFixture fx)
    {
        _factory = new WorkflowApiFactory(fx);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task ProjectCreated_Is_Broadcast_To_Joined_Org_Group()
    {
        var email = UniqueEmail("realtime-owner");
        const string password = "Pass@12345";

        await RegisterAsync(email, "Realtime Owner", password);
        var accessToken = await LoginAsync(email, password);
        var orgId = await CreateOrgAsync(accessToken, "Realtime Org");

        var tcs = new TaskCompletionSource<RealtimeEventDto>(TaskCreationOptions.RunContinuationsAsynchronously);

        await using var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(_client.BaseAddress!, "/hubs/org-events"), options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(accessToken)!;
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .WithAutomaticReconnect()
            .Build();

        connection.On<JsonElement>("org_event", raw =>
        {
            var ev = ParseRealtimeEvent(raw);
            if (ev is null) return;
            if (ev.organizationId == orgId && ev.type == "project.created")
            {
                tcs.TrySetResult(ev);
            }
        });

        await connection.StartAsync();
        await connection.InvokeAsync("JoinOrg", orgId);

        var broadcaster = _factory.Services.GetRequiredService<OrgRealtimeBroadcaster>();
        await broadcaster.BroadcastAsync(
            "project.created",
            orgId,
            new { Name = "Realtime Project" },
            DateTimeOffset.UtcNow);

        var ev = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(45));
        Assert.Equal("project.created", ev.type);
        Assert.Equal(orgId, ev.organizationId);
    }

    private async Task RegisterAsync(string email, string displayName, string password)
    {
        var res = await _client.PostAsJsonAsync("/auth/register", new { email, displayName, password });
        res.EnsureSuccessStatusCode();
    }

    private async Task<string> LoginAsync(string email, string password)
    {
        var res = await _client.PostAsJsonAsync("/auth/login", new { email, password });
        res.EnsureSuccessStatusCode();
        var dto = await res.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(dto);
        Assert.False(string.IsNullOrWhiteSpace(dto!.accessToken));
        return dto.accessToken;
    }

    private async Task<Guid> CreateOrgAsync(string accessToken, string name)
    {
        using var client = CreateAuthedClient(accessToken);
        var res = await client.PostAsJsonAsync("/orgs", new { name });
        res.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var idRaw = json.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idRaw, out var orgId));
        return orgId;
    }

    private HttpClient CreateAuthedClient(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private static string UniqueEmail(string prefix)
        => $"{prefix}-{Guid.NewGuid():N}@test.com";

    private static RealtimeEventDto? ParseRealtimeEvent(JsonElement raw)
    {
        static string? TryGetString(JsonElement obj, string name)
            => obj.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;

        var type = TryGetString(raw, "type") ?? TryGetString(raw, "Type");
        var orgRaw = TryGetString(raw, "organizationId") ?? TryGetString(raw, "OrganizationId");
        var occurredRaw = TryGetString(raw, "occurredAtUtc") ?? TryGetString(raw, "OccurredAtUtc");
        var payload = raw.TryGetProperty("payload", out var p1)
            ? p1
            : raw.TryGetProperty("Payload", out var p2)
                ? p2
                : default;

        if (string.IsNullOrWhiteSpace(type) || !Guid.TryParse(orgRaw, out var orgId))
            return null;

        var occurred = DateTimeOffset.UtcNow;
        if (!string.IsNullOrWhiteSpace(occurredRaw) && DateTimeOffset.TryParse(occurredRaw, out var parsed))
            occurred = parsed;

        return new RealtimeEventDto(type!, orgId, payload, occurred);
    }

    private sealed record LoginResponse(string accessToken, string refreshToken, string tokenType);
    private sealed record RealtimeEventDto(string type, Guid organizationId, JsonElement payload, DateTimeOffset occurredAtUtc);
}
