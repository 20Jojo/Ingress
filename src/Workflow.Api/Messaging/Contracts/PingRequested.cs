namespace Workflow.Api.Messaging.Contracts;

public sealed record PingRequested(string Message, DateTimeOffset SentAtUtc);
