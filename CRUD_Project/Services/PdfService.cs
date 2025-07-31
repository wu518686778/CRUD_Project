using CRUD_Project.Models;
using iText.IO.Font;
using iText.IO.Font.Constants;
using iText.IO.Image;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Borders;
using iText.Layout.Element;
using iText.Layout.Properties;

namespace CRUD_Project.Services
{
    public class PdfService : IPdfService
    {
        private readonly IWebHostEnvironment _environment;

        public PdfService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public byte[] GenerateQuotationPdf(QuotationViewModel quotation)
        {
            using var memoryStream = new MemoryStream();

            // 建立PDF文件 - A4橫向
            var writer = new PdfWriter(memoryStream);
            var pdf = new PdfDocument(writer);
            var document = new Document(pdf, iText.Kernel.Geom.PageSize.A4.Rotate());

            // 設定字型為標楷體（使用微軟正黑體作為替代，因為標楷體可能不可用）
            PdfFont font;
            try
            {
                // 嘗試載入標楷體
                font = PdfFontFactory.CreateFont("C:\\Windows\\Fonts\\kaiu.ttf", PdfEncodings.IDENTITY_H);
            }
            catch
            {
                // 如果標楷體不可用，使用微軟正黑體
                try
                {
                    font = PdfFontFactory.CreateFont("C:\\Windows\\Fonts\\msjh.ttc,0", PdfEncodings.IDENTITY_H);
                }
                catch
                {
                    // 最後備選使用內建字型
                    font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
                }
            }

            // 建立標題區域
            var headerTable = new Table(UnitValue.CreatePercentArray(new float[] { 15f, 85f }))
                .UseAllAvailableWidth();

            // 載入Logo
            try
            {
                var logoPath = Path.Combine(_environment.WebRootPath, "images", "Logo.jpg");
                if (File.Exists(logoPath))
                {
                    var logoImage = new Image(ImageDataFactory.Create(logoPath))
                        .SetWidth(60)
                        .SetHeight(60);
                    headerTable.AddCell(new Cell().Add(logoImage).SetBorder(Border.NO_BORDER));
                }
                else
                {
                    headerTable.AddCell(new Cell().Add(new Paragraph("LOGO")).SetFont(font).SetBorder(Border.NO_BORDER));
                }
            }
            catch
            {
                headerTable.AddCell(new Cell().Add(new Paragraph("LOGO")).SetFont(font).SetBorder(Border.NO_BORDER));
            }

            // 公司名稱和報價單標題
            var titleCell = new Cell()
                .Add(new Paragraph("亦思科技(股)公司　報價單")
                    .SetFont(font)
                    .SetFontSize(18)
                    .SetTextAlignment(TextAlignment.LEFT))
                .SetBorder(Border.NO_BORDER);
            headerTable.AddCell(titleCell);

            document.Add(headerTable);
            document.Add(new Paragraph("\n").SetMarginTop(10));

            // 客戶資訊表格
            var infoTable = new Table(UnitValue.CreatePercentArray(new float[] { 20f, 30f, 20f, 30f }))
                .UseAllAvailableWidth()
                .SetMarginBottom(20);

            infoTable.AddCell(CreateInfoCell("公司名稱：", font));
            infoTable.AddCell(CreateInfoCell(quotation.CompanyName, font));
            infoTable.AddCell(CreateInfoCell("報價單號：", font));
            infoTable.AddCell(CreateInfoCell(quotation.QuotationNumber, font));

            infoTable.AddCell(CreateInfoCell("聯絡人：", font));
            infoTable.AddCell(CreateInfoCell(quotation.ContactPerson, font));
            infoTable.AddCell(CreateInfoCell("報價日期：", font));
            infoTable.AddCell(CreateInfoCell(quotation.QuotationDate.ToString("yyyy/MM/dd"), font));

            infoTable.AddCell(CreateInfoCell("電話：", font));
            infoTable.AddCell(CreateInfoCell(quotation.Phone, font));
            infoTable.AddCell(CreateInfoCell("專案名稱：", font));
            infoTable.AddCell(CreateInfoCell(quotation.ProjectName, font));

            document.Add(infoTable);

            // 品項表格
            var itemsTable = new Table(UnitValue.CreatePercentArray(new float[] { 8f, 25f, 10f, 15f, 10f, 15f, 17f }))
                .UseAllAvailableWidth()
                .SetMarginBottom(20);

            // 表頭
            string[] headers = { "項次", "品名規格", "單位", "單價", "數量", "小計", "備註" };
            foreach (var header in headers)
            {
                itemsTable.AddHeaderCell(new Cell()
                    .Add(new Paragraph(header).SetFont(font).SetFontSize(12))
                    .SetBackgroundColor(ColorConstants.LIGHT_GRAY)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetBorder(new SolidBorder(1)));
            }

            // 品項內容
            for (int i = 0; i < quotation.Items.Count; i++)
            {
                var item = quotation.Items[i];

                itemsTable.AddCell(CreateTableCell((i + 1).ToString(), font, TextAlignment.CENTER));
                itemsTable.AddCell(CreateTableCell(item.ItemName, font, TextAlignment.LEFT));
                itemsTable.AddCell(CreateTableCell(item.Unit, font, TextAlignment.CENTER));
                itemsTable.AddCell(CreateTableCell(item.UnitPrice.ToString("N0"), font, TextAlignment.RIGHT));
                itemsTable.AddCell(CreateTableCell(item.Quantity.ToString(), font, TextAlignment.CENTER));
                itemsTable.AddCell(CreateTableCell(item.Subtotal.ToString("N0"), font, TextAlignment.RIGHT));
                itemsTable.AddCell(CreateTableCell(item.ItemNotes, font, TextAlignment.LEFT));
            }

            // 合計行
            itemsTable.AddCell(new Cell(1, 5)
                .Add(new Paragraph("合計").SetFont(font).SetFontSize(12))
                .SetTextAlignment(TextAlignment.CENTER)
                .SetBorder(new SolidBorder(1)));
            itemsTable.AddCell(CreateTableCell($"{quotation.TotalAmount:N0} (未稅)", font, TextAlignment.RIGHT));
            itemsTable.AddCell(CreateTableCell("", font, TextAlignment.LEFT));

            document.Add(itemsTable);

            // 備註區域
            if (!string.IsNullOrEmpty(quotation.Notes))
            {
                document.Add(new Paragraph("備註：").SetFont(font).SetFontSize(12).SetMarginBottom(5));
                var notesLines = quotation.Notes.Split('\n');
                foreach (var line in notesLines)
                {
                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        document.Add(new Paragraph(line.Trim()).SetFont(font).SetFontSize(10).SetMarginLeft(20));
                    }
                }
                document.Add(new Paragraph("\n"));
            }

            // 頁腳簽名區域
            var footerTable = new Table(UnitValue.CreatePercentArray(new float[] { 50f, 50f }))
                .UseAllAvailableWidth()
                .SetMarginTop(30);

            footerTable.AddCell(new Cell()
                .Add(new Paragraph("客戶確認：").SetFont(font).SetFontSize(12))
                .SetBorder(Border.NO_BORDER)
                .SetMinHeight(40));

            var salesInfo = $"業務負責：{quotation.SalesManager}({quotation.SalesPhone})　Mail：{quotation.SalesEmail}";
            footerTable.AddCell(new Cell()
                .Add(new Paragraph(salesInfo).SetFont(font).SetFontSize(10))
                .SetBorder(Border.NO_BORDER)
                .SetTextAlignment(TextAlignment.RIGHT));

            document.Add(footerTable);

            document.Close();
            return memoryStream.ToArray();
        }

        private Cell CreateInfoCell(string text, PdfFont font)
        {
            return new Cell()
                .Add(new Paragraph(text).SetFont(font).SetFontSize(10))
                .SetBorder(Border.NO_BORDER)
                .SetPadding(2);
        }

        private Cell CreateTableCell(string text, PdfFont font, TextAlignment alignment)
        {
            return new Cell()
                .Add(new Paragraph(text).SetFont(font).SetFontSize(10))
                .SetTextAlignment(alignment)
                .SetBorder(new SolidBorder(1))
                .SetPadding(5);
        }
    }
}