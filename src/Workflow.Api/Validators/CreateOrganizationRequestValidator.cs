using FluentValidation;
using Workflow.Api.Contracts.Organizations;

namespace Workflow.Api.Validators;

public sealed class CreateOrganizationRequestValidator : AbstractValidator<CreateOrganizationRequest>
{
    public CreateOrganizationRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);
    }
}
