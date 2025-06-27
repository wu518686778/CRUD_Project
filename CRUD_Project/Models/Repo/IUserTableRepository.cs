namespace CRUD_Project.Models.Repo
{
    public interface IUserTableRepository
    {
        IQueryable<UserTable> ListAllUsers();

        UserTable GetUserById(int id);
    }
}
