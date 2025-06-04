### TaskMaster

**TaskMaster** is a task management web application inspired by tools like Asana. It was built to help teams organize, assign, and track tasks efficiently, with features tailored for both administrators and regular users.

---

### Overview

TaskMaster allows an admin to create and assign tasks to users, monitor progress, and leave comments. Users can view their tasks, update their status, add notes, and comment as well.

The application uses a .NET 8 backend with ASP.NET Core Identity for user and role management. JWT is used for authentication. The frontend is built using React and Material-UI, offering a responsive and modern user experience.

---

### Key Features

#### Admin

- Create, update, delete, and assign tasks  
- View and manage all tasks from a central dashboard  
- Add comments to any task  
- Monitor overall task progress across users  

#### User

- Register and log in  
- View tasks assigned to them  
- Update task status (In Progress, Completed, Blocked)  
- Comment on tasks assigned only to them
- Keep personal notes  

---

### Technical Stack

- **Backend**: ASP.NET Core (.NET 8), Entity Framework, JWT Authentication  
- **Frontend**: React, Material-UI  
- **Database**: SQL Server  
- **Dev Tools**: Visual Studio 2022, VS Code, Swagger  

---

### Getting Started

#### Prerequisites

- .NET 8 SDK  
- SQL Server  
- Node.js and npm  

#### Setup Instructions

1. **Clone the repository**

2. **Backend**
   - Open the backend project in Visual Studio 2022  
   - Update the SQL Server connection string in `appsettings.json`  
   - Apply migrations and run the API project  

3. **Frontend**
   - Navigate to the frontend directory  
   - Install dependencies and start the development server

   ```bash
   npm install
   npm run dev
   ```

---

### Authentication and Authorization

- Registration is public and assigns the `User` role by default.  
- On login, a JWT token is issued with claims like `UserId` and `Role`.  
- Access is controlled using attributes such as `[Authorize]` and `[Authorize(Roles = "Admin")]`.

When using the frontend, the JWT is automatically stored in the browser’s local storage. You can also manually use the token in tools like Swagger for testing.

---

### Application Pages

#### Admin Views

- **Task Management Page**: Full control over all tasks, including assigning and commenting.  
- **Dashboard**: Overview of all user activity and task statuses.  

#### User Views

- **My Tasks Page**: View tasks, update their status, and comment.  
- **Notes Page**: Add, update, and delete personal notes.  

All users see a profile avatar (generated from the first letter of their name) with a dropdown menu to view their profile or log out.


---

### Code Quality and Practices

This project follows best practices, including:

- Dependency injection throughout the backend  
- Clean service-layer structure  
- Use of DTOs to manage data transfer  
- A RESTful API design  

