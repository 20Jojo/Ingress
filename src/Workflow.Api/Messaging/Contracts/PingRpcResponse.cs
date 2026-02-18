namespace Workflow.Api.Messaging.Contracts;

public sealed record PingRpcResponse(string Message, DateTimeOffset ProcessedAtUtc);
