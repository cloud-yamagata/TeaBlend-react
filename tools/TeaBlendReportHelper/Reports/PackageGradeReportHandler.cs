using TeaBlendReportHelper.Api;
using TeaBlendReportHelper.Mapping;
using TeaBlendReportHelper.Models;
using TeaBlendReportHelper.RapidReport;
using TeaBlendReportHelper.Services;
using jp.co.systembase.report;

namespace TeaBlendReportHelper.Reports;

public sealed class PackageGradeReportHandler : IReportHandler
{
    private const string TemplateFileName = "grade_report.rrpt";

    private readonly PreviewPayloadStore payloadStore;
    private readonly RapidReportPreviewService rapidReportPreviewService;
    private readonly UiDispatcher uiDispatcher;

    public PackageGradeReportHandler(
        PreviewPayloadStore payloadStore,
        RapidReportPreviewService rapidReportPreviewService,
        UiDispatcher uiDispatcher
    )
    {
        this.payloadStore = payloadStore;
        this.rapidReportPreviewService = rapidReportPreviewService;
        this.uiDispatcher = uiDispatcher;
    }

    public string ReportId => "package_grade_report";

    public string DisplayName => "格付確認シート（パッケージ）";

    public async Task<ReportExecuteResponse> PreviewAsync(
        ReportExecuteRequest request,
        CancellationToken cancellationToken
    )
    {
        if (!rapidReportPreviewService.IsTemplateAvailable(TemplateFileName))
        {
            throw new FileNotFoundException(
                $"帳票定義ファイル {TemplateFileName} が見つかりません。Templates 配下を確認してください。"
            );
        }

        var package = PackageReportPayloadMapper.Map(request.Payload);
        var payloadFile = await payloadStore.SaveAsync(ReportId, request, cancellationToken);

        await uiDispatcher.RunAsync(() =>
        {
            rapidReportPreviewService.ShowPreview(
                TemplateFileName,
                new List<PackageReportData> { package },
                report => report.GlobalScope.Add("today", DateTime.Today)
            );
            return 0;
        });

        return new ReportExecuteResponse(
            Ok: true,
            RequestId: request.RequestId,
            Message: "格付表のプレビューを表示しました。",
            PayloadFile: payloadFile
        );
    }
}
