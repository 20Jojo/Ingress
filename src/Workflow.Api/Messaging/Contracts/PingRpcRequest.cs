namespace Workflow.Api.Messaging.Contracts;

public sealed record PingRpcRequest(string Message, DateTimeOffset SentAtUtc);
