using System.Security.Cryptography;
using System.Text;

namespace Workflow.Api.Auth;

public sealed class RefreshTokenService
{
    // returns (rawToken, hashHex)
    public (string rawToken, string hashHex) Generate()
    {
        // 32 bytes => 43-44 chars base64url-ish after encoding; we use hex hash for DB
        var bytes = RandomNumberGenerator.GetBytes(32);
        var raw = Base64UrlEncode(bytes);

        var hash = Sha256Hex(raw);
        return (raw, hash);
    }

    public string Hash(string rawToken) => Sha256Hex(rawToken);

    private static string Sha256Hex(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant(); // 64 chars
    }

    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}
