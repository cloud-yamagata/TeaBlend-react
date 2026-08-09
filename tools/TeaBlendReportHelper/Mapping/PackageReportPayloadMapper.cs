using System.Globalization;
using System.Text.Json;
using TeaBlendReportHelper.Models;

namespace TeaBlendReportHelper.Mapping;

public static class PackageReportPayloadMapper
{
    public static PackageReportData Map(JsonElement payload)
    {
        var lot1 = GetLotRow(payload, 1);
        var lot2 = GetLotRow(payload, 2);
        var lot3 = GetLotRow(payload, 3);
        var packingStart = SplitTime(GetNestedString(payload, "packingTime", "start"));
        var packingEnd = SplitTime(GetNestedString(payload, "packingTime", "end"));
        var cleaningBeforeStart = SplitTime(GetNestedString(payload, "cleaningTime", "before", "start"));
        var cleaningBeforeEnd = SplitTime(GetNestedString(payload, "cleaningTime", "before", "end"));
        var cleaningAfterStart = SplitTime(GetNestedString(payload, "cleaningTime", "after", "start"));
        var cleaningAfterEnd = SplitTime(GetNestedString(payload, "cleaningTime", "after", "end"));
        var weights = GetWeights(payload);

        return new PackageReportData
        {
            product_no = ParseInt(GetString(payload, "productNo")),
            organic_class = GetString(payload, "organicClass"),
            item_no = ParseInt(GetString(payload, "itemNo")),
            product_name = GetString(payload, "productName"),
            work_date = ParseDate(GetString(payload, "workDate")),
            complete_quantity = ParseInt(GetString(payload, "completeQuantity")),
            sample_quantity = ParseInt(GetString(payload, "sampleQuantity")),
            fail_quantity = ParseInt(GetString(payload, "failQuantity")),
            grade_no = ParseInt(GetString(payload, "gradeNo")),
            part_name = GetNestedString(payload, "useTea", "itemName"),
            part_lot_no_1 = ParseInt(lot1.partLotNo),
            part_lot_no_2 = ParseInt(lot2.partLotNo),
            part_lot_no_3 = ParseInt(lot3.partLotNo),
            out_quantity_1 = ParseDecimal(lot1.outQuantity),
            out_quantity_2 = ParseDecimal(lot2.outQuantity),
            out_quantity_3 = ParseDecimal(lot3.outQuantity),
            rem_quantity_1 = ParseDecimal(lot1.remQuantity),
            rem_quantity_2 = ParseDecimal(lot2.remQuantity),
            rem_quantity_3 = ParseDecimal(lot3.remQuantity),
            temperature = GetString(payload, "temperature"),
            humidity = GetString(payload, "humidity"),
            packing_start_hh = packingStart.hh,
            packing_start_mm = packingStart.mm,
            packing_end_hh = packingEnd.hh,
            packing_end_mm = packingEnd.mm,
            work_before_cleaning_start_hh = cleaningBeforeStart.hh,
            work_before_cleaning_start_mm = cleaningBeforeStart.mm,
            work_before_cleaning_end_hh = cleaningBeforeEnd.hh,
            work_before_cleaning_end_mm = cleaningBeforeEnd.mm,
            work_end_cleaning_start_hh = cleaningAfterStart.hh,
            work_end_cleaning_start_mm = cleaningAfterStart.mm,
            work_end_cleaning_end_hh = cleaningAfterEnd.hh,
            work_end_cleaning_end_mm = cleaningAfterEnd.mm,
            hp500_no1_chk = GetNestedBool(payload, "machineChecks", "hp500No1Chk"),
            hp500_no2_chk = GetNestedBool(payload, "machineChecks", "hp500No2Chk"),
            fr2_chk = GetNestedBool(payload, "machineChecks", "fr2Chk"),
            fpg_chk = GetNestedBool(payload, "machineChecks", "fpgChk"),
            uba_chk = GetNestedBool(payload, "machineChecks", "ubaChk"),
            lift_cleaning_before_chk = GetBeforeAfter(payload, "liftCleaning", true),
            lift_cleaning_after_chk = GetBeforeAfter(payload, "liftCleaning", false),
            lift_operation_before_chk = GetBeforeAfter(payload, "liftOperation", true),
            lift_operation_after_chk = GetBeforeAfter(payload, "liftOperation", false),
            lift_rem_before_chk = GetBeforeAfter(payload, "liftRem", true),
            lift_rem_after_chk = GetBeforeAfter(payload, "liftRem", false),
            packing_filter_before_chk = GetBeforeAfter(payload, "packingFilter", true),
            packing_filter_after_chk = GetBeforeAfter(payload, "packingFilter", false),
            packing_seal_before_chk = GetBeforeAfter(payload, "packingSeal", true),
            packing_seal_after_chk = GetBeforeAfter(payload, "packingSeal", false),
            packing_conveyor_before_chk = GetBeforeAfter(payload, "packingConveyor", true),
            packing_conveyor_after_chk = GetBeforeAfter(payload, "packingConveyor", false),
            packing_magnet_before_chk = GetBeforeAfter(payload, "packingMagnet", true),
            packing_magnet_after_chk = GetBeforeAfter(payload, "packingMagnet", false),
            packing_operation_before_chk = GetBeforeAfter(payload, "packingOperation", true),
            packing_operation_after_chk = GetBeforeAfter(payload, "packingOperation", false),
            packing_rem_before_chk = GetBeforeAfter(payload, "packingRem", true),
            packing_rem_after_chk = GetBeforeAfter(payload, "packingRem", false),
            tool_cleaning_before_chk = GetBeforeAfter(payload, "toolCleaning", true),
            tool_cleaning_after_chk = GetBeforeAfter(payload, "toolCleaning", false),
            uba3_cleaning_before_chk = GetBeforeAfter(payload, "uba3Cleaning", true),
            uba3_cleaning_after_chk = GetBeforeAfter(payload, "uba3Cleaning", false),
            weight_test_before_chk = GetNestedString(payload, "weightTest", "before"),
            weight_test_after_chk = GetNestedString(payload, "weightTest", "after"),
            residual_oxygen_am = GetNestedString(payload, "residualOxygen", "am"),
            residual_oxygen_pm = GetNestedString(payload, "residualOxygen", "pm"),
            weight_no_1 = weights[0].no,
            weight_no_2 = weights[1].no,
            weight_no_3 = weights[2].no,
            weight_no_4 = weights[3].no,
            weight_no_5 = weights[4].no,
            weight_chk_1 = weights[0].value,
            weight_chk_2 = weights[1].value,
            weight_chk_3 = weights[2].value,
            weight_chk_4 = weights[3].value,
            weight_chk_5 = weights[4].value,
            categorys_remarks = GetString(payload, "remarks")
        };
    }

    private readonly record struct LotRowValues(string partLotNo, string outQuantity, string remQuantity);

    private readonly record struct WeightValues(string no, string value);

    private readonly record struct TimeParts(string hh, string mm);

    private static LotRowValues GetLotRow(JsonElement payload, int rowNo)
    {
        if (!payload.TryGetProperty("lotRows", out var lotRows) || lotRows.ValueKind != JsonValueKind.Array)
        {
            return new LotRowValues("", "", "");
        }

        foreach (var row in lotRows.EnumerateArray())
        {
            if (row.TryGetProperty("rowNo", out var rn) && rn.TryGetInt32(out var n) && n == rowNo)
            {
                return new LotRowValues(
                    GetString(row, "partLotNo"),
                    GetString(row, "outQuantity"),
                    GetString(row, "remQuantity")
                );
            }
        }

        return new LotRowValues("", "", "");
    }

    private static WeightValues[] GetWeights(JsonElement payload)
    {
        var defaults = new[]
        {
            new WeightValues("", ""),
            new WeightValues("", ""),
            new WeightValues("", ""),
            new WeightValues("", ""),
            new WeightValues("", "")
        };

        if (!payload.TryGetProperty("weights", out var weights) || weights.ValueKind != JsonValueKind.Array)
        {
            return defaults;
        }

        var index = 0;
        foreach (var weight in weights.EnumerateArray())
        {
            if (index >= defaults.Length) break;
            defaults[index] = new WeightValues(GetString(weight, "no"), GetString(weight, "value"));
            index++;
        }

        return defaults;
    }

    private static bool GetBeforeAfter(JsonElement payload, string key, bool before)
    {
        if (!payload.TryGetProperty("beforeAfterChecks", out var checks) || checks.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        if (!checks.TryGetProperty(key, out var pair) || pair.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var prop = before ? "before" : "after";
        return pair.TryGetProperty(prop, out var value) && value.ValueKind == JsonValueKind.True;
    }

    private static TimeParts SplitTime(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new TimeParts("", "");
        }

        var parts = value.Split(':', 2);
        var hh = parts.Length > 0 ? parts[0].Trim() : "";
        var mm = parts.Length > 1 ? parts[1].Trim() : "";
        if (hh.Length > 0 && int.TryParse(hh, out var h))
        {
            hh = h.ToString(CultureInfo.InvariantCulture);
        }
        if (mm.Length > 0 && int.TryParse(mm, out var m))
        {
            mm = m.ToString("00", CultureInfo.InvariantCulture);
        }
        return new TimeParts(hh, mm);
    }

    private static string GetString(JsonElement root, string propertyName)
    {
        return root.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? string.Empty
            : string.Empty;
    }

    private static string GetNestedString(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var segment in path)
        {
            if (!current.TryGetProperty(segment, out current))
            {
                return string.Empty;
            }
        }

        return current.ValueKind == JsonValueKind.String ? current.GetString() ?? string.Empty : string.Empty;
    }

    private static bool GetNestedBool(JsonElement root, params string[] path)
    {
        var current = root;
        foreach (var segment in path)
        {
            if (!current.TryGetProperty(segment, out current))
            {
                return false;
            }
        }

        return current.ValueKind == JsonValueKind.True;
    }

    private static int ParseInt(string raw)
    {
        return int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) ? value : 0;
    }

    private static decimal ParseDecimal(string raw)
    {
        return decimal.TryParse(raw.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
            ? value
            : 0m;
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
