using System;
using System.Collections.Generic;

namespace CRUD_Project.Models_FileUpload;

public partial class FileUploadDb2
{
    public int FileUploadDbId { get; set; }

    public DateTime? FileUploadTime { get; set; }

    public int? TestId { get; set; }

    public byte[]? FileUploadFileName { get; set; }

    public string? FileUploadMime { get; set; }

    public string? FileUploadMemo { get; set; }

    public string? FileUploadUser { get; set; }
}
