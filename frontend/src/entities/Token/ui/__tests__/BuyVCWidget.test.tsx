import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
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
    a: ({ children, className, ...props }: any) => (
      <a className={className} {...props}>{children}</a>
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
      
      const bnbInput = screen.getByTestId('bnb-input');
      const vcOutput = screen.getByTestId('vc-output');
      
      expect(bnbInput).toBeInTheDocument();
      expect(vcOutput).toBeInTheDocument();
      expect(vcOutput).toHaveAttribute('readonly');
    });

    it('должен показать кнопки настроек', () => {
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-button');
      const infoButton = screen.getByTestId('info-button');
      expect(settingsButton).toBeInTheDocument();
      expect(infoButton).toBeInTheDocument();
    });

    it('должен отрендерить статистику цены и торгов', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByText('Цена VC')).toBeInTheDocument();
      expect(screen.getByText('Объем 24ч')).toBeInTheDocument();
      expect(screen.getByText('Ликвидность')).toBeInTheDocument();
    });
  });

  describe('Состояние подключения кошелька', () => {
    it('должен показать кнопку подключения, если кошелек не подключен', () => {
      mockUseAccount.mockReturnValue({
        address: null,
        isConnected: false,
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByTestId('connect-wallet-button')).toBeInTheDocument();
      expect(screen.getByText('Подключите кошелек')).toBeInTheDocument();
    });

    it('должен показать кнопку покупки, если кошелек подключен', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByTestId('swap-button')).toBeInTheDocument();
      expect(screen.getByText('Купить VC (V2)')).toBeInTheDocument();
    });
  });

  describe('Ввод суммы BNB', () => {
    it('должен позволить ввести валидную сумму BNB', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1.5');
      
      expect(bnbInput).toHaveValue('1.5');
    });

    it('должен фильтровать недопустимые символы в BNB поле', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, 'abc1.5xyz');
      
      expect(bnbInput).toHaveValue('1.5');
    });

    it('должен вызвать getVCQuote при изменении суммы BNB', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1500.0' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      await waitFor(() => {
        expect(mockGetVCQuote).toHaveBeenCalledWith('1', 'v2');
      }, { timeout: 1000 });
    });

    it('должен обновить количество VC при получении котировки', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1500.1234' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      await waitFor(() => {
        const vcOutput = screen.getByTestId('vc-output');
        expect(vcOutput).toHaveValue('1500.1234');
      }, { timeout: 1000 });
    });

    it('должен установить 1 BNB при нажатии на MAX', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const maxButton = screen.getByTestId('max-button');
      await user.click(maxButton);
      
      const bnbInput = screen.getByTestId('bnb-input');
      expect(bnbInput).toHaveValue('1');
    });
  });

  describe('Переключение версий протокола', () => {
    it('должен по умолчанию выбрать V2', () => {
      render(<BuyVCWidget />);
      
      const v2Button = screen.getByTestId('v2-button');
      expect(v2Button).toBeInTheDocument();
    });

    it('должен показать V3 как отключенный', () => {
      render(<BuyVCWidget />);
      
      const v3Button = screen.getByTestId('v3-button');
      expect(v3Button).toBeDisabled();
    });

    it('должен обновить котировку при смене версии протокола', async () => {
      const user = userEvent.setup();
      mockGetVCQuote.mockResolvedValue({ amountOut: '1400.0' });
      
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      // Переключаем на V2 (он уже выбран, но проверим обновление)
      const v2Button = screen.getByTestId('v2-button');
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
      
      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);
      
      expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
      expect(screen.getByText('Максимальный slippage')).toBeInTheDocument();
    });

    it('должен позволить изменить slippage', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);
      
      const slippageInput = screen.getByTestId('slippage-input');
      await user.clear(slippageInput);
      await user.type(slippageInput, '1.0');
      
      expect(slippageInput).toHaveValue(1);
    });

    it('должен показать быстрые кнопки slippage', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);
      
      expect(screen.getByText('0.1%')).toBeInTheDocument();
      expect(screen.getByText('0.5%')).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('3%')).toBeInTheDocument();
    });
  });

  describe('Расширенная информация', () => {
    it('должен показать расширенную панель при нажатии на info', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      // Сначала вводим сумму чтобы показалась расширенная панель
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      const infoButton = screen.getByTestId('info-button');
      await user.click(infoButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('advanced-panel')).toBeInTheDocument();
        expect(screen.getByText('Детали транзакции')).toBeInTheDocument();
      });
    });
  });

  describe('Выполнение swap', () => {
    it('должен быть отключен если нет суммы BNB', () => {
      render(<BuyVCWidget />);
      
      const swapButton = screen.getByTestId('swap-button');
      expect(swapButton).toBeDisabled();
    });

    it('должен быть активен с валидной суммой BNB', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      const swapButton = screen.getByTestId('swap-button');
      expect(swapButton).not.toBeDisabled();
    });

    it('должен вызвать buyVCWithBNB при нажатии на кнопку swap', async () => {
      const user = userEvent.setup();
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      await user.type(bnbInput, '1');
      
      const swapButton = screen.getByTestId('swap-button');
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
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('должен показать кнопку "Новый swap" при ошибке', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        error: { message: 'Error' },
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByTestId('new-swap-button')).toBeInTheDocument();
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
      
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
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
      
      const link = screen.getByTestId('transaction-link');
      expect(link).toHaveAttribute('href', `https://testnet.bscscan.com/tx/${txHash}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('Посмотреть транзакцию');
    });

    it('должен показать кнопку "Новый swap" при успехе', () => {
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        isSuccess: true,
        txHash: '0xabcdef123456',
      });

      render(<BuyVCWidget />);
      
      expect(screen.getByTestId('new-swap-button')).toBeInTheDocument();
      expect(screen.getByText('Новый swap')).toBeInTheDocument();
    });
  });

  describe('Сброс состояния', () => {
    it('должен сбросить состояние и форму при нажатии "Новый swap"', async () => {
      const user = userEvent.setup();
      mockUsePancakeSwap.mockReturnValue({
        ...defaultPancakeSwapState,
        error: { message: 'Test error' },
      });

      render(<BuyVCWidget />);
      
      const resetButton = screen.getByTestId('new-swap-button');
      await user.click(resetButton);
      
      expect(mockResetState).toHaveBeenCalled();
    });
  });

  describe('Пользовательский опыт', () => {
    it('должен применить пользовательский className', () => {
      const customClass = 'custom-widget-class';
      render(<BuyVCWidget className={customClass} />);
      
      const widget = document.querySelector('.custom-widget-class');
      expect(widget).toBeInTheDocument();
      expect(widget).toHaveClass('w-full');
      expect(widget).toHaveClass('max-w-md');
      expect(widget).toHaveClass('mx-auto');
    });

    it('должен иметь правильную responsive структуру', () => {
      render(<BuyVCWidget />);
      
      const widget = screen.getByText('Купить VC Токены').closest('.max-w-md');
      expect(widget).toHaveClass('mx-auto');
    });
  });

  describe('Современные input поля', () => {
    it('должен скрывать стрелочки number input', () => {
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      expect(bnbInput).toHaveAttribute('type', 'text');
      expect(bnbInput).toHaveAttribute('inputMode', 'decimal');
    });

    it('должен показывать иконки валют в полях', () => {
      render(<BuyVCWidget />);
      
      expect(screen.getByText('BNB')).toBeInTheDocument();
      expect(screen.getByText('VC')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('должен иметь правильные aria-labels для важных элементов', () => {
      render(<BuyVCWidget />);
      
      const bnbInput = screen.getByTestId('bnb-input');
      const vcOutput = screen.getByTestId('vc-output');
      
      expect(bnbInput).toHaveAccessibleName();
      expect(vcOutput).toHaveAccessibleName();
    });

    it('должен иметь корректную семантику для кнопок', () => {
      render(<BuyVCWidget />);
      
      const swapButton = screen.getByTestId('swap-button');
      const maxButton = screen.getByTestId('max-button');
      
      expect(swapButton).toBeInTheDocument();
      expect(maxButton).toBeInTheDocument();
    });
  });

  describe('Debug tests', () => {
    it('should render error message with simplified mock', () => {
      const testError = { message: 'Test error' };
      mockUsePancakeSwap.mockReturnValue({
        getVCQuote: mockGetVCQuote,
        buyVCWithBNB: mockBuyVCWithBNB,
        isLoading: false,
        isSuccess: false,
        error: testError,
        txHash: null,
        resetState: mockResetState,
      });

      const { debug } = render(<BuyVCWidget />);
      
      // Проверяем что мок вызывается правильно
      console.log('DEBUG: Mock error value:', testError);
      console.log('DEBUG: Mock return value:', mockUsePancakeSwap());
      
      // Проверяем наличие элементов
      const errorElement = screen.queryByTestId('error-message');
      console.log('DEBUG: Error element found:', errorElement);
      
      const swapButton = screen.queryByTestId('swap-button');
      console.log('DEBUG: Swap button found:', swapButton);
      
      debug(); // Выводит весь HTML для debugging
      
      expect(screen.queryByTestId('error-message')).not.toBeNull();
    });
  });
}); 