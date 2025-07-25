using CRUD_Project.Controllers;
using CRUD_Project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;


namespace CRUD_Project.Controllers.Tests
{
    [TestClass()]
    public class UserDataControllerTests
    {
        private UserDataController _controller = null!;
        private MvcUserDbContext _db = null!;
        private ILogger<UserDataController> _logger = null!;

        [TestInitialize]
        public void TestInitialize()
        {
            // 設定 In-Memory 測試資料庫
            var options = new DbContextOptionsBuilder<MvcUserDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _db = new MvcUserDbContext(options);

            // 使用 NullLogger 代替 Mock（ASP.NET Core 內建）
            _logger = NullLogger<UserDataController>.Instance;

            // 建立 Controller 實例
            _controller = new UserDataController(_logger, _db);

        }

        [TestCleanup]
        public void TestCleanup()
        {
            _db.Dispose();
        }

        private void SeedTestData()
        {
            var testUsers = new List<UserTable>
            {
                new UserTable
                {
                    UserId = 1,
                    UserName = "測試用戶1",
                    UserSex = "M",
                    UserBirthDay = new DateTime(1990, 1, 1),
                    UserMobilePhone = "0912345678"
                },
                new UserTable
                {
                    UserId = 2,
                    UserName = "測試用戶2",
                    UserSex = "F",
                    UserBirthDay = new DateTime(1985, 5, 15),
                    UserMobilePhone = "0987654321"
                }
            };

            _db.UserTables.AddRange(testUsers);
            _db.SaveChanges();
        }

        /// <summary>
        /// 手動驗證模型，模擬 ASP.NET Core 的模型驗證行為
        /// </summary>
        private void ValidateModel(UserTable model)
        {
            var validationContext = new ValidationContext(model, null, null);
            var validationResults = new List<ValidationResult>();
            var isValid = Validator.TryValidateObject(model, validationContext, validationResults, true);

            foreach (var validationResult in validationResults)
            {
                var errorMessage = validationResult.ErrorMessage ?? string.Empty;
                foreach (var memberName in validationResult.MemberNames)
                {
                    _controller.ModelState.AddModelError(memberName, errorMessage);
                }
            }
        }

        #region Create 測試
        [TestMethod]
        public void TestCreateData()
        {
            // Arrange - 所有欄位都有資料
            var testUser = new UserTable
            {
                UserName = "完整資料用戶",
                UserSex = "F",
                UserBirthDay = new DateTime(1992, 12, 25),
                UserMobilePhone = "0966123456"
            };

            // Act
            var result = _controller.Create(testUser);

            // Assert
            Assert.IsInstanceOfType(result, typeof(RedirectToActionResult));

            // 驗證所有欄位都正確保存
            var addedUser = _db.UserTables.FirstOrDefault(u => u.UserName == "完整資料用戶");
            Assert.IsNotNull(addedUser);
            Assert.AreEqual("完整資料用戶", addedUser.UserName);
            Assert.AreEqual("F", addedUser.UserSex);
            Assert.AreEqual(new DateTime(1992, 12, 25), addedUser.UserBirthDay);
            Assert.AreEqual("0966123456", addedUser.UserMobilePhone);
        }

        [TestMethod]
        public void TestCreateDuplicateUserName()
        {
            // Arrange - 先新增一個用戶
            var firstUser = new UserTable
            {
                UserName = "重複姓名",
                UserSex = "M"
            };
            _db.UserTables.Add(firstUser);
            _db.SaveChanges();

            // 再建立相同姓名的用戶
            var secondUser = new UserTable
            {
                UserName = "重複姓名",
                UserSex = "F"
            };

            // Act
            var result = _controller.Create(secondUser);

            // Assert
            Assert.IsInstanceOfType(result, typeof(RedirectToActionResult));

            // 驗證兩個用戶都存在（系統允許重複姓名）
            var users = _db.UserTables.Where(u => u.UserName == "重複姓名").ToList();
            Assert.AreEqual(2, users.Count);
        }

        [TestMethod]
        [DataRow("", DisplayName = "空字串姓名")]
        [DataRow(null, DisplayName = "空值姓名")]
        [DataRow("AB", DisplayName = "姓名太短（2個字）")]
        public void TestCreateInvalidUserName(string userName)
        {
            // Arrange
            var testUser = new UserTable
            {
                UserName = userName,
                UserSex = "F",
                UserBirthDay = new DateTime(1985, 5, 15),
                UserMobilePhone = "0987654321"
            };

            // 手動驗證模型（模擬 Controller 的行為）
            ValidateModel(testUser);

            // Act
            var result = _controller.Create(testUser);

            // Assert
            Assert.IsInstanceOfType(result, typeof(ViewResult));
            Assert.IsFalse(_controller.ModelState.IsValid);

            // 驗證沒有資料被新增到資料庫
            Assert.AreEqual(0, _db.UserTables.Count());
        }

        #endregion

        #region Edit 測試

        [TestMethod]
        public void TestGetEditData()
        {
            // Arrange
            SeedTestData();
            int validId = 1;

            // Act
            var result = _controller.Edit(validId);

            // Assert
            Assert.IsInstanceOfType(result, typeof(ViewResult));
            var viewResult = result as ViewResult;
            Assert.IsInstanceOfType(viewResult?.Model, typeof(UserTable));

            var user = viewResult.Model as UserTable;
            Assert.AreEqual(1, user?.UserId);
            Assert.AreEqual("測試用戶1", user?.UserName);
        }


        [TestMethod]
        [DataRow(null, DisplayName = "空值Id")]
        [DataRow(999, DisplayName = "不存在的Id")]
        [DataRow(-1, DisplayName = "負數Id")]
        public void TestEdit_IllegalId(int editId)
        {
            // Arrange
            SeedTestData();

            // Act
            var result = _controller.Edit(editId);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NotFoundResult));
        }

        [TestMethod]
        public void TestEditConfirm()
        {
            // Arrange
            SeedTestData();
            var updatedUser = new UserTable
            {
                UserId = 1,
                UserName = "更新後的姓名",
                UserSex = "F",
                UserBirthDay = new DateTime(1992, 12, 25),
                UserMobilePhone = "0966123456"
            };

            // Act
            var result = _controller.EditConfirm(updatedUser);

            // Assert
            Assert.IsInstanceOfType(result, typeof(RedirectToActionResult));
            var redirectResult = result as RedirectToActionResult;
            Assert.AreEqual("List", redirectResult?.ActionName);

            // 驗證資料是否已更新
            var userInDb = _db.UserTables.Find(1);
            Assert.IsNotNull(userInDb);
            Assert.AreEqual("更新後的姓名", userInDb.UserName);
            Assert.AreEqual("F", userInDb.UserSex);
            Assert.AreEqual(new DateTime(1992, 12, 25), userInDb.UserBirthDay);
            Assert.AreEqual("0966123456", userInDb.UserMobilePhone);
        }

        [TestMethod]
        public void TestEditConfirm_NonExistentUser()
        {
            // Arrange
            SeedTestData();
            var nonExistentUser = new UserTable
            {
                UserId = 999, // 不存在的 ID
                UserName = "不存在的用戶",
                UserSex = "M"
            };

            // Act
            var result = _controller.EditConfirm(nonExistentUser);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NotFoundResult));
        }
        #endregion


    }
}