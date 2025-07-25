using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace CRUD_Project.Models_FileUpload;

public partial class FileUploadDbContext : DbContext
{
    public FileUploadDbContext(DbContextOptions<FileUploadDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<FileUploadDb> FileUploadDbs { get; set; }

    public virtual DbSet<FileUploadDb2> FileUploadDb2s { get; set; }

    public virtual DbSet<FileUploadDb3> FileUploadDb3s { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FileUploadDb>(entity =>
        {
            entity.ToTable("FileUpload_DB");

            entity.Property(e => e.FileUploadDbId).HasColumnName("FileUpload_DB_id");
            entity.Property(e => e.FileUploadFileName)
                .HasMaxLength(50)
                .HasColumnName("FileUpload_FileName");
            entity.Property(e => e.FileUploadMemo)
                .HasMaxLength(250)
                .HasColumnName("FileUpload_Memo");
            entity.Property(e => e.FileUploadTime)
                .HasColumnType("datetime")
                .HasColumnName("FileUpload_time");
            entity.Property(e => e.FileUploadUser)
                .HasMaxLength(50)
                .HasDefaultValue("圖片上傳者的姓名")
                .HasColumnName("FileUpload_User");
            entity.Property(e => e.TestId)
                .HasDefaultValue(0)
                .HasColumnName("test_id");
        });

        modelBuilder.Entity<FileUploadDb2>(entity =>
        {
            entity.HasKey(e => e.FileUploadDbId);

            entity.ToTable("FileUpload_DB2");

            entity.Property(e => e.FileUploadDbId).HasColumnName("FileUpload_DB_id");
            entity.Property(e => e.FileUploadFileName)
                .HasColumnType("image")
                .HasColumnName("FileUpload_FileName");
            entity.Property(e => e.FileUploadMemo)
                .HasMaxLength(250)
                .HasColumnName("FileUpload_Memo");
            entity.Property(e => e.FileUploadMime)
                .HasMaxLength(25)
                .HasColumnName("FileUpload_MIME");
            entity.Property(e => e.FileUploadTime)
                .HasColumnType("datetime")
                .HasColumnName("FileUpload_time");
            entity.Property(e => e.FileUploadUser)
                .HasMaxLength(50)
                .HasColumnName("FileUpload_User");
            entity.Property(e => e.TestId).HasColumnName("test_id");
        });

        modelBuilder.Entity<FileUploadDb3>(entity =>
        {
            entity.HasKey(e => e.FileUploadDbId);

            entity.ToTable("FileUpload_DB3");

            entity.Property(e => e.FileUploadDbId).HasColumnName("FileUpload_DB_id");
            entity.Property(e => e.FileUploadFileName).HasColumnName("FileUpload_FileName");
            entity.Property(e => e.FileUploadTime)
                .HasColumnType("datetime")
                .HasColumnName("FileUpload_time");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
