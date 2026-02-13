using System.Net.Http.Headers;
using System.Net.Http.Json;
using Workflow.Api.IntegrationTests.Infra;

namespace Workflow.Api.IntegrationTests;

[Collection("api")]
public sealed class AuthAndOrgFlowTests
{
    private readonly HttpClient _client;

    public AuthAndOrgFlowTests(TestContainersFixture fx)
    {
        var factory = new WorkflowApiFactory(fx);
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_Login_CreateOrg_Works()
    {
        var reg = await _client.PostAsJsonAsync("/auth/register", new
        {
            email = "owner@test.com",
            displayName = "Owner",
            password = "Pass@12345"
        });
        reg.EnsureSuccessStatusCode();

        var loginRes = await _client.PostAsJsonAsync("/auth/login", new
        {
            email = "owner@test.com",
            password = "Pass@12345"
        });
        loginRes.EnsureSuccessStatusCode();

        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.accessToken));

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", login.accessToken);

        var orgRes = await _client.PostAsJsonAsync("/orgs", new { name = "Acme" });
        orgRes.EnsureSuccessStatusCode();
    }

    private sealed record LoginResponse(string accessToken, string refreshToken, string tokenType);
}
