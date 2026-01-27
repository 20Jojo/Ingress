using FluentValidation;
using Workflow.Api.Endpoints;

namespace Workflow.Api.Validators;

public sealed class CreateTaskRequestValidator
    : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MinimumLength(3).WithMessage("Task title must be at least 3 characters.")
            .MaximumLength(200).WithMessage("Task title must be at most 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Task description must be at most 2000 characters.")
            .When(x => x.Description is not null);
    }
}
