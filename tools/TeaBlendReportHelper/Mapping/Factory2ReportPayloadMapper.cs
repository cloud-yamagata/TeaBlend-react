using System.Globalization;
using System.Text.Json;
using TeaBlendReportHelper.Models;

namespace TeaBlendReportHelper.Mapping;

public static class Factory2ReportPayloadMapper
{
    public static (string ProcessTypeCode, List<BlendReportData> Rows) Map(JsonElement payload)
    {
        var processTypeCode = GetString(payload, "processTypeCode");
        var rows = new List<BlendReportData>();

        if (!payload.TryGetProperty("rows", out var rowsElement) || rowsElement.ValueKind != JsonValueKind.Array)
        {
            return (processTypeCode, rows);
        }

        foreach (var rowElement in rowsElement.EnumerateArray())
        {
            rows.Add(MapRow(rowElement));
        }

        return (processTypeCode, rows);
    }

    public static string ResolveTemplateFileName(string processTypeCode)
    {
        return NormalizeProcessTypeCode(processTypeCode) switch
        {
            "02" => "blend_report.rrpt",
            "03" => "finish_report.rrpt",
            "04" => "firepan_report.rrpt",
            "05" => "blend_report.rrpt",
            _ => "blend_report.rrpt"
        };
    }

    public static string NormalizeProcessTypeCode(string processTypeCode)
    {
        var code = processTypeCode.Trim();
        var colon = code.IndexOf(':');
        if (colon >= 0)
        {
            code = code[..colon].Trim();
        }

        if (int.TryParse(code, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        {
            return value.ToString("00", CultureInfo.InvariantCulture);
        }

        return code;
    }

    private static BlendReportData MapRow(JsonElement row)
    {
        return new BlendReportData
        {
            work_date = ParseDate(GetString(row, "work_date")),
            process_type = GetString(row, "process_type"),
            product_no = ParseInt(GetString(row, "product_no")),
            lot_name = GetString(row, "lot_name"),
            make_year = GetString(row, "make_year"),
            blend_name_base = GetString(row, "blend_name_base"),
            count = GetString(row, "count"),
            organic_class_base = GetString(row, "organic_class_base"),
            unit_weight = ParseDouble(GetString(row, "unit_weight")),
            unit_number = ParseInt(GetString(row, "unit_number")),
            fraction_weight = ParseDouble(GetString(row, "fraction_weight")),
            fraction_number = ParseInt(GetString(row, "fraction_number")),
            complete_quantity = ParseDouble(GetString(row, "complete_quantity")),
            correct_weight = ParseDouble(GetString(row, "correct_weight")),
            remarks_base = GetString(row, "remarks_base"),
            temperature = GetString(row, "temperature"),
            humidity = GetString(row, "humidity"),
            work_start_hh = GetString(row, "work_start_hh"),
            work_start_mm = GetString(row, "work_start_mm"),
            work_end_hh = GetString(row, "work_end_hh"),
            work_end_mm = GetString(row, "work_end_mm"),
            work_before_cleaning_start_hh = GetString(row, "work_before_cleaning_start_hh"),
            work_before_cleaning_start_mm = GetString(row, "work_before_cleaning_start_mm"),
            work_before_cleaning_end_hh = GetString(row, "work_before_cleaning_end_hh"),
            work_before_cleaning_end_mm = GetString(row, "work_before_cleaning_end_mm"),
            work_end_cleaning_start_hh = GetString(row, "work_end_cleaning_start_hh"),
            work_end_cleaning_start_mm = GetString(row, "work_end_cleaning_start_mm"),
            work_end_cleaning_end_hh = GetString(row, "work_end_cleaning_end_hh"),
            work_end_cleaning_end_mm = GetString(row, "work_end_cleaning_end_mm"),
            work_before_cleaning_chk = GetBool(row, "work_before_cleaning_chk"),
            work_after_cleaning_chk = GetBool(row, "work_after_cleaning_chk"),
            device_chk = GetBool(row, "device_chk"),
            operation_chk = GetBool(row, "operation_chk"),
            rest_chk = GetBool(row, "rest_chk"),
            magnet_cleaning_chk = GetBool(row, "magnet_cleaning_chk"),
            use_device_unit1_chk = GetBool(row, "use_device_unit1_chk"),
            use_device_unit2_chk = GetBool(row, "use_device_unit2_chk"),
            use_device_unit3_chk = GetBool(row, "use_device_unit3_chk"),
            packing_case1_chk = GetBool(row, "packing_case1_chk"),
            packing_case2_chk = GetBool(row, "packing_case2_chk"),
            sensual_test_color = GetString(row, "sensual_test_color"),
            sensual_test_taste = GetString(row, "sensual_test_taste"),
            sensual_test_aroma = GetString(row, "sensual_test_aroma"),
            sp1_use_chk = GetBool(row, "sp1_use_chk"),
            sp1_value_1 = GetString(row, "sp1_value_1"),
            sp1_value_2a = GetString(row, "sp1_value_2a"),
            sp1_value_2b = GetString(row, "sp1_value_2b"),
            sp1_value_2c = GetString(row, "sp1_value_2c"),
            sp1_value_3a = GetString(row, "sp1_value_3a"),
            sp1_value_3b = GetString(row, "sp1_value_3b"),
            sp1_value_4 = GetString(row, "sp1_value_4"),
            sp1_value_5 = GetString(row, "sp1_value_5"),
            sp1_value_6a = GetString(row, "sp1_value_6a"),
            sp1_value_6b = GetString(row, "sp1_value_6b"),
            sp2_use_chk = GetBool(row, "sp2_use_chk"),
            sp2_value_1 = GetString(row, "sp2_value_1"),
            sp2_value_2a = GetString(row, "sp2_value_2a"),
            sp2_value_2b = GetString(row, "sp2_value_2b"),
            sp2_value_2c = GetString(row, "sp2_value_2c"),
            sp2_value_2d = GetString(row, "sp2_value_2d"),
            sp2_value_3a = GetString(row, "sp2_value_3a"),
            sp2_value_3b = GetString(row, "sp2_value_3b"),
            sp2_value_4a = GetString(row, "sp2_value_4a"),
            sp2_value_4b = GetString(row, "sp2_value_4b"),
            sp2_value_5 = GetString(row, "sp2_value_5"),
            etc_value_1a = GetString(row, "etc_value_1a"),
            etc_value_1b = GetString(row, "etc_value_1b"),
            etc_value_1c = GetString(row, "etc_value_1c"),
            etc_value_2a = GetString(row, "etc_value_2a"),
            etc_value_2b = GetString(row, "etc_value_2b"),
            etc_value_2c = GetString(row, "etc_value_2c"),
            etc_value_2d = GetString(row, "etc_value_2d"),
            etc_use_chk3a = GetBool(row, "etc_use_chk3a"),
            etc_use_chk3b = GetBool(row, "etc_use_chk3b"),
            etc_value_3 = GetString(row, "etc_value_3"),
            pickup1_name = GetString(row, "pickup1_name"),
            pickup1_weight = GetString(row, "pickup1_weight"),
            pickup1_number = GetString(row, "pickup1_number"),
            pickup1_fraction = GetString(row, "pickup1_fraction"),
            pickup2_name = GetString(row, "pickup2_name"),
            pickup2_weight = GetString(row, "pickup2_weight"),
            pickup2_number = GetString(row, "pickup2_number"),
            pickup2_fraction = GetString(row, "pickup2_fraction"),
            pickup3_name = GetString(row, "pickup3_name"),
            pickup3_weight = GetString(row, "pickup3_weight"),
            pickup3_number = GetString(row, "pickup3_number"),
            pickup3_fraction = GetString(row, "pickup3_fraction"),
            pickup4_name = GetString(row, "pickup4_name"),
            pickup4_weight = GetString(row, "pickup4_weight"),
            pickup4_number = GetString(row, "pickup4_number"),
            pickup4_fraction = GetString(row, "pickup4_fraction"),
            fir_value_1 = GetString(row, "fir_value_1"),
            fir_value_2 = GetString(row, "fir_value_2"),
            fir_value_3a = GetString(row, "fir_value_3a"),
            fir_value_3b = GetString(row, "fir_value_3b"),
            fir_value_4a = GetString(row, "fir_value_4a"),
            fir_value_4b = GetString(row, "fir_value_4b"),
            fir_value_4c = GetString(row, "fir_value_4c"),
            fir_value_5 = GetString(row, "fir_value_5"),
            fir_value_6 = GetString(row, "fir_value_6"),
            fir_value_7 = GetString(row, "fir_value_7"),
            sensual_test_color_before = GetString(row, "sensual_test_color_before"),
            sensual_test_taste_before = GetString(row, "sensual_test_taste_before"),
            sensual_test_aroma_before = GetString(row, "sensual_test_aroma_before"),
            sensual_test_comment_before = GetString(row, "sensual_test_comment_before"),
            sensual_test_color_after = GetString(row, "sensual_test_color_after"),
            sensual_test_taste_after = GetString(row, "sensual_test_taste_after"),
            sensual_test_aroma_after = GetString(row, "sensual_test_aroma_after"),
            sensual_test_comment_after = GetString(row, "sensual_test_comment_after"),
            part_lot_no = GetString(row, "part_lot_no"),
            part_process_type = GetString(row, "part_process_type"),
            part_product_no = GetString(row, "part_product_no"),
            make_year_part = GetString(row, "make_year_part"),
            part_lot_name = GetString(row, "part_lot_name"),
            count_part = GetString(row, "count_part"),
            use_quantity = ParseDouble(GetString(row, "use_quantity")),
            organic_class_part = GetString(row, "organic_class_part"),
            remarks = GetString(row, "remarks")
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
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => string.Empty
        };
    }

    private static bool GetBool(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value))
        {
            return false;
        }

        return value.ValueKind == JsonValueKind.True;
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
