using System.Text.Json;
using TeaBlendReportHelper.Api;

namespace TeaBlendReportHelper.Services;

public sealed class PreviewPayloadStore
{
    private readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    public async Task<string> SaveAsync(
        string reportId,
        ReportExecuteRequest request,
        CancellationToken cancellationToken
    )
    {
        var baseDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "TeaBlend",
            "ReportHelper",
            "payloads"
        );
        Directory.CreateDirectory(baseDir);

        var requestId = string.IsNullOrWhiteSpace(request.RequestId)
            ? Guid.NewGuid().ToString("D")
            : request.RequestId.Trim();
        var filePath = Path.Combine(baseDir, $"{DateTime.Now:yyyyMMdd_HHmmss}_{reportId}_{requestId}.json");

        await using var stream = File.Create(filePath);
        await JsonSerializer.SerializeAsync(
            stream,
            new
            {
                receivedAt = DateTimeOffset.Now,
                reportId,
                request
            },
            jsonOptions,
            cancellationToken
        );

        return filePath;
    }
}
