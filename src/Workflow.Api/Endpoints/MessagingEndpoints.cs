using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Workflow.Api.Messaging.Contracts;
using Workflow.Infrastructure.Persistence;

namespace Workflow.Api.Endpoints;

public static class MessagingEndpoints
{
    public static IEndpointRouteBuilder MapMessagingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/messaging").WithTags("Messaging");

        group.RequireAuthorization();

        group.MapPost("/ping", async (
            [FromBody] PingRequest req,
            WorkflowDbContext db,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Message))
                return Results.BadRequest(new { message = "Message is required." });

            await using var tx = await db.Database.BeginTransactionAsync(ct);

            await publish.Publish(
                new PingRequested(req.Message.Trim(), DateTimeOffset.UtcNow),
                ct);

            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return Results.Accepted(value: new { status = "queued_via_outbox" });
        });

        return app;
    }

    public sealed record PingRequest(string Message);
}
