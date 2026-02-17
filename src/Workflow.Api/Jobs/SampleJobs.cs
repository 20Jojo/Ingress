using Microsoft.Extensions.Logging;

namespace Workflow.Api.Jobs;

public sealed class SampleJobs
{
    private readonly ILogger<SampleJobs> _log;

    public SampleJobs(ILogger<SampleJobs> log) => _log = log;

    public Task PingAsync()
    {
        _log.LogInformation("Hangfire Ping job ran at {UtcNow}", DateTimeOffset.UtcNow);
        return Task.CompletedTask;
    }
}
