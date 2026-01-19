import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SettingsIcon from '@mui/icons-material/Settings';

const Navbar = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { path: "/flujo", label: "Flujo mensual", icon: <TrendingUpIcon /> },
    { path: "/compras", label: "Compras MSI", icon: <ShoppingCartIcon /> },
    { path: "/mensualidades", label: "Mensualidades", icon: <CalendarMonthIcon /> },
    { path: "/tarjetas", label: "Tarjetas", icon: <CreditCardIcon /> },
    { path: "/config", label: "Configuración", icon: <SettingsIcon /> }
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: '#1a1a2e', zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: isMobile ? 1 : 0, mr: 4, fontWeight: 'bold' }}>
            💰 Paz Financiera
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: 'white',
                    bgcolor: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '#0f3460' : 'transparent',
                    borderBottom: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '3px solid #16a085' : '3px solid transparent',
                    borderRadius: 0,
                    px: 2,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#0f3460',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#1a1a2e',
            color: 'white'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={handleDrawerClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="h6" sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'white' }}>
          💰 Paz Financiera
        </Typography>
        
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleDrawerClose}
              sx={{
                color: 'white',
                bgcolor: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '#0f3460' : 'transparent',
                borderLeft: location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? '4px solid #16a085' : '4px solid transparent',
                '&:hover': {
                  bgcolor: '#0f3460',
                },
                textDecoration: 'none'
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
