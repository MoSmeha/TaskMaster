using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySecureApi.Data; 
using MySecureApi.Models; 
using System.Text;
using MySecureApi.Services; 
using MySecureApi.DTOs; 

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration; 


builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

// configuring identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false; 
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequiredUniqueChars = 1;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    options.User.AllowedUserNameCharacters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders(); 

// configuring jwt Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true; 
    options.RequireHttpsMetadata = false; 
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true, // makes sure token ma 5eles wa2ta (se3a)
        ValidateIssuerSigningKey = true,
        ValidAudience = configuration["Jwt:Audience"],
        ValidIssuer = configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)) 
    };
});

// Authorization 
builder.Services.AddAuthorization();

// CORS Configuration kormel l vite react frontend
builder.Services.AddCors(options =>
{

    options.AddPolicy("AllowFrontend", 
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "https://localhost:3000", 
                                "http://localhost:5173", "https://localhost:5173") 
                   .AllowAnyHeader() 
                   .AllowAnyMethod(); 

        });
});

// Register Custom Services , dependency injection
builder.Services.AddScoped<IAuthService, AuthService>(); 
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<INoteService, NoteService>();
//  Add Controllers
builder.Services.AddControllers();

//  Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => {
    // Configure Swagger to use JWT
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http, 
        Scheme = "Bearer", 
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = " \r\n\r\n Enter your token in the text input below ma fi de3e lal bearer work.\r\n\r\nExample: \"12345abcdef...\""
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                     Reference = new Microsoft.OpenApi.Models.OpenApiReference {
                         Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                         Id = "Bearer"
                     }
                },
                new string[] {}
        }
    });
});


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // Seed database for the admin (me: MohamadSmeha)
    await SeedDatabase(app); 
}


app.UseCors("AllowFrontend"); // CORS policy


app.UseAuthentication(); //Identifies user based on token
app.UseAuthorization();  // checks roles/policies


app.MapControllers(); 

app.Run();

async Task SeedDatabase(WebApplication webApp)
{
    using (var scope = webApp.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var logger = services.GetRequiredService<ILogger<Program>>(); 


            await SeedRolesAsync(roleManager, logger); 
            await SeedAdminUserAsync(userManager, roleManager, configuration, logger);

            Console.WriteLine("Database seeding completed successfully.");
            logger.LogInformation("Database seeding completed successfully.");

        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>(); 
            logger.LogError(ex, "An error occurred seeding the DB.");
            Console.WriteLine($"An error occurred seeding the DB: {ex.Message}"); 
        }
    }
}

async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger<Program> logger)
{
    string[] roleNames = { "Admin", "User" };
    foreach (var roleName in roleNames)
    {
        var roleExist = await roleManager.RoleExistsAsync(roleName);
        if (!roleExist)
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
            Console.WriteLine($"Role '{roleName}' created.");
            logger.LogInformation($"Role '{roleName}' created."); 
        }
        else
        {
            logger.LogInformation($"Role '{roleName}' already exists."); 
        }
    }
}

async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration config, ILogger<Program> logger) 
{
    var adminEmail = config["DefaultAdmin:Email"] ?? "admin@example.com";
    var adminUserName = config["DefaultAdmin:Username"] ?? "adminuser";
    var adminPassword = config["DefaultAdmin:Password"] ?? "AdminPass123!"; 

    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        ApplicationUser user = new ApplicationUser
        {
            UserName = adminUserName,
            Email = adminEmail,
            EmailConfirmed = true
        };

        IdentityResult result = await userManager.CreateAsync(user, adminPassword);

        if (result.Succeeded)
        {
            if (await roleManager.RoleExistsAsync("Admin"))
            {
                await userManager.AddToRoleAsync(user, "Admin");
                Console.WriteLine($"Admin user '{user.UserName}' created and assigned 'Admin' role.");
                logger.LogInformation($"Admin user '{user.UserName}' created and assigned 'Admin' role.");
            }
            else
            {
                Console.WriteLine("Admin role does not exist. Cannot assign to user.");
                logger.LogWarning("Admin role does not exist. Cannot assign to user during seeding.");
            }
        }
        else
        {
            Console.WriteLine($"Error creating admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            logger.LogError($"Error creating admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }
    else
    {
        Console.WriteLine("Admin user already exists.");
        logger.LogInformation("Admin user already exists.");
    }
}
