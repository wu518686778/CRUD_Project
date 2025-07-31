using CRUD_Project.Models;
using CRUD_Project.Models_FileUpload;
using CRUD_Project.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;     // 手動安裝NuGet -- ConfigurationBuilder會用到這個命名空間
using Microsoft.Extensions.DependencyInjection;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// 註冊 PDF 服務
builder.Services.AddScoped<IPdfService, PdfService>();

// 配置Session (用於TempData)
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// 設定檔案上傳大小限制
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});

// 讀取設定檔的內容
builder.Services.AddDbContext<MvcUserDbContext>(
        options =>
        {
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
        });

// 註冊第二個 DbContext (新增的檔案上傳相關)
builder.Services.AddDbContext<FileUploadDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("FileUploadConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{_ID?}");

app.Run();
