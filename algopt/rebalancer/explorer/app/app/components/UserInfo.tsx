'use client';

import {useState} from 'react';
import {useAuth} from '@platform/auth';
import {
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {LogOut, Palette} from 'lucide-react';

export default function UserInfo() {
  const {user, loading, logout} = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="rectangular" width={128} height={16} />
      </div>
    );
  }

  // Don't show anything if no user
  if (!user) {
    return null;
  }

  // Generate initials from name with defensive null checks
  const initials =
    (user.name || '')
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  // Get avatar from profile picture
  const avatarUrl = user.profile_pic_uri;

  return (
    <>
      <div
        onClick={handleMenuOpen}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
        <Avatar src={avatarUrl} alt={user.name} sx={{width: 32, height: 32}}>
          {initials}
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.name}</span>
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
        slotProps={{paper: {sx: {width: 224}}}}>
        <div className="px-2 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={avatarUrl}
              alt={user.name}
              sx={{width: 40, height: 40}}>
              {initials}
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-gray-500">@{user.username}</div>
            </div>
          </div>
        </div>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <Palette className="size-4" />
          </ListItemIcon>
          <ListItemText>Appearance</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose();
            logout();
          }}>
          <ListItemIcon>
            <LogOut className="size-4" />
          </ListItemIcon>
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
