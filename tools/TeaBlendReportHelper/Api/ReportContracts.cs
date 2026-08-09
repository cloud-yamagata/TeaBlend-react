using System.Text.Json;

namespace TeaBlendReportHelper.Api;

public sealed record ReportExecuteRequest(
    string? RequestId,
    string? ScreenKey,
    string? Mode,
    string? Source,
    JsonElement Payload
);

public sealed record ReportExecuteResponse(
    bool Ok,
    string? RequestId,
    string? Message = null,
    string? ErrorCode = null,
    string? PayloadFile = null
);

public sealed record ReportDescriptor(
    string ReportId,
    string DisplayName,
    string[] Actions
);
