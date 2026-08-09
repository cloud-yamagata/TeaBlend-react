using System.Collections;
using System.Data;
using System.Reflection;
using jp.co.systembase.json;
using jp.co.systembase.report;
using jp.co.systembase.report.data;
using jp.co.systembase.report.renderer.gdi;

namespace TeaBlendReportHelper.RapidReport;

public sealed class RapidReportPreviewService
{
    private readonly IWebHostEnvironment environment;

    public RapidReportPreviewService(IWebHostEnvironment environment)
    {
        this.environment = environment;
    }

    public bool IsTemplateAvailable(string templateFileName)
    {
        return File.Exists(ResolveTemplatePath(templateFileName));
    }

    public void ShowPreview<T>(string templateFileName, IList<T> rows, Action<Report>? configureReport = null)
        where T : class
    {
        var templatePath = ResolveTemplatePath(templateFileName);
        if (!File.Exists(templatePath))
        {
            throw new FileNotFoundException($"帳票定義ファイルが見つかりません: {templatePath}");
        }

        var report = new Report(Json.Read(templatePath));
        configureReport?.Invoke(report);
        var table = ConvertToDataTable(rows);
        report.Fill(new ReportDataSource(table));
        var pages = report.GetPages();
        var printer = new Printer(pages);
        var preview = new FmPrintPreview(printer)
        {
            StartUpZoomFit = true
        };
        preview.ShowDialog();
    }

    private string ResolveTemplatePath(string templateFileName)
    {
        var fromOutput = Path.Combine(AppContext.BaseDirectory, "Templates", templateFileName);
        if (File.Exists(fromOutput))
        {
            return fromOutput;
        }

        return Path.Combine(environment.ContentRootPath, "Templates", templateFileName);
    }

    private static DataTable ConvertToDataTable<T>(IList<T> list) where T : class
    {
        var itemType = typeof(T);
        var table = new DataTable("Package");
        foreach (var property in itemType.GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {
            if (!property.CanRead)
            {
                continue;
            }

            var propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
            table.Columns.Add(property.Name, propertyType);
        }

        foreach (var item in list)
        {
            var row = table.NewRow();
            foreach (var property in itemType.GetProperties(BindingFlags.Instance | BindingFlags.Public))
            {
                if (!property.CanRead)
                {
                    continue;
                }

                var value = property.GetValue(item, null);
                row[property.Name] = value ?? DBNull.Value;
            }

            table.Rows.Add(row);
        }

        return table;
    }
}
