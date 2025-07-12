import { ethers, upgrades, network } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VCSaleContract, VCToken } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Simulate frontend service integration
class VCSaleServiceIntegration {
  private contract: VCSaleContract;
  private provider: ethers.Provider;
  private signer: Signer | null = null;

  constructor(contractAddress: string, provider: ethers.Provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      contractAddress,
      [
        "function purchaseVC(uint256 vcAmount) payable",
        "function calculateBNBAmount(uint256 vcAmount) view returns (uint256)",
        "function calculateVCAmount(uint256 bnbAmount) view returns (uint256)",
        "function getSaleStats() view returns (uint256, uint256, uint256, uint256, bool, uint256, uint256, bool, uint256)",
        "function getUserStats(address user) view returns (uint256, uint256, uint256, bool, uint256)",
        "function canPurchase(address user, uint256 vcAmount) view returns (bool, string)",
        "function saleConfig() view returns (address, uint256, uint256, uint256, uint256, uint256, bool, address, uint256, uint256, uint256)",
        "function securityConfig() view returns (bool, uint256, uint256, bool, uint256, uint256)",
        "function circuitBreaker() view returns (uint256, uint256, bool, uint256)",
        "function paused() view returns (bool)",
        "function blacklistedUsers(address) view returns (bool)",
        "event VCPurchased(address indexed buyer, uint256 vcAmount, uint256 bnbAmount, uint256 pricePerVC, uint256 timestamp, bytes32 indexed purchaseId)",
        "event SecurityEvent(address indexed user, string indexed eventType, string description, uint256 timestamp)",
        "event CircuitBreakerTriggered(uint256 salesAmount, uint256 threshold, uint256 timestamp)"
      ],
      provider
    ) as VCSaleContract;
  }

  initialize(signer: Signer) {
    this.signer = signer;
    this.contract = this.contract.connect(signer) as VCSaleContract;
  }

  async getSaleStats() {
    const [
      totalVCAvailable,
      totalVCSold,
      currentVCBalance,
      pricePerVC,
      saleActive,
      totalRevenue,
      dailySalesAmount,
      circuitBreakerActive,
      salesInCurrentWindow
    ] = await this.contract.getSaleStats();

    return {
      totalVCAvailable: ethers.formatEther(totalVCAvailable),
      totalVCSold: ethers.formatEther(totalVCSold),
      currentVCBalance: ethers.formatEther(currentVCBalance),
      pricePerVC: pricePerVC.toString(),
      saleActive,
      totalRevenue: ethers.formatEther(totalRevenue),
      dailySalesAmount: ethers.formatEther(dailySalesAmount),
      circuitBreakerActive,
      salesInCurrentWindow: ethers.formatEther(salesInCurrentWindow),
      lastUpdated: Date.now(),
    };
  }

  async getUserStats(userAddress: string) {
    const [purchasedVC, spentBNB, lastPurchaseTimestamp, isBlacklisted, canPurchaseNext] = 
      await this.contract.getUserStats(userAddress);

    return {
      purchasedVC: ethers.formatEther(purchasedVC),
      spentBNB: ethers.formatEther(spentBNB),
      lastPurchaseTimestamp: lastPurchaseTimestamp.toString(),
      isBlacklisted,
      canPurchaseNext: canPurchaseNext.toString(),
      totalTransactions: 0, // Would need to track this separately
    };
  }

  async getSecurityStatus(userAddress: string) {
    const [canPurchase, reason] = await this.contract.canPurchase(userAddress, ethers.parseEther("1"));
    const isPaused = await this.contract.paused();
    const isBlacklisted = await this.contract.blacklistedUsers(userAddress);
    const circuitBreakerState = await this.contract.circuitBreaker();
    const securityConfig = await this.contract.securityConfig();

    return {
      mevProtectionEnabled: securityConfig.mevProtectionEnabled,
      circuitBreakerActive: circuitBreakerState.triggered,
      contractPaused: isPaused,
      userBlacklisted: isBlacklisted,
      rateLimited: !canPurchase && reason === "Too frequent purchases",
      dailyLimitReached: !canPurchase && reason === "Daily limit exceeded",
      nextPurchaseAvailable: null, // Would calculate from lastPurchaseTime + cooldown
    };
  }

  async calculateBNBAmount(vcAmount: string): Promise<string> {
    const vcAmountWei = ethers.parseEther(vcAmount);
    const bnbAmountWei = await this.contract.calculateBNBAmount(vcAmountWei);
    return ethers.formatEther(bnbAmountWei);
  }

  async canPurchase(userAddress: string, vcAmount: string): Promise<{ canPurchase: boolean; reason?: string }> {
    const vcAmountWei = ethers.parseEther(vcAmount);
    const [canPurchase, reason] = await this.contract.canPurchase(userAddress, vcAmountWei);
    return { canPurchase, reason: canPurchase ? undefined : reason };
  }

  async executePurchase(params: {
    vcAmount: string;
    expectedBnbAmount: string;
    slippageTolerance: number;
  }, userAddress: string) {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    const vcAmountWei = ethers.parseEther(params.vcAmount);
    const expectedBnbWei = ethers.parseEther(params.expectedBnbAmount);
    
    // Add slippage protection
    const bnbWithBuffer = expectedBnbWei + (expectedBnbWei * BigInt(Math.floor(params.slippageTolerance * 100)) / 10000n);

    const tx = await this.contract.purchaseVC(vcAmountWei, {
      value: bnbWithBuffer
    });

    const receipt = await tx.wait();

    return {
      hash: receipt!.hash,
      status: receipt!.status === 1 ? 'success' : 'failed',
      vcAmount: params.vcAmount,
      bnbAmount: ethers.formatEther(bnbWithBuffer),
      gasUsed: receipt!.gasUsed.toString(),
    };
  }
}

describe("VCSale Integration Tests - Frontend to Contract", () => {
  let owner: Signer;
  let admin: Signer;
  let manager: Signer;
  let treasury: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let vcsaleContract: VCSaleContract;
  let vcToken: VCToken;
  let service: VCSaleServiceIntegration;
  
  // Test constants
  const PRICE_PER_VC = ethers.parseEther("0.001");
  const MIN_PURCHASE = ethers.parseEther("1");
  const MAX_PURCHASE = ethers.parseEther("1000");
  const INITIAL_VC_SUPPLY = ethers.parseEther("1000000");
  
  beforeEach(async () => {
    [owner, admin, manager, treasury, user1, user2, user3] = await ethers.getSigners();

    // Deploy VC Token
    const VCTokenFactory = await ethers.getContractFactory("VCToken");
    vcToken = await VCTokenFactory.deploy(await owner.getAddress());
    await vcToken.waitForDeployment();
    
    // Deploy VCSaleContract
    const VCSaleContractFactory = await ethers.getContractFactory("VCSaleContract");
    vcsaleContract = await upgrades.deployProxy(
      VCSaleContractFactory,
      [
        await vcToken.getAddress(),
        PRICE_PER_VC,
        MIN_PURCHASE,
        MAX_PURCHASE,
        await treasury.getAddress(),
        await admin.getAddress()
      ],
      {
        initializer: "initialize",
        kind: "uups"
      }
    ) as unknown as VCSaleContract;
    await vcsaleContract.waitForDeployment();
    
    // Setup contract
    await vcToken.mintTo(await admin.getAddress(), INITIAL_VC_SUPPLY);
    await vcToken.connect(admin).approve(await vcsaleContract.getAddress(), INITIAL_VC_SUPPLY);
    await vcsaleContract.connect(admin).depositVCTokens(INITIAL_VC_SUPPLY);
    
    const MANAGER_ROLE = await vcsaleContract.MANAGER_ROLE();
    await vcsaleContract.connect(admin).grantRole(MANAGER_ROLE, await manager.getAddress());
    await vcsaleContract.connect(manager).setSaleActive(true);

    // Initialize service
    service = new VCSaleServiceIntegration(
      await vcsaleContract.getAddress(),
      ethers.provider
    );
  });

  describe("🎭 Complete Purchase Flow", () => {
    it("Should complete full purchase flow like a real user", async () => {
      // Initialize service with user signer
      service.initialize(user1);

      // Step 1: User loads widget, gets sale data
      const saleStats = await service.getSaleStats();
      expect(saleStats.saleActive).to.be.true;
      expect(parseFloat(saleStats.currentVCBalance)).to.equal(1000000);
      expect(saleStats.pricePerVC).to.equal(PRICE_PER_VC.toString());

      // Step 2: User enters amount, gets price calculation
      const vcAmount = "10";
      const expectedBnb = await service.calculateBNBAmount(vcAmount);
      expect(expectedBnb).to.equal("0.01");

      // Step 3: Check if purchase is possible
      const userAddress = await user1.getAddress();
      const { canPurchase, reason } = await service.canPurchase(userAddress, vcAmount);
      expect(canPurchase).to.be.true;
      expect(reason).to.be.undefined;

      // Step 4: Get user's initial state
      const initialUserStats = await service.getUserStats(userAddress);
      expect(initialUserStats.purchasedVC).to.equal("0.0");
      expect(initialUserStats.spentBNB).to.equal("0.0");

      // Step 5: Execute purchase
      const result = await service.executePurchase({
        vcAmount: vcAmount,
        expectedBnbAmount: expectedBnb,
        slippageTolerance: 0.01, // 1%
      }, userAddress);

      expect(result.status).to.equal('success');
      expect(result.vcAmount).to.equal(vcAmount);

      // Step 6: Verify purchase results
      const finalUserStats = await service.getUserStats(userAddress);
      expect(finalUserStats.purchasedVC).to.equal("10.0");
      expect(parseFloat(finalUserStats.spentBNB)).to.equal(0.01);

      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(10);
      expect(parseFloat(finalSaleStats.currentVCBalance)).to.equal(999990);

      // Step 7: Verify VC tokens were transferred
      const userVCBalance = await vcToken.balanceOf(userAddress);
      expect(userVCBalance).to.equal(ethers.parseEther("10"));
    });

    it("Should handle multiple users purchasing simultaneously", async () => {
      const users = [user1, user2, user3];
      const vcAmount = "100";
      const expectedBnb = "0.1";
      const results = [];

      // All users purchase at the same time (in different blocks due to MEV protection)
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userService = new VCSaleServiceIntegration(
          await vcsaleContract.getAddress(),
          ethers.provider
        );
        userService.initialize(user);

        if (i > 0) {
          await time.increase(61); // MEV protection cooldown
        }

        const result = await userService.executePurchase({
          vcAmount: vcAmount,
          expectedBnbAmount: expectedBnb,
          slippageTolerance: 0.01,
        }, await user.getAddress());

        results.push(result);
        expect(result.status).to.equal('success');
      }

      // Verify all purchases succeeded
      expect(results.length).to.equal(3);

      // Check final state
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(300); // 3 * 100
      expect(parseFloat(finalSaleStats.currentVCBalance)).to.equal(999700);

      // Check each user got their tokens
      for (const user of users) {
        const userVCBalance = await vcToken.balanceOf(await user.getAddress());
        expect(userVCBalance).to.equal(ethers.parseEther("100"));
      }
    });

    it("Should handle purchase near limits correctly", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();

      // Purchase just under maximum (999 VC)
      const vcAmount = "999";
      const expectedBnb = await service.calculateBNBAmount(vcAmount);

      const result = await service.executePurchase({
        vcAmount: vcAmount,
        expectedBnbAmount: expectedBnb,
        slippageTolerance: 0.01,
      }, userAddress);

      expect(result.status).to.equal('success');

      // Try to purchase 2 more (should fail - above maximum)
      await time.increase(61);
      
      const { canPurchase, reason } = await service.canPurchase(userAddress, "2");
      expect(canPurchase).to.be.false;
      expect(reason).to.equal("Above maximum purchase");
    });
  });

  describe("🛡️ Security Integration", () => {
    it("Should enforce MEV protection in real scenarios", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();
      const vcAmount = "10";
      const expectedBnb = await service.calculateBNBAmount(vcAmount);

      // First purchase
      const firstResult = await service.executePurchase({
        vcAmount: vcAmount,
        expectedBnbAmount: expectedBnb,
        slippageTolerance: 0.01,
      }, userAddress);

      expect(firstResult.status).to.equal('success');

      // Immediate second purchase should fail
      const { canPurchase, reason } = await service.canPurchase(userAddress, vcAmount);
      expect(canPurchase).to.be.false;
      expect(reason).to.include("Too frequent purchases");

      // Security status should reflect rate limiting
      const securityStatus = await service.getSecurityStatus(userAddress);
      expect(securityStatus.rateLimited).to.be.true;
      expect(securityStatus.mevProtectionEnabled).to.be.true;

      // After cooldown, should work again
      await time.increase(61);

      const { canPurchase: canPurchaseAfter } = await service.canPurchase(userAddress, vcAmount);
      expect(canPurchaseAfter).to.be.true;

      const secondResult = await service.executePurchase({
        vcAmount: vcAmount,
        expectedBnbAmount: expectedBnb,
        slippageTolerance: 0.01,
      }, userAddress);

      expect(secondResult.status).to.equal('success');
    });

    it("Should handle circuit breaker activation", async () => {
      // Need to make enough purchases to trigger circuit breaker (100K VC)
      const users = [user1, user2, user3];
      const largeAmount = "1000"; // Maximum per purchase
      
      // Make 100 purchases to trigger circuit breaker
      for (let i = 0; i < 100; i++) {
        const user = users[i % users.length];
        const userService = new VCSaleServiceIntegration(
          await vcsaleContract.getAddress(),
          ethers.provider
        );
        userService.initialize(user);

        await time.increase(61); // MEV protection

        await userService.executePurchase({
          vcAmount: largeAmount,
          expectedBnbAmount: "1.0",
          slippageTolerance: 0.01,
        }, await user.getAddress());
      }

      // Circuit breaker should now be active
      const securityStatus = await service.getSecurityStatus(await user1.getAddress());
      expect(securityStatus.circuitBreakerActive).to.be.true;

      // New purchases should fail
      service.initialize(user1);
      const { canPurchase, reason } = await service.canPurchase(await user1.getAddress(), "10");
      expect(canPurchase).to.be.false;
      expect(reason).to.include("Circuit breaker");
    });

    it("Should handle blacklist functionality", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();

      // Normal purchase should work
      let { canPurchase } = await service.canPurchase(userAddress, "10");
      expect(canPurchase).to.be.true;

      // Blacklist user
              await vcsaleContract.connect(admin).blacklistUser(userAddress, "Integration test blacklist");

      // Purchase should now fail
      const securityStatus = await service.getSecurityStatus(userAddress);
      expect(securityStatus.userBlacklisted).to.be.true;

      ({ canPurchase } = await service.canPurchase(userAddress, "10"));
      expect(canPurchase).to.be.false;

      // Remove from blacklist
      await vcsaleContract.connect(manager).blacklistUser(userAddress, false);

      // Should work again
      const newSecurityStatus = await service.getSecurityStatus(userAddress);
      expect(newSecurityStatus.userBlacklisted).to.be.false;

      ({ canPurchase } = await service.canPurchase(userAddress, "10"));
      expect(canPurchase).to.be.true;
    });

    it("Should handle contract pause correctly", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();

      // Normal purchase should work
      let { canPurchase } = await service.canPurchase(userAddress, "10");
      expect(canPurchase).to.be.true;

      // Pause contract
      await vcsaleContract.connect(admin).pause();

      // Purchase should fail
      const securityStatus = await service.getSecurityStatus(userAddress);
      expect(securityStatus.contractPaused).to.be.true;

      ({ canPurchase } = await service.canPurchase(userAddress, "10"));
      expect(canPurchase).to.be.false;

      // Unpause
      await vcsaleContract.connect(admin).unpause();

      // Should work again
      const newSecurityStatus = await service.getSecurityStatus(userAddress);
      expect(newSecurityStatus.contractPaused).to.be.false;

      ({ canPurchase } = await service.canPurchase(userAddress, "10"));
      expect(canPurchase).to.be.true;
    });
  });

  describe("📊 Data Consistency", () => {
    it("Should maintain data consistency across multiple operations", async () => {
      const users = [user1, user2];
      const purchases = [
        { user: 0, amount: "50" },
        { user: 1, amount: "100" },
        { user: 0, amount: "25" },
        { user: 1, amount: "75" },
      ];

      let expectedTotalSold = 0;
      const userExpectedAmounts = [0, 0];

      for (const purchase of purchases) {
        const user = users[purchase.user];
        const userService = new VCSaleServiceIntegration(
          await vcsaleContract.getAddress(),
          ethers.provider
        );
        userService.initialize(user);

        await time.increase(61); // MEV protection

        const expectedBnb = await userService.calculateBNBAmount(purchase.amount);
        await userService.executePurchase({
          vcAmount: purchase.amount,
          expectedBnbAmount: expectedBnb,
          slippageTolerance: 0.01,
        }, await user.getAddress());

        expectedTotalSold += parseFloat(purchase.amount);
        userExpectedAmounts[purchase.user] += parseFloat(purchase.amount);

        // Check consistency after each purchase
        const saleStats = await service.getSaleStats();
        expect(parseFloat(saleStats.totalVCSold)).to.equal(expectedTotalSold);
        expect(parseFloat(saleStats.currentVCBalance)).to.equal(1000000 - expectedTotalSold);

        // Check user stats
        const userStats = await userService.getUserStats(await user.getAddress());
        expect(parseFloat(userStats.purchasedVC)).to.equal(userExpectedAmounts[purchase.user]);
      }

      // Final consistency check
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(250); // 50+100+25+75

      for (let i = 0; i < users.length; i++) {
        const userBalance = await vcToken.balanceOf(await users[i].getAddress());
        expect(userBalance).to.equal(ethers.parseEther(userExpectedAmounts[i].toString()));
      }
    });

    it("Should handle price updates correctly", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();

      // Initial price calculation
      let bnbAmount = await service.calculateBNBAmount("10");
      expect(bnbAmount).to.equal("0.01");

      // Change price (5% increase)
      await time.increase(3601); // Price update cooldown
      const newPrice = PRICE_PER_VC * 105n / 100n;
      await vcsaleContract.connect(manager).updatePrice(newPrice);

      // New calculation should reflect updated price
      bnbAmount = await service.calculateBNBAmount("10");
      expect(parseFloat(bnbAmount)).to.be.closeTo(0.0105, 0.0001);

      // Purchase at new price
      const result = await service.executePurchase({
        vcAmount: "10",
        expectedBnbAmount: bnbAmount,
        slippageTolerance: 0.01,
      }, userAddress);

      expect(result.status).to.equal('success');

      // Verify sale stats reflect new price
      const saleStats = await service.getSaleStats();
      expect(saleStats.pricePerVC).to.equal(newPrice.toString());
    });
  });

  describe("⚡ Performance Testing", () => {
    it("Should handle rapid sequential purchases efficiently", async () => {
      const users = [user1, user2, user3];
      const startTime = Date.now();
      const purchaseCount = 10;

      for (let i = 0; i < purchaseCount; i++) {
        const user = users[i % users.length];
        const userService = new VCSaleServiceIntegration(
          await vcsaleContract.getAddress(),
          ethers.provider
        );
        userService.initialize(user);

        await time.increase(61); // MEV protection

        await userService.executePurchase({
          vcAmount: "10",
          expectedBnbAmount: "0.01",
          slippageTolerance: 0.01,
        }, await user.getAddress());
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 10 purchases in reasonable time (allowing for MEV protection delays)
      console.log(`Completed ${purchaseCount} purchases in ${duration}ms`);
      
      // Verify all purchases succeeded
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(purchaseCount * 10);
    });

    it("Should maintain consistent gas costs", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();
      const gasUsages: string[] = [];

      // Make several purchases and track gas usage
      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          await time.increase(61); // MEV protection
        }

        const result = await service.executePurchase({
          vcAmount: "10",
          expectedBnbAmount: "0.01",
          slippageTolerance: 0.01,
        }, userAddress);

        gasUsages.push(result.gasUsed);
      }

      // Gas usage should be consistent (within 10% variance)
      const avgGas = gasUsages.reduce((sum, gas) => sum + parseInt(gas), 0) / gasUsages.length;
      
      for (const gas of gasUsages) {
        const variance = Math.abs(parseInt(gas) - avgGas) / avgGas;
        expect(variance).to.be.lt(0.1); // Less than 10% variance
      }

      console.log(`Average gas usage: ${avgGas.toFixed(0)}`);
    });
  });

  describe("🌐 Real-world Scenarios", () => {
    it("Should simulate a typical trading day", async () => {
      // Simulate various purchase patterns throughout a day
      const tradingPatterns = [
        { users: 1, amount: "5", interval: 300 },   // Small purchases every 5 minutes
        { users: 2, amount: "50", interval: 1800 }, // Medium purchases every 30 minutes
        { users: 1, amount: "200", interval: 3600 }, // Large purchases every hour
      ];

      const users = [user1, user2, user3];
      let totalPurchased = 0;

      for (const pattern of tradingPatterns) {
        for (let i = 0; i < pattern.users; i++) {
          const user = users[i];
          const userService = new VCSaleServiceIntegration(
            await vcsaleContract.getAddress(),
            ethers.provider
          );
          userService.initialize(user);

          await time.increase(pattern.interval);

          const expectedBnb = await userService.calculateBNBAmount(pattern.amount);
          const result = await userService.executePurchase({
            vcAmount: pattern.amount,
            expectedBnbAmount: expectedBnb,
            slippageTolerance: 0.01,
          }, await user.getAddress());

          expect(result.status).to.equal('success');
          totalPurchased += parseFloat(pattern.amount);
        }
      }

      // Verify final state
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(totalPurchased);

      // Check daily sales tracking
      expect(parseFloat(finalSaleStats.dailySalesAmount)).to.equal(totalPurchased);
    });

    it("Should handle market stress conditions", async () => {
      // Simulate high-volume trading period
      const users = [user1, user2, user3];
      const highVolumeAmount = "500"; // Large purchases

      // Multiple users trying to purchase large amounts
      const promises = users.map(async (user, index) => {
        const userService = new VCSaleServiceIntegration(
          await vcsaleContract.getAddress(),
          ethers.provider
        );
        userService.initialize(user);

        // Stagger the purchases slightly
        await time.increase(61 + index * 10);

        return userService.executePurchase({
          vcAmount: highVolumeAmount,
          expectedBnbAmount: "0.5",
          slippageTolerance: 0.01,
        }, await user.getAddress());
      });

      const results = await Promise.all(promises);

      // All purchases should succeed
      for (const result of results) {
        expect(result.status).to.equal('success');
      }

      // Verify total sales
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.totalVCSold)).to.equal(1500); // 3 * 500
    });

    it("Should handle edge case: contract running out of tokens", async () => {
      service.initialize(user1);
      const userAddress = await user1.getAddress();

      // Get current contract balance
      const saleStats = await service.getSaleStats();
      const availableTokens = parseFloat(saleStats.currentVCBalance);

      // Try to purchase more than available (should fail)
      const excessiveAmount = (availableTokens + 1).toString();
      const { canPurchase, reason } = await service.canPurchase(userAddress, excessiveAmount);
      
      expect(canPurchase).to.be.false;
      expect(reason).to.include("Insufficient VC available");

      // Purchase exact remaining amount (should succeed)
      const exactAmount = availableTokens.toString();
      const { canPurchase: canPurchaseExact } = await service.canPurchase(userAddress, exactAmount);
      expect(canPurchaseExact).to.be.true;

      const expectedBnb = await service.calculateBNBAmount(exactAmount);
      const result = await service.executePurchase({
        vcAmount: exactAmount,
        expectedBnbAmount: expectedBnb,
        slippageTolerance: 0.01,
      }, userAddress);

      expect(result.status).to.equal('success');

      // Contract should now be empty
      const finalSaleStats = await service.getSaleStats();
      expect(parseFloat(finalSaleStats.currentVCBalance)).to.equal(0);
    });
  });
}); 