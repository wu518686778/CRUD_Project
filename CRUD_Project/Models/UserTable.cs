using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRUD_Project.Models;

public partial class UserTable
{
    [Key]    // 主索引鍵（P.K.）
    [Display(Name = "用戶編號")]
    public int UserId { get; set; }

    [Display(Name = "姓名")]
    [Required(ErrorMessage = "*** 必填欄位 ***")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "* Name must be between 3 and 50 character in length.")]
    public string? UserName { get; set; }

    [Display(Name = "性別")]
    [StringLength(1, MinimumLength = 1)]
    public string? UserSex { get; set; }

    [Display(Name = "生日")]
    public DateTime? UserBirthDay { get; set; }

    [Display(Name = "手機")]
    public string? UserMobilePhone { get; set; }
}
