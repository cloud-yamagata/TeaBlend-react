using TeaBlendReportHelper.Api;

namespace TeaBlendReportHelper.Reports;

public sealed class ReportHandlerRegistry
{
    private readonly Dictionary<string, IReportHandler> byId;

    public ReportHandlerRegistry(IEnumerable<IReportHandler> handlers)
    {
        byId = handlers.ToDictionary(x => x.ReportId, StringComparer.OrdinalIgnoreCase);
    }

    public bool TryGet(string reportId, out IReportHandler? handler)
    {
        return byId.TryGetValue(reportId, out handler);
    }

    public IReadOnlyList<ReportDescriptor> Describe()
    {
        return byId.Values
            .OrderBy(x => x.ReportId, StringComparer.OrdinalIgnoreCase)
            .Select(x => new ReportDescriptor(x.ReportId, x.DisplayName, ["preview"]))
            .ToArray();
    }
}
