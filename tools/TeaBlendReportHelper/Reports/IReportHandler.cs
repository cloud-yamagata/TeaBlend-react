using TeaBlendReportHelper.Api;

namespace TeaBlendReportHelper.Reports;

public interface IReportHandler
{
    string ReportId { get; }

    string DisplayName { get; }

    Task<ReportExecuteResponse> PreviewAsync(ReportExecuteRequest request, CancellationToken cancellationToken);
}
