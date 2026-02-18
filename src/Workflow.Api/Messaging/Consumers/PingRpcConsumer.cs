using MassTransit;
using Workflow.Api.Messaging.Contracts;

namespace Workflow.Api.Messaging.Consumers;

public sealed class PingRpcConsumer : IConsumer<PingRpcRequest>
{
    private readonly ILogger<PingRpcConsumer> _logger;

    public PingRpcConsumer(ILogger<PingRpcConsumer> logger) => _logger = logger;

    public async Task Consume(ConsumeContext<PingRpcRequest> context)
    {
        var reply = $"pong: {context.Message.Message}";

        _logger.LogInformation("PING-RPC handled: {Message}", context.Message.Message);

        await context.RespondAsync(new PingRpcResponse(
            Message: reply,
            ProcessedAtUtc: DateTimeOffset.UtcNow));
    }
}
