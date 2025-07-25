using System;
using System.Collections.Generic;

namespace CRUD_Project.Models_FileUpload;

public partial class FileUploadDb3
{
    public int FileUploadDbId { get; set; }

    public DateTime? FileUploadTime { get; set; }

    public byte[]? FileUploadFileName { get; set; }
}
