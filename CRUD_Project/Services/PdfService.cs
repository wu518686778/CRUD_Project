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
            var headerTable = new Table(UnitValue.CreatePercentArray(new float[] { 35f, 65f }))
                .UseAllAvailableWidth();

            // 載入Logo
            try
            {
                var logoPath = Path.Combine(_environment.WebRootPath, "images", "Logo.jpg");
                if (File.Exists(logoPath))
                {
                    var logoImage = new Image(ImageDataFactory.Create(logoPath))
                        .ScaleAbsolute(78.225f, 35.7f)
                        .SetHorizontalAlignment(HorizontalAlignment.RIGHT);
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
                    .SimulateBold() // 模擬粗體
                    .SetFontSize(19)
                    .SetTextAlignment(TextAlignment.LEFT))
                    .SetVerticalAlignment(VerticalAlignment.BOTTOM)
                .SetBorder(Border.NO_BORDER);
            headerTable.AddCell(titleCell);

            document.Add(headerTable);
            document.Add(new Paragraph("\n").SetMarginTop(1));

            // 客戶資訊表格
            var infoTable = new Table(UnitValue.CreatePercentArray(new float[] { 10f, 40f, 10f, 40f }))
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

            // 品項表格(%)
            var itemsTable = new Table(UnitValue.CreatePercentArray(new float[] { 5f, 23f, 5f, 10f, 7f, 10f, 40f }))
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

                itemsTable.AddCell(CreateTableCell((i + 1).ToString(), font, TextAlignment.CENTER, VerticalAlignment.MIDDLE));
                itemsTable.AddCell(CreateTableCell(item.ItemName, font, TextAlignment.LEFT, VerticalAlignment.TOP));
                itemsTable.AddCell(CreateTableCell(item.Unit, font, TextAlignment.CENTER, VerticalAlignment.MIDDLE));
                itemsTable.AddCell(CreateTableCell(item.UnitPrice.ToString("N0"), font, TextAlignment.RIGHT, VerticalAlignment.MIDDLE));
                itemsTable.AddCell(CreateTableCell(item.Quantity.ToString(), font, TextAlignment.RIGHT, VerticalAlignment.MIDDLE));
                itemsTable.AddCell(CreateTableCell(item.Subtotal.ToString("N0"), font, TextAlignment.RIGHT, VerticalAlignment.MIDDLE));
                itemsTable.AddCell(CreateTableCell(item.ItemNotes, font, TextAlignment.LEFT, VerticalAlignment.TOP));
            }

            // 合計行
            itemsTable.AddCell(new Cell(1, 5)
                .Add(new Paragraph("合計").SetFont(font).SetFontSize(12))
                .SetTextAlignment(TextAlignment.RIGHT)
                .SetBorder(new SolidBorder(1)));
            itemsTable.AddCell(CreateTableCell($"{quotation.TotalAmount:N0}", font, TextAlignment.RIGHT, VerticalAlignment.MIDDLE));
            itemsTable.AddCell(CreateTableCell("(未稅)", font, TextAlignment.LEFT, VerticalAlignment.MIDDLE));

            document.Add(itemsTable);

            // 備註區域
            if (!string.IsNullOrEmpty(quotation.Notes))
            {
                var notesTable = new Table(UnitValue.CreatePercentArray(new float[] { 10f, 90f }))
                    .UseAllAvailableWidth()
                    .SetMarginBottom(5);

                // 備註標籤（左側）
                var notesLabelCell = new Cell()
                    .Add(new Paragraph("備註：").SetFont(font).SetFontSize(12))
                    .SetBorder(Border.NO_BORDER)
                    .SetVerticalAlignment(VerticalAlignment.TOP)
                    .SetPadding(0);

                // 備註內容（右側）
                var notesContentCell = new Cell()
                    .SetBorder(Border.NO_BORDER)
                    .SetPadding(0);

                // 處理多行備註，移除行間距
                var notesLines = quotation.Notes.Split('\n');
                for (int i = 0; i < notesLines.Length; i++)
                {
                    var line = notesLines[i].Trim();
                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        var paragraph = new Paragraph(line)
                            .SetFont(font)
                            .SetFontSize(12)
                            .SetMargin(0)           // 移除所有邊距
                            .SetPadding(0)          // 移除所有內距
                            .SetMultipliedLeading(1.0f); // 設定緊密行距

                        notesContentCell.Add(paragraph);
                    }
                }

                notesTable.AddCell(notesLabelCell);
                notesTable.AddCell(notesContentCell);
                document.Add(notesTable);
            }

            // 頁腳簽名區域
            var footerTable = new Table(UnitValue.CreatePercentArray(new float[] { 50f, 50f }))
                .UseAllAvailableWidth()
                .SetMarginTop(30);

            footerTable.AddCell(new Cell()
                .Add(new Paragraph("客戶確認：").SetFont(font).SetFontSize(12))
                .SetBorder(Border.NO_BORDER)
                .SetBorderBottom(new SolidBorder(1)) // 設置底線
                .SetMinHeight(40));

            var salesInfo = $"業務負責：{quotation.SalesManager}({quotation.SalesPhone})　Mail：{quotation.SalesEmail}";
            footerTable.AddCell(new Cell()
                .Add(new Paragraph(salesInfo).SetFont(font).SetFontSize(12))
                .SetBorder(Border.NO_BORDER)
                .SetTextAlignment(TextAlignment.RIGHT));

            document.Add(footerTable);

            document.Close();
            return memoryStream.ToArray();
        }

        private Cell CreateInfoCell(string text, PdfFont font)
        {
            return new Cell()
                .Add(new Paragraph(text).SetFont(font).SetFontSize(12))
                .SetBorder(Border.NO_BORDER)
                .SetPadding(1);
        }

        private Cell CreateTableCell(string text, PdfFont font, TextAlignment alignment, VerticalAlignment vertical)
        {
            return new Cell()
                .Add(new Paragraph(text).SetFont(font).SetFontSize(12))
                .SetTextAlignment(alignment)
                .SetVerticalAlignment(vertical)
                .SetBorder(new SolidBorder(1))
                .SetPadding(3);
        }
    }
}