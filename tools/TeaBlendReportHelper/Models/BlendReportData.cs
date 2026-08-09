namespace TeaBlendReportHelper.Models;

/// <summary>
/// 第2工場製造報告書（blend/finish/firepan_report.rrpt）用データ。旧 CroudeTea.Models.BlendReport に相当。
/// </summary>
public sealed class BlendReportData
{
    public DateTime work_date { get; set; }
    public string process_type { get; set; } = "";
    public int product_no { get; set; }
    public string lot_name { get; set; } = "";
    public string make_year { get; set; } = "";
    public string blend_name_base { get; set; } = "";
    public string count { get; set; } = "";
    public string organic_class_base { get; set; } = "";
    public double unit_weight { get; set; }
    public int unit_number { get; set; }
    public double fraction_weight { get; set; }
    public int fraction_number { get; set; }
    public double complete_quantity { get; set; }
    public double correct_weight { get; set; }
    public string remarks_base { get; set; } = "";

    public string temperature { get; set; } = "";
    public string humidity { get; set; } = "";
    public string work_start_hh { get; set; } = "";
    public string work_start_mm { get; set; } = "";
    public string work_end_hh { get; set; } = "";
    public string work_end_mm { get; set; } = "";
    public string work_before_cleaning_start_hh { get; set; } = "";
    public string work_before_cleaning_start_mm { get; set; } = "";
    public string work_before_cleaning_end_hh { get; set; } = "";
    public string work_before_cleaning_end_mm { get; set; } = "";
    public string work_end_cleaning_start_hh { get; set; } = "";
    public string work_end_cleaning_start_mm { get; set; } = "";
    public string work_end_cleaning_end_hh { get; set; } = "";
    public string work_end_cleaning_end_mm { get; set; } = "";
    public bool work_before_cleaning_chk { get; set; }
    public bool work_after_cleaning_chk { get; set; }
    public bool device_chk { get; set; }
    public bool operation_chk { get; set; }
    public bool rest_chk { get; set; }
    public bool magnet_cleaning_chk { get; set; }
    public bool use_device_unit1_chk { get; set; }
    public bool use_device_unit2_chk { get; set; }
    public bool use_device_unit3_chk { get; set; }
    public bool packing_case1_chk { get; set; }
    public bool packing_case2_chk { get; set; }

    public string sensual_test_color { get; set; } = "";
    public string sensual_test_taste { get; set; } = "";
    public string sensual_test_aroma { get; set; } = "";

    public bool sp1_use_chk { get; set; }
    public string sp1_value_1 { get; set; } = "";
    public string sp1_value_2a { get; set; } = "";
    public string sp1_value_2b { get; set; } = "";
    public string sp1_value_2c { get; set; } = "";
    public string sp1_value_3a { get; set; } = "";
    public string sp1_value_3b { get; set; } = "";
    public string sp1_value_4 { get; set; } = "";
    public string sp1_value_5 { get; set; } = "";
    public string sp1_value_6a { get; set; } = "";
    public string sp1_value_6b { get; set; } = "";
    public bool sp2_use_chk { get; set; }
    public string sp2_value_1 { get; set; } = "";
    public string sp2_value_2a { get; set; } = "";
    public string sp2_value_2b { get; set; } = "";
    public string sp2_value_2c { get; set; } = "";
    public string sp2_value_2d { get; set; } = "";
    public string sp2_value_3a { get; set; } = "";
    public string sp2_value_3b { get; set; } = "";
    public string sp2_value_4a { get; set; } = "";
    public string sp2_value_4b { get; set; } = "";
    public string sp2_value_5 { get; set; } = "";
    public string etc_value_1a { get; set; } = "";
    public string etc_value_1b { get; set; } = "";
    public string etc_value_1c { get; set; } = "";
    public string etc_value_2a { get; set; } = "";
    public string etc_value_2b { get; set; } = "";
    public string etc_value_2c { get; set; } = "";
    public string etc_value_2d { get; set; } = "";
    public bool etc_use_chk3a { get; set; }
    public bool etc_use_chk3b { get; set; }
    public string etc_value_3 { get; set; } = "";
    public string pickup1_name { get; set; } = "";
    public string pickup1_weight { get; set; } = "";
    public string pickup1_number { get; set; } = "";
    public string pickup1_fraction { get; set; } = "";
    public string pickup2_name { get; set; } = "";
    public string pickup2_weight { get; set; } = "";
    public string pickup2_number { get; set; } = "";
    public string pickup2_fraction { get; set; } = "";
    public string pickup3_name { get; set; } = "";
    public string pickup3_weight { get; set; } = "";
    public string pickup3_number { get; set; } = "";
    public string pickup3_fraction { get; set; } = "";
    public string pickup4_name { get; set; } = "";
    public string pickup4_weight { get; set; } = "";
    public string pickup4_number { get; set; } = "";
    public string pickup4_fraction { get; set; } = "";

    public string fir_value_1 { get; set; } = "";
    public string fir_value_2 { get; set; } = "";
    public string fir_value_3a { get; set; } = "";
    public string fir_value_3b { get; set; } = "";
    public string fir_value_4a { get; set; } = "";
    public string fir_value_4b { get; set; } = "";
    public string fir_value_4c { get; set; } = "";
    public string fir_value_5 { get; set; } = "";
    public string fir_value_6 { get; set; } = "";
    public string fir_value_7 { get; set; } = "";
    public string sensual_test_color_before { get; set; } = "";
    public string sensual_test_taste_before { get; set; } = "";
    public string sensual_test_aroma_before { get; set; } = "";
    public string sensual_test_comment_before { get; set; } = "";
    public string sensual_test_color_after { get; set; } = "";
    public string sensual_test_taste_after { get; set; } = "";
    public string sensual_test_aroma_after { get; set; } = "";
    public string sensual_test_comment_after { get; set; } = "";

    public string part_lot_no { get; set; } = "";
    public string part_process_type { get; set; } = "";
    public string part_product_no { get; set; } = "";
    public string make_year_part { get; set; } = "";
    public string part_lot_name { get; set; } = "";
    public string count_part { get; set; } = "";
    public double use_quantity { get; set; }
    public string organic_class_part { get; set; } = "";
    public string remarks { get; set; } = "";
}
