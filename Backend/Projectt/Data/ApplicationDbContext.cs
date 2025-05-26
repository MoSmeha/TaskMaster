using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MySecureApi.Models; 
using MySecureApi.Enums; 

namespace MySecureApi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {

        public DbSet<UserTask> UserTasks { get; set; } = null!;
        public DbSet<Note> Notes { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!; 
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);


            builder.Entity<UserTask>(entity =>
            {
                // enum conversions
                entity.Property(e => e.Urgency)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.Property(t => t.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()")
                    .ValueGeneratedOnAdd();

                entity.Property(t => t.UpdatedAt)
                    .HasDefaultValueSql("GETUTCDATE()")
                    .ValueGeneratedOnAddOrUpdate()
                    .IsConcurrencyToken();

                entity.HasOne(t => t.AssignedToUser)
                    .WithMany(u => u.AssignedTasks) 
                    .HasForeignKey(t => t.AssignedToUserId)
                    .IsRequired()
                    .OnDelete(DeleteBehavior.Restrict); 

                entity.HasIndex(t => t.AssignedToUserId);
                entity.HasIndex(t => t.Status);
            });


            builder.Entity<Note>(entity =>
            {
                entity.Property(n => n.Title)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(n => n.Description)
                    .HasMaxLength(1000);

                entity.Property(n => n.DateCreated)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()") 
                    .ValueGeneratedOnAdd();

                entity.Property(n => n.UserId)
                    .IsRequired();

 
                entity.HasOne(n => n.User) 
                      .WithMany(u => u.Notes) 
                      .HasForeignKey(n => n.UserId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Cascade); 

                entity.HasIndex(n => n.UserId);
            });


            builder.Entity<Comment>(entity =>
            {
                entity.Property(c => c.Text)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(c => c.CreatedAt)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()") 
                    .ValueGeneratedOnAdd();

                entity.Property(c => c.UserId)
                    .IsRequired();

                entity.Property(c => c.TaskId)
                   .IsRequired();


                entity.HasOne(c => c.User)
                      .WithMany(u => u.Comments) 
                      .HasForeignKey(c => c.UserId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Restrict); 

                entity.HasOne(c => c.Task)
                      .WithMany(t => t.Comments) 
                      .HasForeignKey(c => c.TaskId)
                      .IsRequired()
                      .OnDelete(DeleteBehavior.Cascade); 


                entity.HasIndex(c => c.UserId);
                entity.HasIndex(c => c.TaskId);
            });

        }
    }
}
