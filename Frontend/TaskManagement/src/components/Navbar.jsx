// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Utils/AuthContext";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  Tooltip,
  Container,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  AssignmentTurnedIn as MyTaskIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const Navbar = () => {
  const { user, hasRole, logout } = useAuth();
  const isAdmin = hasRole("Admin");
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  let navItems;
  if (user) {
    if (isAdmin) {
      navItems = [
        { label: "Dashboard", icon: DashboardIcon, to: "/admin" },
        { label: "Manage Tasks", icon: TaskIcon, to: "/admin/tasks" },
        { label: "Create Task", icon: AddIcon, to: "/admin/tasks/create" },
      ];
    } else {
      navItems = [
        { label: "My Tasks", icon: MyTaskIcon, to: "/my-tasks" },
        { label: "Notes", icon: TaskIcon, to: "/notes" },
      ];
    }
  } else {
    navItems = [];
  }

  const userMenuItems = user
    ? [
        { label: "Profile", icon: AccountIcon, to: "/profile" },
        { label: "Logout", icon: LogoutIcon, action: handleLogout },
      ]
    : [];

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              color: "inherit",
              textDecoration: "none",
            }}
          >
            TaskManager
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="open navigation menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              keepMounted
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.label}
                  component={item.to ? RouterLink : "button"}
                  to={item.to}
                  onClick={() => {
                    handleCloseNavMenu();
                    if (item.action) item.action();
                  }}
                >
                  {item.icon && (
                    <ListItemIcon>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                  )}
                  <Typography textAlign="center">{item.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={item.to ? RouterLink : "button"}
                to={item.to}
                onClick={item.action}
                startIcon={item.icon ? <item.icon /> : null}
                sx={{ my: 2, color: "white", display: "flex" }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Right side user menu or auth buttons */}
          <Box sx={{ flexGrow: 0, display: "flex", gap: 1 }}>
            {user ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: "#eee", color: "primary.main" }}>
                      {(user.displayName || user.email).charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  keepMounted
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  sx={{ mt: "45px" }}
                >
                  {userMenuItems.map((item) => (
                    <MenuItem
                      key={item.label}
                      component={item.to ? RouterLink : "button"}
                      to={item.to}
                      onClick={() => {
                        handleCloseUserMenu();
                        if (item.action) item.action();
                      }}
                    >
                      <ListItemIcon>
                        <item.icon fontSize="small" />
                      </ListItemIcon>
                      <Typography textAlign="center">{item.label}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{ my: 2, color: "white" }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  sx={{ my: 2, color: "white" }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
