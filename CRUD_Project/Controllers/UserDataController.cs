using CRUD_Project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;              // 需手動安裝NuGet 
using Microsoft.EntityFrameworkCore;// Async「非同步」會用到的命名空間
using Newtonsoft.Json;
using System.Data;   


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
                //return RedirectToAction(nameof(IndexPage)); 
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
                //return RedirectToAction(nameof(IndexPage)); 
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
                //return RedirectToAction(nameof(IndexPage)); 

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

        public ActionResult IndexPage(int _ID = 1)
        {
            int iRecordCount = _db.UserTables.Count(); //取得資料庫中UserTable的總筆數
            int iPageSize = 5; //每頁顯示資料筆數
            int iNowPageCount = 0;

            if(_ID > 0 || String.IsNullOrEmpty(_ID.ToString()))
            {
                iNowPageCount = (int)((_ID - 1) * iPageSize); // 計算目前頁面要顯示的資料起始位置
            }

            IQueryable<UserTable> ListAll = (from m in _db.UserTables
                                                                     orderby m.UserId 
                                                                     select m).Skip(iNowPageCount).Take(iPageSize);    // .Skip() 從哪裡開始， .Take()呈現幾筆記錄


            if (ListAll.Any() == false)
            {
                return NotFound();  
            }
            else
            {
                int iTotalPage;
                if ((iRecordCount % iPageSize) > 0)
                {  
                    iTotalPage = ((iRecordCount / iPageSize) + 1);   //  如果無法整除，則需要多出一頁來呈現。 
                }
                else
                {
                    iTotalPage = (iRecordCount / iPageSize);   
                }

                System.Text.StringBuilder sbPageList= new System.Text.StringBuilder();
                if (iTotalPage > 0)
                {
                    sbPageList.Append("<div align=\"center\">");

                    if (_ID > 1)
                    {
                        sbPageList.Append("<a href=\"?_ID=" + (_ID - 1) + "\">[<<<上一頁]</a>");
                    }
                    sbPageList.Append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b><a href=\"https://localhost:7228/\">[首頁]</a></b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                    if (_ID < iTotalPage)
                    {
                        sbPageList.Append("<a href=\"?_ID=" + (_ID + 1) + "\">[下一頁>>>]</a>");
                    }

                    sbPageList.Append("<hr width='97%' size=1>");

                    int block_page = 0;
                    block_page = _ID / 10;   //--只取除法的整數成果（商），若有餘數也不去管它。

                    if (block_page > 0)
                    {
                        sbPageList.Append("<a href=\"?_ID=" + (((block_page - 1) * 10) + 9) + "\">[前十頁<<]</a>&nbsp;&nbsp;");
                    }

                    for (int K = 0; K <= 10; K++)
                    {
                        if ((block_page * 10 + K) <= iTotalPage)
                        {   //--- Pages 資料的總頁數。共需「幾頁」來呈現所有資料？
                            if (((block_page * 10) + K) == _ID)
                            {   //--- id 就是「目前在第幾頁」
                                sbPageList.Append("[<b>" + _ID + "</b>]" + "&nbsp;&nbsp;&nbsp;");
                            }
                            else
                            {
                                if (((block_page * 10) + K) != 0)
                                {
                                    sbPageList.Append("<a href=\"?_ID=" + (block_page * 10 + K) + "\">" + (block_page * 10 + K) + "</a>");
                                    sbPageList.Append("&nbsp;&nbsp;&nbsp;");
                                }
                            }
                        }
                    }  

                    if ((block_page < (iTotalPage / 10)) & (iTotalPage >= (((block_page + 1) * 10) + 1)))
                    {
                        sbPageList.Append("&nbsp;&nbsp;<a href=\"?_ID=" + ((block_page + 1) * 10 + 1) + "\">[>>後十頁]</a>");
                    }
                    sbPageList.Append("</div>");

                }

     
                ViewBag.PageList = sbPageList.ToString();

                return View(ListAll.ToList()); 
            }
     
        }


        [HttpPost]
        [ValidateAntiForgeryToken] 
        public ActionResult Search(string strSearchWord)
        {
            ViewData["SW"] = strSearchWord;

            if (String.IsNullOrEmpty(strSearchWord) && ModelState.IsValid)
            { 
                return Content("請輸入「關鍵字」才能搜尋!");
            }

            IQueryable<UserTable> ListAll = from m in _db.UserTables
                                                                    where m.UserName != null && m.UserName.Contains(strSearchWord)
                                                                    orderby m.UserId
                                                                    select m;

            if (ListAll.Any() == false)  
            {   
                return NotFound();
            }
            else
            {
                return View(ListAll);
            }
        }


        public ActionResult Search_Multi()
        {
            return View(); 
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Search_Multi(UserTable _userTable)
        {

            string? strUserName = _userTable.UserName;
            string? strUserMobilePhone = _userTable.UserMobilePhone;

  
            if (String.IsNullOrWhiteSpace(strUserName) && String.IsNullOrWhiteSpace(strUserMobilePhone) && ModelState.IsValid)
            {
                return Content("請輸入「關鍵字」才能搜尋!");
            }

          ViewData["SW"] = "User Name= " + strUserName + ", Phone= " + strUserMobilePhone;

            IQueryable<UserTable> ListAll = _db.UserTables.Select(m => m);

            if (!string.IsNullOrWhiteSpace(strUserName) )
            {
                ListAll = ListAll.Where(m => m.UserName != null && m.UserName.Contains(strUserName));
            }

            if (!string.IsNullOrWhiteSpace(strUserMobilePhone))
            {
                ListAll = ListAll.Where(m => m.UserMobilePhone != null && m.UserMobilePhone.Contains(strUserMobilePhone));
            }

            ListAll = ListAll.OrderBy(m => m.UserId); 


            if (ListAll.Any() == false)  
            {   
                return NotFound();
            }
            else
            {
                return View("Search", ListAll); //指定檢視名稱為Search，並傳入查詢結果ListAll
            }

        }

        //----------------------------------------------------------------------
        public ActionResult BootstrapTableList()
        {
            return View();
        }

        public ActionResult BootstrapTableList2()
        {
            return View();
        }
 
        [HttpGet]
        public IActionResult GetUserData(int offset, int limit)
        {
            var data = _db.UserTables
                 .Skip(offset)
                 .Take(limit)
                 .ToList();

            var total = _db.UserTables.Count();

            return Json(new { total = total, rows = data });
        }


        public ActionResult Customer()
        {
            return View();
        }

        //public ActionResult GetEAP_Message(string LOTID)
        //{
        //    DataTable dtResult = new DataTable();
        //    dtResult = csSorter_Posting_Report.GetEAP_Message(LOTID);
        //    var varJson = JsonConvert.SerializeObject(dtResult);
        //    return Json(varJson, JsonRequestBehavior.AllowGet);
        //}


    }

}
