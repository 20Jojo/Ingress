using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Workflow.Api.Middleware;

public sealed class ExceptionHandlingMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (BadHttpRequestException ex)
        {
            await WriteProblem(context, StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (JsonException ex)
        {
            await WriteProblem(context, StatusCodes.Status400BadRequest, "Invalid JSON", ex.Message);
        }
        catch (Exception ex)
        {
            // unwrap to the real cause (EF wraps DB errors)
            var baseEx = ex.GetBaseException();
            var detail = baseEx.Message;

            // in Development, include both messages
            if (string.Equals(
                    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    "Development",
                    StringComparison.OrdinalIgnoreCase))
            {
                detail = $"Top: {ex.Message} | Base: {baseEx.Message}";
            }

            await WriteProblem(context, StatusCodes.Status500InternalServerError, "Server Error", detail);
        }
    }

    private static async Task WriteProblem(HttpContext ctx, int status, string title, string detail)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/problem+json";

        var pd = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail
        };

        await ctx.Response.WriteAsJsonAsync(pd);
    }
}
