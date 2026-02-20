using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Workflow.Api.IntegrationTests.Infra;

namespace Workflow.Api.IntegrationTests;

[Collection("api")]
public sealed class AuthAndOrgFlowTests
{
    private readonly WorkflowApiFactory _factory;
    private readonly HttpClient _client;

    public AuthAndOrgFlowTests(TestContainersFixture fx)
    {
        _factory = new WorkflowApiFactory(fx);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Register_Login_CreateOrg_And_ListOwnOrgs_Works()
    {
        var email = UniqueEmail("owner");
        const string password = "Pass@12345";

        await RegisterAsync(email, "Owner", password);
        var login = await LoginAsync(email, password);
        var orgId = await CreateOrgAsync(login.accessToken, "Acme");
        var orgs = await ListOrgsAsync(login.accessToken);

        Assert.Contains(orgs, o => o.id == orgId);
    }

    [Fact]
    public async Task Protected_Endpoint_Requires_Bearer_Token()
    {
        var res = await _client.GetAsync("/orgs");
        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Org_List_Is_Scoped_To_Current_User()
    {
        var owner1 = UniqueEmail("owner1");
        var owner2 = UniqueEmail("owner2");
        const string password = "Pass@12345";

        await RegisterAsync(owner1, "Owner 1", password);
        await RegisterAsync(owner2, "Owner 2", password);

        var login1 = await LoginAsync(owner1, password);
        var login2 = await LoginAsync(owner2, password);

        var org1 = await CreateOrgAsync(login1.accessToken, "Org One");
        var org2 = await CreateOrgAsync(login2.accessToken, "Org Two");

        var user1Orgs = await ListOrgsAsync(login1.accessToken);
        var user2Orgs = await ListOrgsAsync(login2.accessToken);

        Assert.Contains(user1Orgs, o => o.id == org1);
        Assert.DoesNotContain(user1Orgs, o => o.id == org2);

        Assert.Contains(user2Orgs, o => o.id == org2);
        Assert.DoesNotContain(user2Orgs, o => o.id == org1);
    }

    [Fact]
    public async Task OrgMembers_Admin_Endpoint_Returns_Forbidden_For_NonMember()
    {
        var owner = UniqueEmail("owner");
        var outsider = UniqueEmail("outsider");
        const string password = "Pass@12345";

        await RegisterAsync(owner, "Owner", password);
        await RegisterAsync(outsider, "Outsider", password);

        var ownerLogin = await LoginAsync(owner, password);
        var outsiderLogin = await LoginAsync(outsider, password);

        var orgId = await CreateOrgAsync(ownerLogin.accessToken, "RBAC Org");

        using var outsiderClient = _factory.CreateClient();
        outsiderClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", outsiderLogin.accessToken);

        var res = await outsiderClient.GetAsync($"/orgs/{orgId}/members");
        Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);
    }

    private async Task RegisterAsync(string email, string displayName, string password)
    {
        var reg = await _client.PostAsJsonAsync("/auth/register", new { email, displayName, password });
        reg.EnsureSuccessStatusCode();
    }

    private async Task<LoginResponse> LoginAsync(string email, string password)
    {
        var loginRes = await _client.PostAsJsonAsync("/auth/login", new { email, password });
        loginRes.EnsureSuccessStatusCode();

        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.accessToken));
        return login!;
    }

    private async Task<Guid> CreateOrgAsync(string accessToken, string orgName)
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var orgRes = await client.PostAsJsonAsync("/orgs", new { name = orgName });
        orgRes.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await orgRes.Content.ReadAsStreamAsync());
        var idRaw = json.RootElement.GetProperty("id").GetString();
        Assert.True(Guid.TryParse(idRaw, out var id));
        return id;
    }

    private async Task<IReadOnlyList<OrgDto>> ListOrgsAsync(string accessToken)
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var res = await client.GetAsync("/orgs");
        res.EnsureSuccessStatusCode();

        var orgs = await res.Content.ReadFromJsonAsync<List<OrgDto>>();
        Assert.NotNull(orgs);
        return orgs!;
    }

    private static string UniqueEmail(string prefix)
        => $"{prefix}-{Guid.NewGuid():N}@test.com";

    private sealed record LoginResponse(string accessToken, string refreshToken, string tokenType);
    private sealed record OrgDto(Guid id, string name);
}
