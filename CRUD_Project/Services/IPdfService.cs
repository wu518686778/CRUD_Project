using CRUD_Project.Models;

namespace CRUD_Project.Services
{
    public interface IPdfService
    {
        byte[] GenerateQuotationPdf(QuotationViewModel model);
    }
}