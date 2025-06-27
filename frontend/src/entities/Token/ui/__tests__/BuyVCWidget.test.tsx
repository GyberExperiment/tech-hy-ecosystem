import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuyVCWidget } from '../BuyVCWidget';

// Mock wagmi with all needed hooks
const mockUseAccount = vi.fn();
const mockUseWalletClient = vi.fn();
const mockUsePublicClient = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useWalletClient: () => mockUseWalletClient(),
  usePublicClient: () => mockUsePublicClient(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    button: ({ children, className, ...props }: any) => (
      <button className={className} {...props}>{children}</button>
    ),
    input: ({ className, ...props }: any) => (
      <input className={className} {...props} />
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock PancakeSwap hook
const mockUsePancakeSwap = vi.fn();
vi.mock('../api/usePancakeSwap', () => ({
  usePancakeSwap: () => mockUsePancakeSwap(),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  ArrowDown: () => <div data-testid="arrow-down-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('BuyVCWidget', () => {
  const mockGetVCQuote = vi.fn();
  const mockBuyVCWithBNB = vi.fn();
  const mockResetState = vi.fn();

  const defaultAccountState = {
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  };

  const defaultWalletClientState = {
    data: { account: { address: '0x1234567890123456789012345678901234567890' } },
  };

  const defaultPublicClientState = {};

  const defaultPancakeSwapState = {
    getVCQuote: mockGetVCQuote,
    buyVCWithBNB: mockBuyVCWithBNB,
    isLoading: false,
    isSuccess: false,
    error: null,
    txHash: null,
    resetState: mockResetState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue(defaultAccountState);
    mockUseWalletClient.mockReturnValue(defaultWalletClientState);
    mockUsePublicClient.mockReturnValue(defaultPublicClientState);
    mockUsePancakeSwap.mockReturnValue(defaultPancakeSwapState);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Рендеринг', () => {
    it('должен отрендерить основные элементы виджета', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByText('Купить VC Токены')).toBeInTheDocument();
      expect(screen.getByText('Вы платите')).toBeInTheDocument();
      expect(screen.getByText('Вы получите')).toBeInTheDocument();
      expect(screen.getByText('PancakeSwap V2')).toBeInTheDocument();
      expect(screen.getByText('V3 (скоро)')).toBeInTheDocument();
    });

    it('должен отрендерить поля ввода', () => {
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      const vcOutputs = screen.getAllByPlaceholderText('0.0');
      const vcOutput = vcOutputs[vcOutputs.length - 1]; // Последний с placeholder 0.0
      
      expect(bnbInput).toBeInTheDocument();
      expect(vcOutput).toBeInTheDocument();
      expect(vcOutput).toHaveAttribute('readonly');
    });

    it('должен показать кнопку настроек', () => {
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Состояние подключения кошелька', () => {
    it('должен показать кнопку подключения, если кошелек не подключен', () => {
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false,
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText('Подключите кошелек')).toBeInTheDocument();
    });

    it('должен показать кнопку покупки, если кошелек подключен', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByText('Купить VC (V2)')).toBeInTheDocument();
    });
  });

  describe('Ввод суммы BNB', () => {
    it('должен позволить ввести сумму BNB', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1.5');
      
      expect(bnbInput).toHaveValue('1.5');
    });

    it('должен вызвать getVCQuote при изменении суммы BNB', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1500.0' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1');
      
      await waitFor(() => {
        expect(mockGetVCQuote).toHaveBeenCalledWith('1', 'v2');
      }, { timeout: 1000 });
    });

    it('должен обновить количество VC при получении котировки', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1500.1234' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1');
      
      await waitFor(() => {
        const vcOutputs = screen.getAllByPlaceholderText('0.0');
        const vcOutput = vcOutputs[vcOutputs.length - 1];
        expect(vcOutput).toHaveValue('1500.1234');
      }, { timeout: 1000 });
    });

    it('должен установить 1 BNB при нажатии на MAX', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const maxButton = screen.getByText('MAX');
      await user.click(maxButton);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      expect(bnbInput).toHaveValue('1');
    });
  });

  describe('Переключение версий протокола', () => {
    it('должен по умолчанию выбрать V2', () => {
      render(<BuyVCWidget />);
      
      const v2Button = screen.getByText('PancakeSwap V2');
      expect(v2Button).toHaveClass('btn-glass-blue');
    });

    it('должен переключить на V3 (хотя он отключен)', async () => {
      render(<BuyVCWidget />);
      
      const v3Button = screen.getByText('V3 (скоро)');
      expect(v3Button).toBeDisabled();
    });

    it('должен обновить котировку при смене версии протокола', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1400.0' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1');
      
      // Переключаем на V2 (он уже выбран, но проверим обновление)
      const v2Button = screen.getByText('PancakeSwap V2');
      await user.click(v2Button);
      
      await waitFor(() => {
        expect(mockGetVCQuote).toHaveBeenCalledWith('1', 'v2');
      });
    });
  });

  describe('Настройки slippage', () => {
    it('должен показать настройки при нажатии на кнопку настроек', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-icon').closest('button')!;
      await user.click(settingsButton);
      
      expect(screen.getByText('Максимальный slippage')).toBeInTheDocument();
    });

    it('должен позволить изменить slippage', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-icon').closest('button')!;
      await user.click(settingsButton);
      
      const slippageInput = screen.getByDisplayValue('0.5');
      await user.clear(slippageInput);
      await user.type(slippageInput, '1.0');
      
      expect(slippageInput).toHaveValue(1.0);
    });

    it('должен показать информацию о протоколе и комиссии', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-icon').closest('button')!;
      await user.click(settingsButton);
      
      expect(screen.getByText('PancakeSwap V2')).toBeInTheDocument();
      expect(screen.getByText('0.25%')).toBeInTheDocument();
    });
  });

  describe('Выполнение swap', () => {
    it('должен быть отключен если нет суммы BNB', () => {
      render(<BuyVCWidget />);
      
      const swapButton = screen.getByText('Купить VC (V2)');
      expect(swapButton).toBeDisabled();
    });

    it('должен быть активен с валидной суммой BNB', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1');
      
      const swapButton = screen.getByText('Купить VC (V2)');
      expect(swapButton).not.toBeDisabled();
    });

    it('должен вызвать buyVCWithBNB при нажатии на кнопку swap', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      await user.type(bnbInput, '1');
      
      const swapButton = screen.getByText('Купить VC (V2)');
      await user.click(swapButton);
      
      expect(mockBuyVCWithBNB).toHaveBeenCalledWith({
        bnbAmount: '1',
        slippage: 0.5,
        recipient: defaultAccountState.address,
        version: 'v2',
      });
    });
  });

  describe('Состояние загрузки', () => {
    it('должен показать индикатор загрузки во время swap', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isLoading: true,
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText('Выполняется swap...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /выполняется swap/i })).toBeDisabled();
    });
  });

  describe('Обработка ошибок', () => {
    it('должен показать сообщение об ошибке', () => {
      const errorMessage = 'Insufficient balance';
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        error: { message: errorMessage },
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('должен показать кнопку "Новый swap" при ошибке', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        error: { message: 'Error' },
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText('Новый swap')).toBeInTheDocument();
    });
  });

  describe('Успешная транзакция', () => {
    it('должен показать сообщение об успехе', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isSuccess: true,
        txHash: '0xabcdef123456',
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText('Swap выполнен успешно!')).toBeInTheDocument();
    });

    it('должен показать ссылку на BSCScan', () => {
      const txHash = '0xabcdef123456';
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isSuccess: true,
        txHash,
      });

      render(<BuyVCWidget />);
      
      const link = screen.getByRole('link', { name: /посмотреть транзакцию/i });
      expect(link).toHaveAttribute('href', `https://testnet.bscscan.com/tx/${txHash}`);
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('должен показать кнопку "Новый swap" при успехе', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isSuccess: true,
        txHash: '0xabcdef123456',
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByText('Новый swap')).toBeInTheDocument();
    });
  });

  describe('Сброс состояния', () => {
    it('должен сбросить состояние и форму при нажатии "Новый swap"', async () => {
      const user = userEvent.setup();
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isSuccess: true,
        txHash: '0xabcdef123456',
      });

      render(<BuyVCWidget />);
      
      const resetButton = screen.getByText('Новый swap');
      await user.click(resetButton);
      
      expect(mockResetState).toHaveBeenCalled();
    });
  });

  describe('Информационный блок', () => {
    it('должен показать информацию о сети и протоколе', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByText('BSC Testnet')).toBeInTheDocument();
      expect(screen.getByText('PancakeSwap V2')).toBeInTheDocument();
      expect(screen.getByText('0.5%')).toBeInTheDocument();
    });
  });

  describe('Пользовательский опыт', () => {
    it('должен применить пользовательский className', () => {
      const customClass = 'custom-widget-class';
      render(<BuyVCWidget className={customClass} />);
      
      const widget = screen.getByText('Купить VC токены').closest('div');
      expect(widget).toHaveClass(customClass);
    });

    it('должен иметь правильную структуру для центрирования', () => {
      render(<BuyVCWidget />);
      
      const widget = screen.getByText('Купить VC токены').closest('div');
      expect(widget).toHaveClass('mx-auto');
      expect(widget).toHaveClass('max-w-md');
    });
  });

  describe('Debounce функциональность', () => {
    it('должен применить debounce к getVCQuote', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1000.0' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      
      // Быстро вводим несколько символов
      await user.type(bnbInput, '1');
      await user.type(bnbInput, '.5');
      
      // Ждем больше времени чем debounce delay (500ms)
      await waitFor(() => {
        expect(mockGetVCQuote).toHaveBeenCalledTimes(1);
        expect(mockGetVCQuote).toHaveBeenCalledWith('1.5', 'v2');
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('должен иметь правильные aria-labels для важных элементов', () => {
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByPlaceholderText('0.0');
      const vcOutput = screen.getAllByPlaceholderText('0.0')[1];
      
      expect(bnbInput).toHaveAccessibleName();
      expect(vcOutput).toHaveAccessibleName();
    });

    it('должен иметь корректную семантику для кнопок and inputs', () => {
      render(<BuyVCWidget />);
      
      const swapButton = screen.getByRole('button', { name: /купить vc/i });
      const maxButton = screen.getByRole('button', { name: /max/i });
      
      expect(swapButton).toBeInTheDocument();
      expect(maxButton).toBeInTheDocument();
    });
  });
}); 