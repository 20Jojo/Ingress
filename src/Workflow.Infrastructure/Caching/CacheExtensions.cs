using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace Workflow.Infrastructure.Caching;

public static class CacheExtensions
{
    public static async Task<T?> GetOrSetAsync<T>(
        this IDistributedCache cache,
        string key,
        Func<Task<T>> factory,
        TimeSpan ttl,
        CancellationToken ct)
    {
        var cached = await cache.GetStringAsync(key, ct);
        if (cached is not null)
            return JsonSerializer.Deserialize<T>(cached);

        var value = await factory();
        var json = JsonSerializer.Serialize(value);

        await cache.SetStringAsync(
            key,
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            },
            ct
        );

        return value;
    }

    public static Task RemoveAsync(
        this IDistributedCache cache,
        string key,
        CancellationToken ct)
        => cache.RemoveAsync(key, ct);
}
