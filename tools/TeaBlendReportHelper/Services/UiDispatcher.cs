using System.Windows.Forms;

namespace TeaBlendReportHelper.Services;

public sealed class UiDispatcher
{
    public Task RunMessageBoxAsync(string title, string message, MessageBoxIcon icon = MessageBoxIcon.Information)
    {
        return RunAsync(() =>
        {
            MessageBox.Show(
                text: message,
                caption: title,
                buttons: MessageBoxButtons.OK,
                icon: icon
            );
            return 0;
        });
    }

    public Task<T> RunAsync<T>(Func<T> action)
    {
        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);

        var thread = new Thread(() =>
        {
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                tcs.SetResult(action());
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();

        return tcs.Task;
    }
}
