using Microsoft.AspNetCore.Mvc;
using CRUD_Project.Models_FileUpload;

namespace CRUD_Project.Controllers
{
    public class FileUploadController : Controller
    {

        private FileUploadDbContext _db = null!;
        public FileUploadController(FileUploadDbContext DbContext)
        {
            _db = DbContext;
        }
        public IActionResult UploadFile()
        {
            return View();
        }

        [HttpPost]
         [ValidateAntiForgeryToken]
        public IActionResult UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }
            // 處理檔案上傳邏輯
            // ...
            return Ok("File uploaded successfully.");
        }

    }

}
