namespace Solomon.Core.Services;

public interface IEnrollmentService
{
    Task<(bool Success, string? Error)> EnrollAsync(string serverBaseUrl, string enrollmentCode, CancellationToken cancellationToken);
}
