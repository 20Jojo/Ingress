using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Workflow.Api.IntegrationTests.Infra;

namespace Workflow.Api.IntegrationTests;

[Collection("api")]
public sealed class ApiCriticalPathTests
{
    private readonly WorkflowApiFactory _factory;
    private readonly HttpClient _client;

    public ApiCriticalPathTests(TestContainersFixture fx)
    {
        _factory = new WorkflowApiFactory(fx);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task InviteAccept_AllowsMember_TaskFlow_And_BlocksOutsider()
    {
        var ownerEmail = UniqueEmail("owner");
        var memberEmail = UniqueEmail("member");
        var outsiderEmail = UniqueEmail("outsider");
        const string password = "Pass@12345";

        await RegisterAsync(ownerEmail, "Owner", password);
        await RegisterAsync(memberEmail, "Member", password);
        await RegisterAsync(outsiderEmail, "Outsider", password);

        var ownerToken = await LoginAsync(ownerEmail, password);
        var memberToken = await LoginAsync(memberEmail, password);
        var outsiderToken = await LoginAsync(outsiderEmail, password);

        var orgId = await CreateOrgAsync(ownerToken, "Critical Path Org");
        var projectId = await CreateProjectAsync(ownerToken, orgId, "Critical Path Project");

        var inviteToken = await CreateInviteAsync(ownerToken, orgId, memberEmail, "Member");
        await AcceptInviteAsync(memberToken, inviteToken);

        var taskId = await CreateTaskAsync(memberToken, projectId, "Member task", "Created by invited member");
        Assert.NotEqual(Guid.Empty, taskId);

        var outsiderTasksRes = await GetAsAsync(outsiderToken, $"/projects/{projectId}/tasks");
        Assert.Equal(HttpStatusCode.Forbidden, outsiderTasksRes.StatusCode);

        var assignOutsiderRes = await PatchAsJsonAsync(ownerToken, $"/tasks/{taskId}/assign", new { userId = GetUserIdFromJwt(outsiderToken) });
        Assert.Equal(HttpStatusCode.BadRequest, assignOutsiderRes.StatusCode);
    }

    [Fact]
    public async Task Member_Cannot_Create_Project_Without_AdminRole()
    {
        var ownerEmail = UniqueEmail("owner");
        var memberEmail = UniqueEmail("member");
        const string password = "Pass@12345";

        await RegisterAsync(ownerEmail, "Owner", password);
        await RegisterAsync(memberEmail, "Member", password);

        var ownerToken = await LoginAsync(ownerEmail, password);
        var memberToken = await LoginAsync(memberEmail, password);

        var orgId = await CreateOrgAsync(ownerToken, "Member Role Org");
        var inviteToken = await CreateInviteAsync(ownerToken, orgId, memberEmail, "Member");
        await AcceptInviteAsync(memberToken, inviteToken);

        var createProjectRes = await PostAsJsonAsync(memberToken, $"/orgs/{orgId}/projects", new { name = "Should Fail" });
        Assert.Equal(HttpStatusCode.Forbidden, createProjectRes.StatusCode);
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
        var res = await PostAsJsonAsync(accessToken, "/orgs", new { name });
        res.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var idRaw = json.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idRaw, out var orgId));
        return orgId;
    }

    private async Task<Guid> CreateProjectAsync(string accessToken, Guid orgId, string name)
    {
        var res = await PostAsJsonAsync(accessToken, $"/orgs/{orgId}/projects", new { name });
        res.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var idRaw = json.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idRaw, out var projectId));
        return projectId;
    }

    private async Task<string> CreateInviteAsync(string accessToken, Guid orgId, string email, string role)
    {
        var res = await PostAsJsonAsync(accessToken, $"/orgs/{orgId}/invitations", new { email, role });
        res.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var token = json.RootElement.GetProperty("token").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));
        return token!;
    }

    private async Task AcceptInviteAsync(string accessToken, string inviteToken)
    {
        var res = await PostAsJsonAsync(accessToken, $"/invitations/{inviteToken}/accept", new { });
        res.EnsureSuccessStatusCode();
    }

    private async Task<Guid> CreateTaskAsync(string accessToken, Guid projectId, string title, string? description)
    {
        var res = await PostAsJsonAsync(accessToken, $"/projects/{projectId}/tasks", new { title, description });
        res.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var idRaw = json.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idRaw, out var taskId));
        return taskId;
    }

    private async Task<HttpResponseMessage> PostAsJsonAsync(string accessToken, string path, object body)
    {
        using var client = CreateAuthedClient(accessToken);
        return await client.PostAsJsonAsync(path, body);
    }

    private async Task<HttpResponseMessage> PatchAsJsonAsync(string accessToken, string path, object body)
    {
        using var client = CreateAuthedClient(accessToken);
        return await client.PatchAsJsonAsync(path, body);
    }

    private async Task<HttpResponseMessage> GetAsAsync(string accessToken, string path)
    {
        using var client = CreateAuthedClient(accessToken);
        return await client.GetAsync(path);
    }

    private HttpClient CreateAuthedClient(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private static Guid GetUserIdFromJwt(string accessToken)
    {
        var parts = accessToken.Split('.');
        if (parts.Length < 2) throw new InvalidOperationException("Invalid JWT format.");
        var payloadJson = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(PadBase64(parts[1].Replace('-', '+').Replace('_', '/'))));
        using var doc = JsonDocument.Parse(payloadJson);

        if (doc.RootElement.TryGetProperty("sub", out var sub) && Guid.TryParse(sub.GetString(), out var subGuid))
            return subGuid;
        if (doc.RootElement.TryGetProperty("nameid", out var nameid) && Guid.TryParse(nameid.GetString(), out var nameidGuid))
            return nameidGuid;
        if (doc.RootElement.TryGetProperty("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", out var claim) &&
            Guid.TryParse(claim.GetString(), out var claimGuid))
            return claimGuid;

        throw new InvalidOperationException("Unable to extract user id from token.");
    }

    private static string PadBase64(string input)
        => (input.Length % 4) switch
        {
            2 => input + "==",
            3 => input + "=",
            _ => input
        };

    private static string UniqueEmail(string prefix)
        => $"{prefix}-{Guid.NewGuid():N}@test.com";

    private sealed record LoginResponse(string accessToken, string refreshToken, string tokenType);
}
