using Microsoft.AspNetCore.Mvc;
using CRUD_Project.Models;
using Microsoft.EntityFrameworkCore;   // Async「非同步」會用到的命名空間
using Microsoft.Data.SqlClient;              // 需手動安裝NuGet 


namespace CRUD_Project.Controllers
{
    public class UserDataController : Controller
    {

        //*****連結MVC_UserDB資料庫*****[Start]
        private readonly MvcUserDbContext _db;
        //*****連結MVC_UserDB資料庫*****[End]

        private readonly ILogger<UserDataController> _logger;
        public UserDataController(ILogger<UserDataController> logger, MvcUserDbContext DbContext)
        {
            _logger = logger;
            _db = DbContext;
        }
 
        public async Task<IActionResult> UserList()
        {
            IQueryable<UserTable> ListAll = from m in _db.UserTables
                                                                    select m;

            // 查無資料時，IQueryable<T>會傳回一個「空集合」而不是「空（null）」
            if (ListAll.Any() == false)
            {
                return NotFound();
            }
            else
            {
                return View(await ListAll.ToListAsync());
            }

        }

        [HttpGet]
        public IActionResult Details(int? _ID=1)
            {
            //if (_ID == null || _ID.HasValue == false)
            //{
            //    return Content("沒有輸入編號（_ID）");
            //}

            IQueryable<UserTable> ListOne = from m in _db.UserTables
                                                                       where m.UserId == _ID    
                                                                       select m;

            if (ListOne.Any() == false)  
            {
                return NotFound();
            }
            else
            {
                return View(ListOne.FirstOrDefault());
            }
        }


    }
}
