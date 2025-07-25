using System;
using System.Collections.Generic;

namespace CRUD_Project.Models_FileUpload;

public partial class FileUploadDb
{
    public int FileUploadDbId { get; set; }

    public DateTime? FileUploadTime { get; set; }

    public int? TestId { get; set; }

    public string FileUploadFileName { get; set; } = null!;

    public string? FileUploadMemo { get; set; }

    public string? FileUploadUser { get; set; }
}
