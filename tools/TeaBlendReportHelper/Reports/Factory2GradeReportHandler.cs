using TeaBlendReportHelper.Api;
using TeaBlendReportHelper.Mapping;
using TeaBlendReportHelper.RapidReport;
using TeaBlendReportHelper.Services;
using jp.co.systembase.report;

namespace TeaBlendReportHelper.Reports;

public sealed class Factory2GradeReportHandler : IReportHandler
{
    private const string TemplateFileName = "grade_report_fa2.rrpt";

    private readonly PreviewPayloadStore payloadStore;
    private readonly RapidReportPreviewService rapidReportPreviewService;
    private readonly UiDispatcher uiDispatcher;

    public Factory2GradeReportHandler(
        PreviewPayloadStore payloadStore,
        RapidReportPreviewService rapidReportPreviewService,
        UiDispatcher uiDispatcher
    )
    {
        this.payloadStore = payloadStore;
        this.rapidReportPreviewService = rapidReportPreviewService;
        this.uiDispatcher = uiDispatcher;
    }

    public string ReportId => "factory2_grade_report";

    public string DisplayName => "格付確認シート（第2工場）";

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

        var rows = Factory2GradeReportPayloadMapper.Map(request.Payload);
        var payloadFile = await payloadStore.SaveAsync(ReportId, request, cancellationToken);

        await uiDispatcher.RunAsync(() =>
        {
            rapidReportPreviewService.ShowPreview(
                TemplateFileName,
                rows,
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
