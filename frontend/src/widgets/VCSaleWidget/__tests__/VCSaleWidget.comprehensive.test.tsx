import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VCSaleWidget } from '../ui/VCSaleWidget';
import { VCSaleService } from '../services/VCSaleService';
import { useWeb3 } from '../../../shared/lib/Web3Context';
import { useTokenData } from '../../../entities/Token/model/useTokenData';
import { useBreakpoint } from '../../../shared/hooks/useResponsive';

// Mock dependencies
vi.mock('../../../shared/lib/Web3Context');
vi.mock('../../../entities/Token/model/useTokenData');
vi.mock('../../../shared/hooks/useResponsive');
vi.mock('../services/VCSaleService');

// Mock external libraries
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock Web3 provider
const mockProvider = {
  getNetwork: vi.fn(),
  getBalance: vi.fn(),
  getCode: vi.fn(),
};

const mockSigner = {
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
};

describe('VCSaleWidget - Comprehensive Production Tests', () => {
  const mockUseWeb3 = useWeb3 as vi.MockedFunction<typeof useWeb3>;
  const mockUseTokenData = useTokenData as vi.MockedFunction<typeof useTokenData>;
  const mockUseBreakpoint = useBreakpoint as vi.MockedFunction<typeof useBreakpoint>;

  // Mock service instance
  const mockVCSaleService = {
    initialize: vi.fn(),
    getSaleStats: vi.fn(),
    getUserStats: vi.fn(),
    getSecurityStatus: vi.fn(),
    calculateBNBAmount: vi.fn(),
    canPurchase: vi.fn(),
    executePurchase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(VCSaleService).mockImplementation(() => mockVCSaleService as any);

    // Default mock implementations
    mockUseWeb3.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      signer: mockSigner,
      provider: mockProvider,
      chainId: 97, // BSC Testnet
      isConnected: true,
    } as any);

    mockUseTokenData.mockReturnValue({
      balances: {
        BNB: '1.0',
        VC: '0',
      },
      loading: false,
      triggerGlobalRefresh: vi.fn(),
    } as any);

    mockUseBreakpoint.mockReturnValue({
      isMobile: false,
      isSmallMobile: false,
    } as any);

    // Default service mock responses
    mockVCSaleService.getSaleStats.mockResolvedValue({
      totalVCAvailable: '1000000',
      totalVCSold: '50000',
      currentVCBalance: '950000',
      pricePerVC: '1000000000000000', // 0.001 BNB in wei
      saleActive: true,
      totalRevenue: '50000000000000000', // 0.05 BNB in wei
      dailySalesAmount: '5000',
      circuitBreakerActive: false,
      salesInCurrentWindow: '5000',
      lastUpdated: Date.now(),
    });

    mockVCSaleService.getUserStats.mockResolvedValue({
      purchasedVC: '0',
      spentBNB: '0',
      lastPurchaseTimestamp: '0',
      isBlacklisted: false,
      canPurchaseNext: '0',
      totalTransactions: 0,
    });

    mockVCSaleService.getSecurityStatus.mockResolvedValue({
      mevProtectionEnabled: true,
      circuitBreakerActive: false,
      contractPaused: false,
      userBlacklisted: false,
      rateLimited: false,
      dailyLimitReached: false,
      nextPurchaseAvailable: null,
    });

    mockVCSaleService.calculateBNBAmount.mockResolvedValue('10000000000000000'); // 0.01 BNB
    mockVCSaleService.canPurchase.mockResolvedValue({ canPurchase: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('🎨 Component Rendering', () => {
    it('should render all essential elements', async () => {
      render(<VCSaleWidget />);

      // Main title
      expect(screen.getByText('Buy VC Tokens')).toBeInTheDocument();

      // Input fields
      expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/BNB amount/i)).toBeInTheDocument();

      // Purchase button
      expect(screen.getByRole('button', { name: /purchase/i })).toBeInTheDocument();

      // Security status indicators
      await waitFor(() => {
        expect(screen.getByText('Sale Active')).toBeInTheDocument();
        expect(screen.getByText('MEV Protection')).toBeInTheDocument();
      });
    });

    it('should render loading state correctly', async () => {
      // Mock loading state
      mockVCSaleService.getSaleStats.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<VCSaleWidget />);

      // Should show loading indicators
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading sale data...')).toBeInTheDocument();
    });

    it('should adapt to mobile layout', async () => {
      mockUseBreakpoint.mockReturnValue({
        isMobile: true,
        isSmallMobile: true,
      });

      render(<VCSaleWidget />);

      // Should have mobile-specific classes
      const widget = screen.getByTestId('vcsale-widget');
      expect(widget).toHaveClass('mobile-layout');
    });
  });

  describe('🔗 Wallet Connection States', () => {
    it('should show connection prompt when wallet not connected', () => {
      mockUseWeb3.mockReturnValue({
        account: null,
        signer: null,
        provider: null,
        chainId: null,
        isConnected: false,
      } as any);

      render(<VCSaleWidget />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Please connect your wallet to purchase VC tokens')).toBeInTheDocument();
    });

    it('should show network error for unsupported networks', () => {
      mockUseWeb3.mockReturnValue({
        account: '0x1234567890123456789012345678901234567890',
        signer: mockSigner,
        provider: mockProvider,
        chainId: 1, // Ethereum mainnet (unsupported)
        isConnected: true,
      } as any);

      render(<VCSaleWidget />);

      expect(screen.getByText('Unsupported Network')).toBeInTheDocument();
      expect(screen.getByText(/Please switch to BSC/i)).toBeInTheDocument();
    });

    it('should handle wallet connection changes', async () => {
      const { rerender } = render(<VCSaleWidget />);

      // Start disconnected
      mockUseWeb3.mockReturnValue({
        account: null,
        signer: null,
        provider: null,
        chainId: null,
        isConnected: false,
      } as any);

      rerender(<VCSaleWidget />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

      // Connect wallet
      mockUseWeb3.mockReturnValue({
        account: '0x1234567890123456789012345678901234567890',
        signer: mockSigner,
        provider: mockProvider,
        chainId: 97,
        isConnected: true,
      } as any);

      rerender(<VCSaleWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Buy VC Tokens')).toBeInTheDocument();
      });
    });
  });

  describe('💰 Purchase Flow', () => {
    it('should calculate BNB amount automatically', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      const vcInput = screen.getByLabelText(/VC amount/i);
      const bnbInput = screen.getByLabelText(/BNB amount/i);

      // Type VC amount
      await user.clear(vcInput);
      await user.type(vcInput, '10');

      // Should calculate BNB amount
      await waitFor(() => {
        expect(mockVCSaleService.calculateBNBAmount).toHaveBeenCalledWith('10');
      });

      // BNB field should be updated
      await waitFor(() => {
        expect(bnbInput).toHaveValue('0.01');
      });
    });

    it('should validate input amounts', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      const vcInput = screen.getByLabelText(/VC amount/i);

      // Test invalid inputs
      const invalidInputs = ['abc', '-1', '0', '10001', '1.1234567890'];

      for (const input of invalidInputs) {
        await user.clear(vcInput);
        await user.type(vcInput, input);

        // Should show validation error
        await waitFor(() => {
          expect(screen.getByText(/Invalid amount/i)).toBeInTheDocument();
        });
      }
    });

    it('should handle successful purchase', async () => {
      const user = userEvent.setup();
      const mockOnPurchaseSuccess = vi.fn();

      mockVCSaleService.executePurchase.mockResolvedValue({
        hash: '0xabcdef123456',
        status: 'success',
        vcAmount: '10',
        bnbAmount: '0.01',
        gasUsed: '150000',
      });

      render(<VCSaleWidget onPurchaseSuccess={mockOnPurchaseSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      // Fill form
      const vcInput = screen.getByLabelText(/VC amount/i);
      await user.clear(vcInput);
      await user.type(vcInput, '10');

      // Click purchase button
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      await user.click(purchaseButton);

      // Should show loading state
      expect(screen.getByText('Processing purchase...')).toBeInTheDocument();

      // Should call service
      await waitFor(() => {
        expect(mockVCSaleService.executePurchase).toHaveBeenCalledWith(
          {
            vcAmount: '10',
            expectedBnbAmount: '0.01',
            slippageTolerance: 0.01,
          },
          '0x1234567890123456789012345678901234567890'
        );
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('✅ Successfully purchased 10 VC!')).toBeInTheDocument();
      });

      // Should call success callback
      expect(mockOnPurchaseSuccess).toHaveBeenCalledWith('0xabcdef123456', '10');
    });

    it('should handle purchase failures', async () => {
      const user = userEvent.setup();
      const mockOnError = vi.fn();

      mockVCSaleService.executePurchase.mockRejectedValue(
        new Error('Insufficient BNB balance')
      );

      render(<VCSaleWidget onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      // Fill form
      const vcInput = screen.getByLabelText(/VC amount/i);
      await user.clear(vcInput);
      await user.type(vcInput, '10');

      // Click purchase button
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      await user.click(purchaseButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('❌ Insufficient BNB balance')).toBeInTheDocument();
      });

      // Should call error callback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient BNB balance',
        })
      );
    });
  });

  describe('🛡️ Security Features', () => {
    it('should display security status correctly', async () => {
      render(<VCSaleWidget />);

      await waitFor(() => {
        // Should show all security indicators
        expect(screen.getByText('Sale Active')).toBeInTheDocument();
        expect(screen.getByText('MEV Protection')).toBeInTheDocument();
        expect(screen.getByText('Circuit Breaker')).toBeInTheDocument();
        expect(screen.getByText('User Status')).toBeInTheDocument();
      });
    });

    it('should handle rate limiting', async () => {
      mockVCSaleService.getSecurityStatus.mockResolvedValue({
        mevProtectionEnabled: true,
        circuitBreakerActive: false,
        contractPaused: false,
        userBlacklisted: false,
        rateLimited: true,
        dailyLimitReached: false,
        nextPurchaseAvailable: Date.now() + 60000, // 1 minute from now
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Rate Limited')).toBeInTheDocument();
        expect(screen.getByText(/Next purchase available/i)).toBeInTheDocument();
      });

      // Purchase button should be disabled
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toBeDisabled();
    });

    it('should handle blacklisted user', async () => {
      mockVCSaleService.getSecurityStatus.mockResolvedValue({
        mevProtectionEnabled: true,
        circuitBreakerActive: false,
        contractPaused: false,
        userBlacklisted: true,
        rateLimited: false,
        dailyLimitReached: false,
        nextPurchaseAvailable: null,
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('❌ User Blacklisted')).toBeInTheDocument();
      });

      // Purchase button should be disabled
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toBeDisabled();
    });

    it('should handle circuit breaker activation', async () => {
      mockVCSaleService.getSecurityStatus.mockResolvedValue({
        mevProtectionEnabled: true,
        circuitBreakerActive: true,
        contractPaused: false,
        userBlacklisted: false,
        rateLimited: false,
        dailyLimitReached: false,
        nextPurchaseAvailable: null,
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Circuit Breaker Active')).toBeInTheDocument();
        expect(screen.getByText(/Sales temporarily paused/i)).toBeInTheDocument();
      });

      // Purchase button should be disabled
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toBeDisabled();
    });

    it('should handle contract paused', async () => {
      mockVCSaleService.getSecurityStatus.mockResolvedValue({
        mevProtectionEnabled: true,
        circuitBreakerActive: false,
        contractPaused: true,
        userBlacklisted: false,
        rateLimited: false,
        dailyLimitReached: false,
        nextPurchaseAvailable: null,
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('🔒 Contract Paused')).toBeInTheDocument();
      });

      // Purchase button should be disabled
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toBeDisabled();
    });
  });

  describe('📊 Data Display', () => {
    it('should display sale statistics', async () => {
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Available VC: 950,000')).toBeInTheDocument();
        expect(screen.getByText('Total Sold: 50,000')).toBeInTheDocument();
        expect(screen.getByText('Price: 0.001 BNB per VC')).toBeInTheDocument();
      });
    });

    it('should display user statistics', async () => {
      mockVCSaleService.getUserStats.mockResolvedValue({
        purchasedVC: '1000',
        spentBNB: '1000000000000000000', // 1 BNB
        lastPurchaseTimestamp: '1699999999',
        isBlacklisted: false,
        canPurchaseNext: '0',
        totalTransactions: 5,
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Your VC Purchased: 1,000')).toBeInTheDocument();
        expect(screen.getByText('Your BNB Spent: 1.0')).toBeInTheDocument();
        expect(screen.getByText('Total Transactions: 5')).toBeInTheDocument();
      });
    });

    it('should handle empty/zero statistics', async () => {
      mockVCSaleService.getSaleStats.mockResolvedValue({
        totalVCAvailable: '0',
        totalVCSold: '0',
        currentVCBalance: '0',
        pricePerVC: '0',
        saleActive: false,
        totalRevenue: '0',
        dailySalesAmount: '0',
        circuitBreakerActive: false,
        salesInCurrentWindow: '0',
        lastUpdated: Date.now(),
      });

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Available VC: 0')).toBeInTheDocument();
        expect(screen.getByText('Sale Inactive')).toBeInTheDocument();
      });
    });
  });

  describe('🔄 Real-time Updates', () => {
    it('should refresh data automatically', async () => {
      vi.useFakeTimers();
      
      render(<VCSaleWidget />);

      // Initial load
      await waitFor(() => {
        expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(1);
      });

      // Advance time by 30 seconds (auto-refresh interval)
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should refresh data
      await waitFor(() => {
        expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(1);
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should refresh data
      await waitFor(() => {
        expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should show refresh indicator', async () => {
      const user = userEvent.setup();
      
      // Mock slow refresh
      mockVCSaleService.getSaleStats.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<VCSaleWidget />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show refresh indicator
      expect(screen.getByTestId('refresh-spinner')).toBeInTheDocument();
    });
  });

  describe('📱 Responsive Design', () => {
    it('should adapt to mobile screens', () => {
      mockUseBreakpoint.mockReturnValue({
        isMobile: true,
        isSmallMobile: false,
      });

      render(<VCSaleWidget />);

      const widget = screen.getByTestId('vcsale-widget');
      expect(widget).toHaveClass('mobile-layout');
    });

    it('should adapt to small mobile screens', () => {
      mockUseBreakpoint.mockReturnValue({
        isMobile: true,
        isSmallMobile: true,
      });

      render(<VCSaleWidget />);

      const widget = screen.getByTestId('vcsale-widget');
      expect(widget).toHaveClass('small-mobile-layout');
    });
  });

  describe('⚡ Performance', () => {
    it('should debounce amount calculations', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      const vcInput = screen.getByLabelText(/VC amount/i);

      // Type rapidly
      await user.clear(vcInput);
      await user.type(vcInput, '123');

      // Should only calculate once after debounce
      await waitFor(() => {
        expect(mockVCSaleService.calculateBNBAmount).toHaveBeenCalledTimes(1);
        expect(mockVCSaleService.calculateBNBAmount).toHaveBeenCalledWith('123');
      });
    });

    it('should memoize expensive calculations', async () => {
      const { rerender } = render(<VCSaleWidget />);

      // First render
      await waitFor(() => {
        expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(1);
      });

      // Rerender with same props
      rerender(<VCSaleWidget />);

      // Should not call service again
      expect(mockVCSaleService.getSaleStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('🎯 Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      mockVCSaleService.getSaleStats.mockRejectedValue(
        new Error('Network connection failed')
      );

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
        expect(screen.getByText(/Unable to load sale data/i)).toBeInTheDocument();
      });
    });

    it('should handle service unavailable', async () => {
      mockVCSaleService.getSaleStats.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
      });
    });

    it('should handle insufficient balance', async () => {
      mockUseTokenData.mockReturnValue({
        balances: {
          BNB: '0.001', // Very low balance
          VC: '0',
        },
        loading: false,
        triggerGlobalRefresh: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      // Try to purchase more than balance allows
      const vcInput = screen.getByLabelText(/VC amount/i);
      await user.clear(vcInput);
      await user.type(vcInput, '100'); // Would require 0.1 BNB

      // Should show insufficient balance warning
      await waitFor(() => {
        expect(screen.getByText(/Insufficient BNB balance/i)).toBeInTheDocument();
      });

      // Purchase button should be disabled
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toBeDisabled();
    });

    it('should handle very large numbers', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      const vcInput = screen.getByLabelText(/VC amount/i);
      
      // Try to input a very large number
      await user.clear(vcInput);
      await user.type(vcInput, '999999999999999999999');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Amount too large/i)).toBeInTheDocument();
      });
    });

    it('should handle zero amounts', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      const vcInput = screen.getByLabelText(/VC amount/i);
      
      // Try to input zero
      await user.clear(vcInput);
      await user.type(vcInput, '0');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Amount must be greater than 0/i)).toBeInTheDocument();
      });
    });
  });

  describe('🔗 Integration Points', () => {
    it('should integrate with Web3 provider correctly', async () => {
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(mockVCSaleService.initialize).toHaveBeenCalledWith(
          mockProvider,
          mockSigner
        );
      });
    });

    it('should update when wallet changes', async () => {
      const { rerender } = render(<VCSaleWidget />);

      // Change wallet
      mockUseWeb3.mockReturnValue({
        account: '0xabcdef1234567890123456789012345678901234',
        signer: mockSigner,
        provider: mockProvider,
        chainId: 97,
        isConnected: true,
      } as any);

      rerender(<VCSaleWidget />);

      // Should reload data for new wallet
      await waitFor(() => {
        expect(mockVCSaleService.getUserStats).toHaveBeenCalledWith(
          '0xabcdef1234567890123456789012345678901234'
        );
      });
    });

    it('should handle provider changes', async () => {
      const newProvider = { ...mockProvider, chainId: 56 };
      
      const { rerender } = render(<VCSaleWidget />);

      mockUseWeb3.mockReturnValue({
        account: '0x1234567890123456789012345678901234567890',
        signer: mockSigner,
        provider: newProvider,
        chainId: 56,
        isConnected: true,
      } as any);

      rerender(<VCSaleWidget />);

      // Should reinitialize service with new provider
      await waitFor(() => {
        expect(mockVCSaleService.initialize).toHaveBeenCalledWith(
          newProvider,
          mockSigner
        );
      });
    });
  });

  describe('🎪 User Experience', () => {
    it('should provide clear feedback for all actions', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText(/VC amount/i)).toBeInTheDocument();
      });

      // Input feedback
      const vcInput = screen.getByLabelText(/VC amount/i);
      await user.clear(vcInput);
      await user.type(vcInput, '10');

      // Should show calculation feedback
      await waitFor(() => {
        expect(screen.getByText(/≈ 0.01 BNB/i)).toBeInTheDocument();
      });

      // Button states
      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).not.toBeDisabled();
    });

    it('should handle accessibility requirements', () => {
      render(<VCSaleWidget />);

      // Check for proper ARIA labels
      const vcInput = screen.getByLabelText(/VC amount/i);
      expect(vcInput).toHaveAttribute('aria-label');

      const purchaseButton = screen.getByRole('button', { name: /purchase/i });
      expect(purchaseButton).toHaveAttribute('aria-label');

      // Check for proper keyboard navigation
      expect(vcInput).toHaveAttribute('tabIndex');
      expect(purchaseButton).toHaveAttribute('tabIndex');
    });

    it('should provide tooltips for complex features', async () => {
      const user = userEvent.setup();
      render(<VCSaleWidget />);

      // Hover over MEV protection indicator
      const mevIndicator = screen.getByTestId('mev-protection-indicator');
      await user.hover(mevIndicator);

      // Should show tooltip
      await waitFor(() => {
        expect(screen.getByText(/MEV Protection prevents rapid purchases/i)).toBeInTheDocument();
      });
    });
  });
}); 