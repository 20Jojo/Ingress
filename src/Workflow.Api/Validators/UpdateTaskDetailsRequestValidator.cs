using FluentValidation;
using Workflow.Api.Endpoints;

namespace Workflow.Api.Validators;

public sealed class UpdateTaskDetailsRequestValidator : AbstractValidator<UpdateTaskDetailsRequest>
{
    public UpdateTaskDetailsRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(2000);
    }
}
