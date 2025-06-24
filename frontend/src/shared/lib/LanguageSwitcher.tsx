import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import { log } from './logger';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(language);
      setIsOpen(false);
    } catch (error) {
      log.error('Failed to change language', {
        component: 'LanguageSwitcher',
        function: 'handleLanguageChange',
        targetLanguage: language
      }, error as Error);
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
    <div className="relative w-full" data-language-switcher>
      {/* ✨ Premium Trigger Button */}
      <button
        onClick={toggleDropdown}
        className="
          w-full flex items-center justify-between
          text-sm font-medium
          text-slate-700 hover:text-slate-900
          transition-all duration-300
        "
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-current">
          {SUPPORTED_LANGUAGES[currentLanguage]}
        </span>
        <ChevronDown 
          className={`w-3.5 h-3.5 text-current transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* ✨ Premium Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full min-w-[140px] z-50 overflow-hidden">
          <div className="
            backdrop-blur-[16px] backdrop-saturate-[1.8] backdrop-brightness-[1.1]
            bg-gradient-to-br from-white/[0.95] via-white/[0.90] to-white/[0.85]
            border border-white/[0.3]
            rounded-[16px]
            shadow-[0_12px_40px_rgba(0,0,0,0.15),0_2px_0_rgba(255,255,255,0.4)_inset]
            animate-in fade-in-0 zoom-in-95 duration-200
          ">
            <div className="py-2">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => {
                const isSelected = currentLanguage === code;
                
                return (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code as SupportedLanguage)}
                    className={`
                      group relative overflow-hidden
                      w-full flex items-center justify-between
                      px-4 py-3 text-sm font-medium
                      transition-all duration-300
                      ${isSelected
                        ? `
                          bg-gradient-to-r from-blue-500 to-blue-600
                          text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)]
                        `
                        : `
                          text-slate-700 hover:text-slate-900
                          hover:bg-gradient-to-br hover:from-white/[0.8] hover:to-white/[0.6]
                        `
                      }
                    `}
                    role="menuitem"
                  >
                    <span className={`relative z-10 ${isSelected ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : ''}`}>
                      {name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                    )}
                    
                    {/* Неоморфный внутренний свет для неактивных */}
                    {!isSelected && (
                      <div className="absolute inset-[1px] rounded bg-gradient-to-br from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    
                    {/* Shimmer эффект */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${
                      isSelected 
                        ? 'from-transparent via-white/[0.25] to-transparent' 
                        : 'from-transparent via-white/[0.2] to-transparent'
                    } translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out`} />
                  </button>
                );
              })}
            </div>
            
            {/* ✨ Premium Language Info */}
            <div className="border-t border-white/[0.2] px-4 py-2 bg-gradient-to-r from-white/[0.1] to-white/[0.05]">
              <p className="text-xs text-slate-600 font-medium">
                Language / Язык
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 