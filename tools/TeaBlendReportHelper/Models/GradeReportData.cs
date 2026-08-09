namespace TeaBlendReportHelper.Models;

/// <summary>
/// 第2工場格付表（grade_report_fa2.rrpt）用データ。旧 CroudeTea.Models.GradeReport に相当。
/// </summary>
public sealed class GradeReportData
{
    public int lot_no { get; set; }
    public int product_no { get; set; }
    public string lot_name { get; set; } = "";
    public string make_year { get; set; } = "";
    public string count { get; set; } = "";
    public DateTime work_date { get; set; }
    public string organic_class { get; set; } = "";
    public double unit_weight { get; set; }
    public int unit_number { get; set; }
    public double fraction_weight { get; set; }
    public int fraction_number { get; set; }
    public double complete_quantity { get; set; }
    public int grade_no { get; set; }
    public int process03 { get; set; }
    public int process02_01 { get; set; }
    public int process02_02 { get; set; }
    public int process02_03 { get; set; }
    public int process02_04 { get; set; }
    public int process02_05 { get; set; }
    public int process02_06 { get; set; }
    public int process02_07 { get; set; }
    public int process02_08 { get; set; }
    public int process02_09 { get; set; }
    public int process02_10 { get; set; }
    public int process04_01 { get; set; }
    public int process04_02 { get; set; }
    public int process04_03 { get; set; }
    public int process04_04 { get; set; }
    public int process04_05 { get; set; }
    public int process04_06 { get; set; }
    public int process04_07 { get; set; }
    public int process04_08 { get; set; }
    public int process04_09 { get; set; }
    public int process04_10 { get; set; }
}
