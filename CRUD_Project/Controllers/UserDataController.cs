using Microsoft.AspNetCore.Mvc;
using CRUD_Project.Models;
using Microsoft.EntityFrameworkCore;   // Async「非同步」會用到的命名空間
using Microsoft.Data.SqlClient;              // 需手動安裝NuGet 


namespace CRUD_Project.Controllers
{
    public class UserDataController : Controller
    {

        //連結MVC_UserDB資料庫
        private readonly MvcUserDbContext _db;

        private readonly ILogger<UserDataController> _logger;
        public UserDataController(ILogger<UserDataController> logger, MvcUserDbContext DbContext)
        {
            _logger = logger;
            _db = DbContext;
        }

        public async Task<IActionResult> List()
        {
            //https://hackmd.io/@AndyShih/SJOlljYI2
            //在IDE中寫好的IQueryable只是"查詢狀態"，此時還沒執行資料庫的查詢，因此不會有資料載入記憶體的行為。
            //若指派某些會得到"明確結果"的function，如Count()、ToList()等，此時才會執行SQL查詢指令，取得查詢結果。
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

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost,ActionName("Create")]
        [ValidateAntiForgeryToken] // 避免CSRF攻擊
        // [Bind(...)]可以避免 overposting attacks （過多發佈）攻擊  http://www.cnblogs.com/Erik_Xu/p/5497501.html
        public IActionResult Create([Bind("UserId, UserName, UserSex, UserBirthDay, UserMobilePhone")] UserTable _userTable)
        {

            if (_userTable != null && ModelState.IsValid) {  //ModelState.IsValid 通過表單驗證

                _db.UserTables.Add(_userTable);  //將資料加入到資料庫的UserTable中
                _db.SaveChanges();         
                return RedirectToAction(nameof(List)); 
            }
            else
            {
                ModelState.AddModelError("", "請檢查輸入的資料是否正確！");   // 第一個輸入值是 key，第二個是錯誤訊息（字串）
                return View();
            }
        }

        [HttpGet]
        public ActionResult Edit(int? _ID)
        {
            if (_ID == null)
            {   
                return new StatusCodeResult((int)System.Net.HttpStatusCode.BadRequest);
            }

            UserTable? ut = _db.UserTables.Find(_ID);

            if (ut == null)
            {   
                return NotFound();
            }
            else
            {
                return View(ut);
            }
        }

        [HttpPost, ActionName("Edit")]
        [ValidateAntiForgeryToken] // 避免CSRF攻擊
        // [Bind(...)]可以避免 overposting attacks （過多發佈）攻擊  http://www.cnblogs.com/Erik_Xu/p/5497501.html
        public IActionResult EditConfirm([Bind("UserId, UserName, UserSex, UserBirthDay, UserMobilePhone")] UserTable _userTable)
        {
            if (ModelState.IsValid) //通過表單驗證
            {
                UserTable? ut = _db.UserTables.Find(_userTable.UserId);
                if (ut == null)
                {   
                    return NotFound();
                }
                else
                {
                    ut.UserName = _userTable.UserName; 
                    ut.UserSex = _userTable.UserSex;
                    ut.UserBirthDay = _userTable.UserBirthDay;
                    ut.UserMobilePhone = _userTable.UserMobilePhone;
                    _db.SaveChanges(); 
                }
                return RedirectToAction(nameof(List)); 
            }
            else
            {
                return View(_userTable);
            }
        }   

        public IActionResult Delete(int? _ID)
        {
            if (_ID == null || _ID.HasValue == false)
            {
                return Content("沒有輸入編號（_ID）");
            }

            UserTable? ut = _db.UserTables.Find(_ID);

            if (ut == null)
            {   
                return NotFound();
            }
            else
            {
                return View(ut);
            }
        }

        [HttpPost,ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public IActionResult DeleteConfirm(int? _ID)
        {
            if (ModelState.IsValid)
            {
                UserTable? ut = _db.UserTables.Find(_ID);
                if (ut == null)
                {  
                    return Content(" 刪除時，找不到這一筆記錄！");
                }
                else
                {
                    _db.Entry(ut).State = Microsoft.EntityFrameworkCore.EntityState.Deleted;  
                    _db.SaveChanges();
                }

                return RedirectToAction(nameof(List));

            }
            else
            {
                ModelState.AddModelError("", "編號（_ID）驗證失敗！");
                return View();
            }
        }

        [HttpGet]
        public IActionResult Details(int? _ID)
        {
            if (_ID == null || _ID.HasValue == false)
            {
                return Content("沒有輸入編號（_ID）");
            }

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
