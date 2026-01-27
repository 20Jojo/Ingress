using FluentValidation;

namespace Workflow.Api.Common;

public static class ValidationExtensions
{
    public static async Task<IResult?> ValidateAndReturnProblemIfInvalid<T>(
        T model,
        IValidator<T> validator,
        CancellationToken ct)
    {
        var result = await validator.ValidateAsync(model, ct);
        if (result.IsValid) return null;

        return Results.ValidationProblem(
            result.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()));
    }
}
