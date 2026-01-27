using FluentValidation;
using Workflow.Api.Endpoints;

namespace Workflow.Api.Validators;

public sealed class CreateProjectRequestValidator : AbstractValidator<ProjectEndpoints.CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(120);
    }
}
