using System.ComponentModel.DataAnnotations;

namespace CRUD_Project.Models
{
    public class QuotationViewModel
    {
        [Required(ErrorMessage = "報價單號為必填")]
        [Display(Name = "報價單號")]
        public string QuotationNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "報價日期為必填")]
        [Display(Name = "報價日期")]
        [DataType(DataType.Date)]
        public DateTime QuotationDate { get; set; } = DateTime.Today;

        [Required(ErrorMessage = "公司名稱為必填")]
        [Display(Name = "公司名稱")]
        public string CompanyName { get; set; } = "台積電";

        [Required(ErrorMessage = "聯絡人為必填")]
        [Display(Name = "聯絡人")]
        public string ContactPerson { get; set; } = "吳小明";

        [Required(ErrorMessage = "電話為必填")]
        [Display(Name = "電話")]
        public string Phone { get; set; } = "03-5782258#36680";

        [Required(ErrorMessage = "專案名稱為必填")]
        [Display(Name = "專案名稱")]
        public string ProjectName { get; set; } = "MVC網站開發";

        [Display(Name = "備註")]
        public string Notes { get; set; } = "一、報價單有效期限 20日。\n二、付款方式：訂單成立後100%支付，並於30天內匯入亦思指定帳戶。\n三、報價單簽名回傳即視同貴公司正式訂單。\n四、非新竹地區之交通或住宿費用另計。";

        [Display(Name = "業務負責人")]
        public string SalesManager { get; set; } = "侯佳伶";

        [Display(Name = "業務聯絡電話")]
        public string SalesPhone { get; set; } = "0963-552231";

        [Display(Name = "業務信箱")]
        public string SalesEmail { get; set; } = "idahou@is-land.com.tw";

        public List<QuotationItem> Items { get; set; } = new List<QuotationItem>();

        public decimal TotalAmount => Items.Sum(x => x.Subtotal);
    }

    public class QuotationItem
    {
        [Required(ErrorMessage = "品名規格為必填")]
        [Display(Name = "品名規格")]
        public string ItemName { get; set; } = string.Empty;

        [Required(ErrorMessage = "單位為必填")]
        [Display(Name = "單位")]
        public string Unit { get; set; } = string.Empty;

        [Required(ErrorMessage = "單價為必填")]
        [Display(Name = "單價")]
        [Range(0, double.MaxValue, ErrorMessage = "單價不能為負值")]
        public decimal UnitPrice { get; set; }

        [Required(ErrorMessage = "數量為必填")]
        [Display(Name = "數量")]
        [Range(0, double.MaxValue, ErrorMessage = "數量不能為負值")]
        public int Quantity { get; set; }

        [Display(Name = "備註")]
        public string ItemNotes { get; set; } = string.Empty;

        public decimal Subtotal => UnitPrice * Quantity;
    }
}