using Microsoft.AspNetCore.Mvc;
using Workflow.Api.Common;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrganizationEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orgs").WithTags("Organizations");

        // POST /orgs  (BOOTSTRAP OWNER)
        group.MapPost("", async (
            [FromBody] CreateOrganizationRequest req,
            HttpContext http,
            IOrganizationRepository orgs,
            IOrgMemberRepository members,
            IUserRepository users,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            // Require acting user
            var actingUserIdResult = TryGetActingUserId(http);
            if (actingUserIdResult is not null) return actingUserIdResult;
            var actingUserId = GetActingUserId(http);

            // Ensure caller exists as a User
            var actingUser = await users.GetAsync(actingUserId, ct);
            if (actingUser is null)
                return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Organization name is required." });

            // Create org
            var org = new Organization(Guid.NewGuid(), req.Name);

            await orgs.AddAsync(org, ct);

            // BOOTSTRAP: creator becomes Owner
            // Use UTC to avoid Postgres timestamptz offset issues.
            var ownerMember = OrgMember.Create(org.Id, actingUserId, OrgRole.Owner);
            await members.AddAsync(ownerMember, ct);

            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{org.Id}", new
            {
                id = org.Id,
                name = org.Name,
                ownerUserId = actingUserId,
                ownerRole = OrgRole.Owner.ToString()
            });
        });

        // GET /orgs
        group.MapGet("", async (IOrganizationRepository orgs, CancellationToken ct) =>
        {
            var list = await orgs.ListAsync(ct);
            return Results.Ok(list.Select(o => new { o.Id, o.Name }));
        });

        // GET /orgs/{orgId}
        group.MapGet("/{orgId:guid}", async (Guid orgId, IOrganizationRepository orgs, CancellationToken ct) =>
        {
            var org = await orgs.GetAsync(orgId, ct);
            return org is null
                ? Results.NotFound(new { message = "Organization not found." })
                : Results.Ok(new { org.Id, org.Name });
        });

        return app;
    }

    // Keep this record PUBLIC so FluentValidation can find it (your validator error was because it couldn't).
    public sealed record CreateOrganizationRequest(string Name);

    // --- Header helpers ---

    private static IResult? TryGetActingUserId(HttpContext http)
    {
        if (!http.Request.Headers.TryGetValue("X-User-Id", out var raw) ||
            string.IsNullOrWhiteSpace(raw) ||
            !Guid.TryParse(raw.ToString(), out _))
        {
            // If you're using ProblemDetails, return a clean 401 problem
            return Results.Unauthorized();
        }

        return null;
    }

    private static Guid GetActingUserId(HttpContext http)
        => Guid.Parse(http.Request.Headers["X-User-Id"].ToString());
}
