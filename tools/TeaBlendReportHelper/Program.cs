using TeaBlendReportHelper.Api;
using TeaBlendReportHelper.RapidReport;
using TeaBlendReportHelper.Reports;
using TeaBlendReportHelper.Services;

const string CorsPolicyName = "LocalTeaBlend";
const string HelperBaseUrl = "http://127.0.0.1:48721";
const string PackageTemplateFileName = "package_report.rrpt";
const string GradeTemplateFileName = "grade_report.rrpt";
const string Factory2GradeTemplateFileName = "grade_report_fa2.rrpt";
const string BlendTemplateFileName = "blend_report.rrpt";

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(HelperBaseUrl);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        CorsPolicyName,
        policy =>
        {
            // 開発 (Vite) / 利用者配布 (npx serve 等) のローカル Origin
            policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8080",
                "http://127.0.0.1:8080"
            );
            policy.AllowAnyHeader();
            policy.AllowAnyMethod();
        }
    );
});

builder.Services.AddSingleton<UiDispatcher>();
builder.Services.AddSingleton<PreviewPayloadStore>();
builder.Services.AddSingleton<RapidReportPreviewService>();
builder.Services.AddSingleton<IReportHandler, PackageReportHandler>();
builder.Services.AddSingleton<IReportHandler, PackageGradeReportHandler>();
builder.Services.AddSingleton<IReportHandler, Factory2ReportHandler>();
builder.Services.AddSingleton<IReportHandler, Factory2GradeReportHandler>();
builder.Services.AddSingleton<ReportHandlerRegistry>();

var app = builder.Build();
app.UseCors(CorsPolicyName);

app.MapGet(
    "/api/v1/health",
    (RapidReportPreviewService rapidReport) => Results.Ok(new
    {
        ok = true,
        app = "TeaBlendReportHelper",
        version = "0.2.0",
        rapidReportReady = rapidReport.IsTemplateAvailable(PackageTemplateFileName),
        gradeReportReady = rapidReport.IsTemplateAvailable(GradeTemplateFileName),
        factory2ReportReady = rapidReport.IsTemplateAvailable(BlendTemplateFileName),
        factory2GradeReportReady = rapidReport.IsTemplateAvailable(Factory2GradeTemplateFileName),
        baseUrl = HelperBaseUrl
    })
);

app.MapGet(
    "/api/v1/reports",
    (ReportHandlerRegistry registry) => Results.Ok(registry.Describe())
);

app.MapPost(
    "/api/v1/reports/{reportId}/preview",
    async (
        string reportId,
        ReportExecuteRequest request,
        ReportHandlerRegistry registry,
        CancellationToken cancellationToken
    ) =>
    {
        if (!registry.TryGet(reportId, out var handler) || handler is null)
        {
            return Results.NotFound(
                new ReportExecuteResponse(
                    Ok: false,
                    RequestId: request.RequestId,
                    Message: $"未対応の帳票IDです: {reportId}",
                    ErrorCode: "REPORT_NOT_FOUND"
                )
            );
        }

        try
        {
            var response = await handler.PreviewAsync(request, cancellationToken);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            return Results.Json(
                new ReportExecuteResponse(
                    Ok: false,
                    RequestId: request.RequestId,
                    Message: ex.Message,
                    ErrorCode: "PREVIEW_FAILED"
                ),
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

app.Run();
