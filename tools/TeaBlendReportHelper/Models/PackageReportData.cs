namespace TeaBlendReportHelper.Models;

/// <summary>
/// 製造報告書（package_report.rrpt）用データ。旧 PackageReport.Models.Package に相当。
/// </summary>
public sealed class PackageReportData
{
    public int product_no { get; set; }
    public string organic_class { get; set; } = "";
    public int item_no { get; set; }
    public string product_name { get; set; } = "";
    public DateTime work_date { get; set; }
    public int complete_quantity { get; set; }
    public int sample_quantity { get; set; }
    public int fail_quantity { get; set; }
    public int grade_no { get; set; }
    public string part_name { get; set; } = "";

    public int part_lot_no_1 { get; set; }
    public int part_lot_no_2 { get; set; }
    public int part_lot_no_3 { get; set; }

    public decimal out_quantity_1 { get; set; }
    public decimal out_quantity_2 { get; set; }
    public decimal out_quantity_3 { get; set; }

    public decimal rem_quantity_1 { get; set; }
    public decimal rem_quantity_2 { get; set; }
    public decimal rem_quantity_3 { get; set; }

    public decimal use_quantity_1 => out_quantity_1 - rem_quantity_1;
    public decimal use_quantity_2 => out_quantity_2 - rem_quantity_2;
    public decimal use_quantity_3 => out_quantity_3 - rem_quantity_3;

    public string best_before_date => work_date == default ? "" : work_date.AddDays(364).ToString("D");

    public string temperature { get; set; } = "";
    public string humidity { get; set; } = "";

    public string packing_start_hh { get; set; } = "";
    public string packing_start_mm { get; set; } = "";
    public string packing_end_hh { get; set; } = "";
    public string packing_end_mm { get; set; } = "";

    public string work_before_cleaning_start_hh { get; set; } = "";
    public string work_before_cleaning_start_mm { get; set; } = "";
    public string work_before_cleaning_end_hh { get; set; } = "";
    public string work_before_cleaning_end_mm { get; set; } = "";

    public string work_end_cleaning_start_hh { get; set; } = "";
    public string work_end_cleaning_start_mm { get; set; } = "";
    public string work_end_cleaning_end_hh { get; set; } = "";
    public string work_end_cleaning_end_mm { get; set; } = "";

    public bool hp500_no1_chk { get; set; }
    public bool hp500_no2_chk { get; set; }
    public bool fr2_chk { get; set; }
    public bool fpg_chk { get; set; }
    public bool uba_chk { get; set; }

    public bool lift_cleaning_before_chk { get; set; }
    public bool lift_cleaning_after_chk { get; set; }
    public bool lift_operation_before_chk { get; set; }
    public bool lift_operation_after_chk { get; set; }
    public bool lift_rem_before_chk { get; set; }
    public bool lift_rem_after_chk { get; set; }

    public bool packing_filter_before_chk { get; set; }
    public bool packing_filter_after_chk { get; set; }
    public bool packing_seal_before_chk { get; set; }
    public bool packing_seal_after_chk { get; set; }
    public bool packing_conveyor_before_chk { get; set; }
    public bool packing_conveyor_after_chk { get; set; }
    public bool packing_magnet_before_chk { get; set; }
    public bool packing_magnet_after_chk { get; set; }

    public bool packing_operation_before_chk { get; set; }
    public bool packing_operation_after_chk { get; set; }
    public bool packing_rem_before_chk { get; set; }
    public bool packing_rem_after_chk { get; set; }

    public bool tool_cleaning_before_chk { get; set; }
    public bool tool_cleaning_after_chk { get; set; }
    public bool uba3_cleaning_before_chk { get; set; }
    public bool uba3_cleaning_after_chk { get; set; }

    public string weight_test_before_chk { get; set; } = "";
    public string weight_test_after_chk { get; set; } = "";

    public string residual_oxygen_am { get; set; } = "";
    public string residual_oxygen_pm { get; set; } = "";

    public string weight_no_1 { get; set; } = "";
    public string weight_no_2 { get; set; } = "";
    public string weight_no_3 { get; set; } = "";
    public string weight_no_4 { get; set; } = "";
    public string weight_no_5 { get; set; } = "";

    public string weight_chk_1 { get; set; } = "";
    public string weight_chk_2 { get; set; } = "";
    public string weight_chk_3 { get; set; } = "";
    public string weight_chk_4 { get; set; } = "";
    public string weight_chk_5 { get; set; } = "";

    public string categorys_remarks { get; set; } = "";
}
