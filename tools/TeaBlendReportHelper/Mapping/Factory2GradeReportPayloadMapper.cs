using System.Globalization;
using System.Text.Json;
using TeaBlendReportHelper.Models;

namespace TeaBlendReportHelper.Mapping;

public static class Factory2GradeReportPayloadMapper
{
    public static List<GradeReportData> Map(JsonElement payload)
    {
        var rows = new List<GradeReportData>();

        if (!payload.TryGetProperty("rows", out var rowsElement) || rowsElement.ValueKind != JsonValueKind.Array)
        {
            return rows;
        }

        foreach (var rowElement in rowsElement.EnumerateArray())
        {
            rows.Add(MapRow(rowElement));
        }

        return rows;
    }

    private static GradeReportData MapRow(JsonElement row)
    {
        return new GradeReportData
        {
            lot_no = ParseInt(GetString(row, "lot_no")),
            product_no = ParseInt(GetString(row, "product_no")),
            lot_name = GetString(row, "lot_name"),
            make_year = GetString(row, "make_year"),
            count = GetString(row, "count"),
            work_date = ParseDate(GetString(row, "work_date")),
            organic_class = GetString(row, "organic_class"),
            unit_weight = ParseDouble(GetString(row, "unit_weight")),
            unit_number = ParseInt(GetString(row, "unit_number")),
            fraction_weight = ParseDouble(GetString(row, "fraction_weight")),
            fraction_number = ParseInt(GetString(row, "fraction_number")),
            complete_quantity = ParseDouble(GetString(row, "complete_quantity")),
            grade_no = ParseInt(GetString(row, "grade_no")),
            process03 = ParseInt(GetString(row, "process03")),
            process02_01 = ParseInt(GetString(row, "process02_01")),
            process02_02 = ParseInt(GetString(row, "process02_02")),
            process02_03 = ParseInt(GetString(row, "process02_03")),
            process02_04 = ParseInt(GetString(row, "process02_04")),
            process02_05 = ParseInt(GetString(row, "process02_05")),
            process02_06 = ParseInt(GetString(row, "process02_06")),
            process02_07 = ParseInt(GetString(row, "process02_07")),
            process02_08 = ParseInt(GetString(row, "process02_08")),
            process02_09 = ParseInt(GetString(row, "process02_09")),
            process02_10 = ParseInt(GetString(row, "process02_10")),
            process04_01 = ParseInt(GetString(row, "process04_01")),
            process04_02 = ParseInt(GetString(row, "process04_02")),
            process04_03 = ParseInt(GetString(row, "process04_03")),
            process04_04 = ParseInt(GetString(row, "process04_04")),
            process04_05 = ParseInt(GetString(row, "process04_05")),
            process04_06 = ParseInt(GetString(row, "process04_06")),
            process04_07 = ParseInt(GetString(row, "process04_07")),
            process04_08 = ParseInt(GetString(row, "process04_08")),
            process04_09 = ParseInt(GetString(row, "process04_09")),
            process04_10 = ParseInt(GetString(row, "process04_10"))
        };
    }

    private static string GetString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value))
        {
            return string.Empty;
        }

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.GetRawText(),
            _ => string.Empty
        };
    }

    private static int ParseInt(string raw)
    {
        return int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) ? value : 0;
    }

    private static double ParseDouble(string raw)
    {
        return double.TryParse(raw.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var value) ? value : 0d;
    }

    private static DateTime ParseDate(string raw)
    {
        if (DateTime.TryParseExact(raw.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
        {
            return value;
        }

        return DateTime.TryParse(raw.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out value) ? value : default;
    }
}
