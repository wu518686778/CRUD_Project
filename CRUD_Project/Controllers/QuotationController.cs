using CRUD_Project.Models;
using CRUD_Project.Services;
using Microsoft.AspNetCore.Mvc;

namespace CRUD_Project.Controllers
{
    public class QuotationController : Controller
    {
        private readonly IPdfService _pdfService;

        public QuotationController(IPdfService pdfService)
        {
            _pdfService = pdfService;
        }

        [HttpGet]
        public IActionResult Create()
        {
            var model = new QuotationViewModel
            {
                QuotationNumber = GenerateQuotationNumber(),
                QuotationDate = DateTime.Today,
                Items = new List<QuotationItem>
                {
                    new QuotationItem()
                }
            };

            return View(model);
        }

        [HttpPost]
        public IActionResult Create(QuotationViewModel model)
        {
            // 移除空的品項
            model.Items = model.Items.Where(x => !string.IsNullOrWhiteSpace(x.ItemName)).ToList();

            if (ModelState.IsValid)
            {
                if (!model.Items.Any())
                {
                    ModelState.AddModelError("", "至少需要一個品項");
                    return View(model);
                }

                // 將模型資料存入 TempData 以供預覽使用
                TempData["QuotationData"] = System.Text.Json.JsonSerializer.Serialize(model);
                return RedirectToAction("Preview");
            }

            return View(model);
        }

        [HttpGet]
        public IActionResult Preview()
        {
            if (TempData["QuotationData"] == null)
            {
                return RedirectToAction("Create");
            }

            var quotationJson = TempData["QuotationData"]?.ToString();
            if (string.IsNullOrEmpty(quotationJson))
            {
                return RedirectToAction("Create");
            }
            var model = System.Text.Json.JsonSerializer.Deserialize<QuotationViewModel>(quotationJson);

            // 保持資料在 TempData 中以供下載使用
            TempData.Keep("QuotationData");

            return View(model);
        }

        [HttpPost]
        public IActionResult GeneratePdf()
        {
            if (TempData["QuotationData"] == null)
            {
                return RedirectToAction("Create");
            }

            var quotationJson = TempData["QuotationData"]?.ToString();
            if (string.IsNullOrEmpty(quotationJson))
            {
                return RedirectToAction("Create");
            }

            var model = System.Text.Json.JsonSerializer.Deserialize<QuotationViewModel>(quotationJson);
            if (model == null)
            {
                TempData["ErrorMessage"] = "報價單資料解析失敗，請重新操作。";
                return RedirectToAction("Create");
            }

            try
            {
                var pdfBytes = _pdfService.GenerateQuotationPdf(model);
                var fileName = $"報價單_{model.QuotationNumber}.pdf";

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                TempData["ErrorMessage"] = $"PDF生成失敗：{ex.Message}";
                return RedirectToAction("Preview");
            }
        }

        [HttpPost]
        public IActionResult BackToEdit()
        {
            if (TempData["QuotationData"] == null)
            {
                return RedirectToAction("Create");
            }

            var quotationJson = TempData["QuotationData"]?.ToString();
            if (string.IsNullOrEmpty(quotationJson))
            {
                return RedirectToAction("Create");
            }
            var model = System.Text.Json.JsonSerializer.Deserialize<QuotationViewModel>(quotationJson);

            return View("Create", model);
        }

        private string GenerateQuotationNumber()
        {
            return $"is-quo-{DateTime.Now:yyyyMMddHHmmssfff}";
        }
    }
}