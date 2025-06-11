import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(language);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-switcher]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" data-language-switcher>
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4 text-gray-300" />
        <span className="text-sm font-medium text-gray-300 hidden sm:block">
          {SUPPORTED_LANGUAGES[currentLanguage]}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="py-1">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => {
              const isSelected = currentLanguage === code;
              
              return (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <span className="font-medium">{name}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Language Info */}
          <div className="border-t border-gray-700 px-4 py-2">
            <p className="text-xs text-gray-400">
              Language / Язык
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 