using TeaBlendReportHelper.Api;
using TeaBlendReportHelper.Mapping;
using TeaBlendReportHelper.Models;
using TeaBlendReportHelper.RapidReport;
using TeaBlendReportHelper.Services;

namespace TeaBlendReportHelper.Reports;

public sealed class PackageReportHandler : IReportHandler
{
    private const string TemplateFileName = "package_report.rrpt";

    private readonly PreviewPayloadStore payloadStore;
    private readonly RapidReportPreviewService rapidReportPreviewService;
    private readonly UiDispatcher uiDispatcher;

    public PackageReportHandler(
        PreviewPayloadStore payloadStore,
        RapidReportPreviewService rapidReportPreviewService,
        UiDispatcher uiDispatcher
    )
    {
        this.payloadStore = payloadStore;
        this.rapidReportPreviewService = rapidReportPreviewService;
        this.uiDispatcher = uiDispatcher;
    }

    public string ReportId => "package_report";

    public string DisplayName => "製造報告書（パッケージ）";

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
                new List<PackageReportData> { package }
            );
            return 0;
        });

        return new ReportExecuteResponse(
            Ok: true,
            RequestId: request.RequestId,
            Message: "製造報告書のプレビューを表示しました。",
            PayloadFile: payloadFile
        );
    }
}
