using TeaBlendReportHelper.Api;
using TeaBlendReportHelper.Mapping;
using TeaBlendReportHelper.RapidReport;
using TeaBlendReportHelper.Services;

namespace TeaBlendReportHelper.Reports;

public sealed class Factory2ReportHandler : IReportHandler
{
    private readonly PreviewPayloadStore payloadStore;
    private readonly RapidReportPreviewService rapidReportPreviewService;
    private readonly UiDispatcher uiDispatcher;

    public Factory2ReportHandler(
        PreviewPayloadStore payloadStore,
        RapidReportPreviewService rapidReportPreviewService,
        UiDispatcher uiDispatcher
    )
    {
        this.payloadStore = payloadStore;
        this.rapidReportPreviewService = rapidReportPreviewService;
        this.uiDispatcher = uiDispatcher;
    }

    public string ReportId => "factory2_report";

    public string DisplayName => "製造報告書（第2工場）";

    public async Task<ReportExecuteResponse> PreviewAsync(
        ReportExecuteRequest request,
        CancellationToken cancellationToken
    )
    {
        var (processTypeCode, rows) = Factory2ReportPayloadMapper.Map(request.Payload);
        var normalizedProcessType =
            Factory2ReportPayloadMapper.NormalizeProcessTypeCode(processTypeCode);
        if (string.IsNullOrEmpty(normalizedProcessType) && rows.Count > 0)
        {
            normalizedProcessType = Factory2ReportPayloadMapper.NormalizeProcessTypeCode(
                rows[0].process_type
            );
        }

        var templateFileName = Factory2ReportPayloadMapper.ResolveTemplateFileName(normalizedProcessType);

        if (!rapidReportPreviewService.IsTemplateAvailable(templateFileName))
        {
            throw new FileNotFoundException(
                $"帳票定義ファイル {templateFileName} が見つかりません。Templates 配下を確認してください。"
            );
        }

        var payloadFile = await payloadStore.SaveAsync(ReportId, request, cancellationToken);

        await uiDispatcher.RunAsync(() =>
        {
            rapidReportPreviewService.ShowPreview(templateFileName, rows);
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
