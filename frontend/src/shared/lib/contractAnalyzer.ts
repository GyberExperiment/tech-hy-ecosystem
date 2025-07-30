/**
 * 🔍 Contract Analyzer for Tech HY Ecosystem
 * 
 * Анализирует реальные контракты в BSC mainnet для интеграции
 * Валидирует ABI, функции и безопасность контрактов
 */

import { ethers } from 'ethers';
import { BSCScanAPI } from './bscscanApi';
import { CONTRACTS, getCurrentNetwork, getNetworkInfo } from '../config/contracts';
import { rpcService } from '../api/rpcService';
import { log } from './logger';

export interface ContractAnalysis {
  address: string;
  name: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  isValid: boolean;
  isContract: boolean;
  hasSource: boolean;
  functions: string[];
  events: string[];
  security: {
    isPaused?: boolean;
    isOwnable?: boolean;
    hasMintFunction?: boolean;
    hasBurnFunction?: boolean;
    isUpgradeable?: boolean;
  };
  compatibility: {
    isERC20: boolean;
    isERC20Votes: boolean;
    hasCustomFunctions: boolean;
  };
  error?: string;
  lastAnalyzed: number;
}

export interface MainnetTokenData {
  VC_TOKEN: ContractAnalysis;
  VG_TOKEN: ContractAnalysis;
  summary: {
    totalAnalyzed: number;
    validContracts: number;
    compatibleContracts: number;
    errors: string[];
    recommendations: string[];
  };
}

// Standard ERC20 ABI для основных функций
const ERC20_BASIC_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function transferFrom(address, address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Расширенные функции для анализа
const EXTENDED_FUNCTIONS = [
  // Ownable
  "function owner() view returns (address)",
  "function transferOwnership(address) external",
  
  // Pausable
  "function paused() view returns (bool)",
  "function pause() external",
  "function unpause() external",
  
  // Mintable/Burnable
  "function mint(address, uint256) external",
  "function burn(uint256) external",
  "function burnFrom(address, uint256) external",
  
  // ERC20Votes
  "function delegates(address) view returns (address)",
  "function delegate(address) external",
  "function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external",
  "function getCurrentVotes(address) view returns (uint256)",
  "function getPriorVotes(address, uint256) view returns (uint256)",
  
  // Upgradeable
  "function implementation() view returns (address)",
  "function admin() view returns (address)",
  "function upgrade(address) external",
  "function upgradeToAndCall(address, bytes) external payable"
];

export class ContractAnalyzer {
  
  /**
   * Анализирует один контракт
   */
  static async analyzeContract(
    address: string, 
    expectedSymbol?: string
  ): Promise<ContractAnalysis> {
    log.info('Analyzing contract', {
      component: 'ContractAnalyzer',
      function: 'analyzeContract',
      address,
      expectedSymbol,
      network: getCurrentNetwork()
    });

    const analysis: ContractAnalysis = {
      address,
      name: expectedSymbol || 'Unknown',
      isValid: false,
      isContract: false,
      hasSource: false,
      functions: [],
      events: [],
      security: {},
      compatibility: {
        isERC20: false,
        isERC20Votes: false,
        hasCustomFunctions: false
      },
      lastAnalyzed: Date.now()
    };

    try {
      // 1. Валидация контракта через BSCScan
      const validation = await BSCScanAPI.validateContract(address);
      analysis.isContract = validation.isContract;
      analysis.hasSource = validation.hasSource;
      
      if (!validation.exists || !validation.isContract) {
        analysis.error = validation.error || 'Contract does not exist';
        return analysis;
      }

      if (validation.contractName) {
        analysis.name = validation.contractName;
      }

      // 2. Получение основной информации токена
      try {
        const tokenInfo = await this.getTokenBasicInfo(address);
        analysis.symbol = tokenInfo.symbol;
        analysis.decimals = tokenInfo.decimals;
        analysis.totalSupply = tokenInfo.totalSupply;
      } catch (error) {
        log.warn('Failed to get basic token info', {
          component: 'ContractAnalyzer',
          address
        }, error as Error);
      }

      // 3. Анализ функций и событий
      const contractSource = await BSCScanAPI.getContractSource(address);
      if (contractSource?.ABI) {
        try {
          const abi = JSON.parse(contractSource.ABI);
          analysis.functions = abi
            .filter((item: any) => item.type === 'function')
            .map((item: any) => item.name);
          
          analysis.events = abi
            .filter((item: any) => item.type === 'event')
            .map((item: any) => item.name);
        } catch (abiError) {
          log.warn('Failed to parse contract ABI', {
            component: 'ContractAnalyzer',
            address
          }, abiError as Error);
        }
      }

      // 4. Проверка совместимости ERC20
      analysis.compatibility.isERC20 = await this.checkERC20Compatibility(address);
      
      // 5. Проверка ERC20Votes
      analysis.compatibility.isERC20Votes = await this.checkERC20VotesCompatibility(address);
      
      // 6. Анализ безопасности
      analysis.security = await this.analyzeSecurity(address);
      
      // 7. Проверка кастомных функций
      analysis.compatibility.hasCustomFunctions = analysis.functions.some(func => 
        !['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf', 'transfer', 'transferFrom', 'approve', 'allowance'].includes(func)
      );

      analysis.isValid = analysis.isContract && analysis.compatibility.isERC20;

      log.info('Contract analysis completed', {
        component: 'ContractAnalyzer',
        address,
        isValid: analysis.isValid,
        isERC20: analysis.compatibility.isERC20,
        symbol: analysis.symbol,
        functionsCount: analysis.functions.length
      });

      return analysis;

    } catch (error) {
      log.error('Contract analysis failed', {
        component: 'ContractAnalyzer',
        address,
        expectedSymbol
      }, error as Error);
      
      analysis.error = (error as Error).message;
      return analysis;
    }
  }

  /**
   * Получает базовую информацию о токене
   */
  private static async getTokenBasicInfo(address: string): Promise<{
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
  }> {
    try {
      const results = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(address, ERC20_BASIC_ABI, provider);
        
        const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply()
        ]);

        return {
          name: name.status === 'fulfilled' ? name.value : undefined,
          symbol: symbol.status === 'fulfilled' ? symbol.value : undefined,
          decimals: decimals.status === 'fulfilled' ? Number(decimals.value) : undefined,
          totalSupply: totalSupply.status === 'fulfilled' ? ethers.formatUnits(totalSupply.value, decimals.status === 'fulfilled' ? decimals.value : 18) : undefined
        };
      });

      return results;
    } catch (error) {
      log.error('Failed to get token basic info', {
        component: 'ContractAnalyzer',
        function: 'getTokenBasicInfo',
        address
      }, error as Error);
      throw error;
    }
  }

  /**
   * Проверяет совместимость с ERC20
   */
  private static async checkERC20Compatibility(address: string): Promise<boolean> {
    try {
      const results = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(address, ERC20_BASIC_ABI, provider);
        
        // Проверяем основные функции ERC20
        const checks = await Promise.allSettled([
          contract.name(),
          contract.symbol(), 
          contract.decimals(),
          contract.totalSupply()
        ]);

        // Все основные функции должны работать
        return checks.every(check => check.status === 'fulfilled');
      });

      return results;
    } catch (error) {
      log.warn('ERC20 compatibility check failed', {
        component: 'ContractAnalyzer',
        function: 'checkERC20Compatibility',
        address
      }, error as Error);
      return false;
    }
  }

  /**
   * Проверяет совместимость с ERC20Votes
   */
  private static async checkERC20VotesCompatibility(address: string): Promise<boolean> {
    try {
      const results = await rpcService.withFallback(async (provider) => {
        const contract = new ethers.Contract(address, [
          "function delegates(address) view returns (address)",
          "function getCurrentVotes(address) view returns (uint256)"
        ], provider);
        
        // Пробуем вызвать функции ERC20Votes
        const checks = await Promise.allSettled([
          contract.delegates('0x0000000000000000000000000000000000000000'),
          contract.getCurrentVotes('0x0000000000000000000000000000000000000000')
        ]);

        return checks.every(check => check.status === 'fulfilled');
      });

      return results;
    } catch (error) {
      return false; // ERC20Votes не обязательно
    }
  }

  /**
   * Анализирует безопасность контракта
   */
  private static async analyzeSecurity(address: string): Promise<{
    isPaused?: boolean;
    isOwnable?: boolean;
    hasMintFunction?: boolean;
    hasBurnFunction?: boolean;
    isUpgradeable?: boolean;
  }> {
    const security: any = {};

    try {
      await rpcService.withFallback(async (provider) => {
        // Проверка Pausable
        try {
          const pausableContract = new ethers.Contract(address, ["function paused() view returns (bool)"], provider);
          security.isPaused = await pausableContract.paused();
        } catch {}

        // Проверка Ownable
        try {
          const ownableContract = new ethers.Contract(address, ["function owner() view returns (address)"], provider);
          const owner = await ownableContract.owner();
          security.isOwnable = owner !== '0x0000000000000000000000000000000000000000';
        } catch {}

        // Проверка Mintable
        try {
          const mintableContract = new ethers.Contract(address, ["function mint(address, uint256) external"], provider);
          security.hasMintFunction = true; // Если функция есть в ABI
        } catch {}

        // Проверка Burnable
        try {
          const burnableContract = new ethers.Contract(address, ["function burn(uint256) external"], provider);
          security.hasBurnFunction = true;
        } catch {}

        // Проверка Upgradeable
        try {
          const upgradeableContract = new ethers.Contract(address, ["function implementation() view returns (address)"], provider);
          await upgradeableContract.implementation();
          security.isUpgradeable = true;
        } catch {}
      });
    } catch (error) {
      log.warn('Security analysis partially failed', {
        component: 'ContractAnalyzer',
        function: 'analyzeSecurity',
        address
      }, error as Error);
    }

    return security;
  }

  /**
   * Анализирует все mainnet токены
   */
  static async analyzeMainnetTokens(): Promise<MainnetTokenData> {
    log.info('Starting mainnet tokens analysis', {
      component: 'ContractAnalyzer',
      function: 'analyzeMainnetTokens',
      network: getCurrentNetwork()
    });

    if (getCurrentNetwork() !== 'mainnet') {
      throw new Error('This function only works on mainnet');
    }

    const errors: string[] = [];
    const recommendations: string[] = [];

    try {
      // Анализируем VC и VG токены параллельно
      const [vcAnalysis, vgAnalysis] = await Promise.allSettled([
        this.analyzeContract(CONTRACTS.VC_TOKEN, 'VC'),
        this.analyzeContract(CONTRACTS.VG_TOKEN, 'VG')
      ]);

      const vcResult = vcAnalysis.status === 'fulfilled' ? vcAnalysis.value : null;
      const vgResult = vgAnalysis.status === 'fulfilled' ? vgAnalysis.value : null;

      // Собираем ошибки
      if (vcAnalysis.status === 'rejected') {
        errors.push(`VC Token analysis failed: ${vcAnalysis.reason}`);
      }
      if (vgAnalysis.status === 'rejected') {
        errors.push(`VG Token analysis failed: ${vgAnalysis.reason}`);
      }

      // Генерируем рекомендации
      if (vcResult && !vcResult.isValid) {
        recommendations.push('VC Token may not be fully ERC20 compatible');
      }
      if (vgResult && !vgResult.compatibility.isERC20Votes) {
        recommendations.push('VG Token does not support ERC20Votes (governance features may be limited)');
      }
      if (vcResult?.security.hasMintFunction) {
        recommendations.push('VC Token has mint function - verify minting is properly restricted');
      }
      if (vgResult?.security.isUpgradeable) {
        recommendations.push('VG Token is upgradeable - monitor for upgrade events');
      }

      const summary = {
        totalAnalyzed: 2,
        validContracts: [vcResult, vgResult].filter(r => r?.isValid).length,
        compatibleContracts: [vcResult, vgResult].filter(r => r?.compatibility.isERC20).length,
        errors,
        recommendations
      };

      log.info('Mainnet tokens analysis completed', {
        component: 'ContractAnalyzer',
        function: 'analyzeMainnetTokens',
        summary
      });

      return {
        VC_TOKEN: vcResult || {} as ContractAnalysis,
        VG_TOKEN: vgResult || {} as ContractAnalysis,
        summary
      };

    } catch (error) {
      log.error('Mainnet tokens analysis failed', {
        component: 'ContractAnalyzer',
        function: 'analyzeMainnetTokens'
      }, error as Error);
      throw error;
    }
  }

  /**
   * Создает отчет анализа в виде строки
   */
  static generateAnalysisReport(analysis: MainnetTokenData): string {
    const report = [
      '🔍 TECH HY MAINNET CONTRACTS ANALYSIS REPORT',
      '=' .repeat(50),
      '',
      `📊 SUMMARY:`,
      `   Total Analyzed: ${analysis.summary.totalAnalyzed}`,
      `   Valid Contracts: ${analysis.summary.validContracts}`,
      `   ERC20 Compatible: ${analysis.summary.compatibleContracts}`,
      '',
      `🪙 VC TOKEN (${CONTRACTS.VC_TOKEN}):`,
      `   Name: ${analysis.VC_TOKEN.name || 'Unknown'}`,
      `   Symbol: ${analysis.VC_TOKEN.symbol || 'Unknown'}`,
      `   Decimals: ${analysis.VC_TOKEN.decimals || 'Unknown'}`,
      `   Total Supply: ${analysis.VC_TOKEN.totalSupply || 'Unknown'}`,
      `   Is Valid: ${analysis.VC_TOKEN.isValid ? '✅' : '❌'}`,
      `   ERC20 Compatible: ${analysis.VC_TOKEN.compatibility?.isERC20 ? '✅' : '❌'}`,
      `   Has Source: ${analysis.VC_TOKEN.hasSource ? '✅' : '❌'}`,
      `   Functions: ${analysis.VC_TOKEN.functions?.length || 0}`,
      '',
      `🏆 VG TOKEN (${CONTRACTS.VG_TOKEN}):`,
      `   Name: ${analysis.VG_TOKEN.name || 'Unknown'}`,
      `   Symbol: ${analysis.VG_TOKEN.symbol || 'Unknown'}`,
      `   Decimals: ${analysis.VG_TOKEN.decimals || 'Unknown'}`,
      `   Total Supply: ${analysis.VG_TOKEN.totalSupply || 'Unknown'}`,
      `   Is Valid: ${analysis.VG_TOKEN.isValid ? '✅' : '❌'}`,
      `   ERC20 Compatible: ${analysis.VG_TOKEN.compatibility?.isERC20 ? '✅' : '❌'}`,
      `   ERC20Votes: ${analysis.VG_TOKEN.compatibility?.isERC20Votes ? '✅' : '❌'}`,
      `   Has Source: ${analysis.VG_TOKEN.hasSource ? '✅' : '❌'}`,
      `   Functions: ${analysis.VG_TOKEN.functions?.length || 0}`,
      ''
    ];

    if (analysis.summary.errors.length > 0) {
      report.push('❌ ERRORS:', ...analysis.summary.errors.map(e => `   - ${e}`), '');
    }

    if (analysis.summary.recommendations.length > 0) {
      report.push('💡 RECOMMENDATIONS:', ...analysis.summary.recommendations.map(r => `   - ${r}`), '');
    }

    report.push('=' .repeat(50));

    return report.join('\n');
  }
}

// Export types
export type { ContractAnalysis, MainnetTokenData }; 