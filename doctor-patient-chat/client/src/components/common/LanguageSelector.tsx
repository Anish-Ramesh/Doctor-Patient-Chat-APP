import React, { useState } from 'react';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material';

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  iconOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  buttonVariant?: 'text' | 'outlined' | 'contained';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  iconOnly = false,
  size = 'medium',
  buttonVariant = 'text',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    handleMenuClose();
  };

  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  return (
    <>
      <Tooltip title="Select language">
        <Box
          component={buttonVariant === 'text' ? 'div' : 'button'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: buttonVariant === 'text' ? 0 : 1,
            border: buttonVariant === 'outlined' ? '1px solid rgba(0, 0, 0, 0.23)' : 'none',
            borderRadius: 1,
            bgcolor: buttonVariant === 'contained' ? 'primary.main' : 'transparent',
            color: buttonVariant === 'contained' ? 'primary.contrastText' : 'inherit',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: buttonVariant === 'text' ? 'transparent' : 'action.hover',
            },
          }}
          onClick={handleMenuOpen}
          aria-label="Select language"
        >
          <LanguageIcon fontSize={size} />
          {!iconOnly && (
            <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
              {selectedLang.code}
            </Typography>
          )}
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 200,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Select Language
        </Typography>
        <Divider />
        {LANGUAGES.map((language) => (
          <MenuItem
            key={language.code}
            selected={language.code === selectedLanguage}
            onClick={() => handleLanguageSelect(language.code)}
            dense
          >
            <ListItemIcon>
              {language.code === selectedLanguage ? (
                <CheckIcon color="primary" fontSize="small" />
              ) : (
                <Box width={24} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <>
                  <Typography variant="body2">{language.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language.nativeName}
                  </Typography>
                </>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
