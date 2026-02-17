using MassTransit;
using Workflow.Api.Messaging.Contracts;

namespace Workflow.Api.Messaging.Consumers;

public sealed class PingConsumer : IConsumer<PingRequested>
{
    private readonly ILogger<PingConsumer> _logger;

    public PingConsumer(ILogger<PingConsumer> logger) => _logger = logger;

    public Task Consume(ConsumeContext<PingRequested> context)
    {
        _logger.LogInformation("PING consumed: {Message} at {SentAt}",
            context.Message.Message,
            context.Message.SentAtUtc);

        return Task.CompletedTask;
    }
}
