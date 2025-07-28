using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace CRUD_Project.Controllers
{
    public class FileUploadController : Controller
    {
        private readonly IWebHostEnvironment _environment;
        private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB
        private readonly string[] _allowedExtensions = { ".pdf" };

        public FileUploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public IActionResult UploadFile()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Upload(List<IFormFile> files)
        {
            var results = new List<object>();

            if (files == null || files.Count == 0)
            {
                return Json(new { success = false, message = "請選擇要上傳的檔案" });
            }

            // 建立上傳目錄
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "UploadFolder");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            foreach (var file in files)
            {
                try
                {
                    // 驗證檔案
                    var validationResult = ValidateFile(file);
                    if (!validationResult.IsValid)
                    {
                        results.Add(new
                        {
                            fileName = file.FileName,
                            success = false,
                            message = validationResult.ErrorMessage
                        });
                        continue;
                    }

                    // 產生檔案名稱(GUID)
                    //var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    //var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    //var filePath = Path.Combine(uploadsFolder, fileName);

                    // 產生檔案名稱：檔名_年月日時分秒毫秒
                    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    var originalFileName = Path.GetFileNameWithoutExtension(file.FileName);
                    var timestamp = DateTime.Now.ToString("yyyyMMddHHmmssfff");
                    var fileName = $"{originalFileName}_{timestamp}{fileExtension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    // 儲存檔案
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    results.Add(new
                    {
                        fileName = file.FileName,
                        savedFileName = fileName,
                        fileSize = file.Length,
                        fileType = fileExtension,
                        success = true,
                        message = "上傳成功"
                    });
                }
                catch (Exception ex)
                {
                    results.Add(new
                    {
                        fileName = file.FileName,
                        success = false,
                        message = $"上傳失敗: {ex.Message}"
                    });
                }
            }

            return Json(new { success = true, files = results });
        }

        [HttpGet]
        public IActionResult GetUploadedFiles()
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "UploadFolder");
            var files = new List<object>();

            if (Directory.Exists(uploadsFolder))
            {
                var fileInfos = new DirectoryInfo(uploadsFolder).GetFiles()
                    .Where(f => _allowedExtensions.Contains(f.Extension.ToLowerInvariant()))
                    .OrderByDescending(f => f.CreationTime);

                foreach (var fileInfo in fileInfos)
                {
                    files.Add(new
                    {
                        fileName = fileInfo.Name,
                        originalName = fileInfo.Name,
                        fileSize = fileInfo.Length,
                        uploadDate = fileInfo.CreationTime.ToString("yyyy-MM-dd HH:mm:ss"),
                        fileType = fileInfo.Extension.ToLowerInvariant()
                    });
                }
            }

            return Json(files);
        }

        [HttpGet]
        public IActionResult ViewFile(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return NotFound();
            }

            var filePath = Path.Combine(_environment.WebRootPath, "UploadFolder", fileName);
            
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = fileExtension switch
            {
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            return File(fileBytes, contentType);
        }

        [HttpDelete]
        public IActionResult DeleteFile(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return Json(new { success = false, message = "檔案名稱不能為空" });
            }

            try
            {
                var filePath = Path.Combine(_environment.WebRootPath, "UploadFolder", fileName);
                
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Json(new { success = true, message = "檔案刪除成功" });
                }
                else
                {
                    return Json(new { success = false, message = "檔案不存在" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"刪除失敗: {ex.Message}" });
            }
        }

        private ValidationResult ValidateFile(IFormFile file)
        {
            if (file == null)
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "檔案不能為空" };
            }

            if (file.Length == 0)
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "檔案大小不能為0" };
            }

            if (file.Length > _maxFileSize)
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "檔案大小不能超過10MB" };
            }

            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(fileExtension))
            {
                return new ValidationResult { IsValid = false, ErrorMessage = "只允許上傳PDF格式的檔案" };
            }

            return new ValidationResult { IsValid = true };
        }

        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public string ErrorMessage { get; set; } = string.Empty;
        }
    }
}