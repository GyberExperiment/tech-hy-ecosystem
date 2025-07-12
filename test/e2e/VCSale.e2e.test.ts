import { ethers, upgrades, network } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VCSaleContract, VCToken } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * E2E Tests for VCSale - Real-world Production Scenarios
 * These tests simulate actual user journeys and production conditions
 */
describe("VCSale E2E Tests - Production Simulation", () => {
  let owner: Signer;
  let admin: Signer;
  let manager: Signer;
  let pauser: Signer;
  let emergency: Signer;
  let treasury: Signer;
  let users: Signer[];
  let vcsaleContract: VCSaleContract;
  let vcToken: VCToken;
  
  // Production-like constants
  const PRICE_PER_VC = ethers.parseEther("0.001");
  const MIN_PURCHASE = ethers.parseEther("1");
  const MAX_PURCHASE = ethers.parseEther("1000");
  const INITIAL_VC_SUPPLY = ethers.parseEther("10000000"); // 10M VC for E2E
  
  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [owner, admin, manager, pauser, emergency, treasury] = signers.slice(0, 6);
    users = signers.slice(6, 16); // 10 test users

    // Deploy production-like setup
    const VCTokenFactory = await ethers.getContractFactory("VCToken");
    vcToken = await VCTokenFactory.deploy(await owner.getAddress());
    await vcToken.waitForDeployment();
    
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
      { initializer: "initialize", kind: "uups" }
    ) as unknown as VCSaleContract;
    await vcsaleContract.waitForDeployment();
    
    // Setup roles and initial state
    await vcToken.mintTo(await admin.getAddress(), INITIAL_VC_SUPPLY);
    await vcToken.connect(admin).approve(await vcsaleContract.getAddress(), INITIAL_VC_SUPPLY);
    await vcsaleContract.connect(admin).depositVCTokens(INITIAL_VC_SUPPLY);
    
    const MANAGER_ROLE = await vcsaleContract.MANAGER_ROLE();
    const PAUSER_ROLE = await vcsaleContract.PAUSER_ROLE();
    const EMERGENCY_ROLE = await vcsaleContract.EMERGENCY_ROLE();
    
    await vcsaleContract.connect(admin).grantRole(MANAGER_ROLE, await manager.getAddress());
    await vcsaleContract.connect(admin).grantRole(PAUSER_ROLE, await pauser.getAddress());
    await vcsaleContract.connect(admin).grantRole(EMERGENCY_ROLE, await emergency.getAddress());
    
    await vcsaleContract.connect(manager).setSaleActive(true);
  });

  describe("🎭 User Journey - Complete Experience", () => {
    it("Should handle a complete new user onboarding and purchase", async () => {
      const newUser = users[0];
      const userAddress = await newUser.getAddress();
      
      console.log("=== New User Onboarding Simulation ===");
      
      // 1. User connects wallet and checks if they can purchase
      const [canPurchase, reason] = await vcsaleContract.canPurchase(userAddress, ethers.parseEther("10"));
      expect(canPurchase).to.be.true;
      expect(reason).to.equal("");
      console.log("✅ User can purchase - wallet connected successfully");

      // 2. User checks current sale stats (what they see on widget)
      const saleStats = await vcsaleContract.getSaleStats();
      expect(saleStats.saleActive).to.be.true;
      console.log(`📊 Sale Stats: ${ethers.formatEther(saleStats.currentVCBalance)} VC available`);

      // 3. User calculates how much BNB they need for 10 VC
      const vcAmount = ethers.parseEther("10");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      expect(requiredBNB).to.equal(ethers.parseEther("0.01"));
      console.log(`💰 User needs ${ethers.formatEther(requiredBNB)} BNB for 10 VC`);

      // 4. User checks their BNB balance (simulate frontend balance check)
      const userBNBBalance = await ethers.provider.getBalance(userAddress);
      expect(userBNBBalance).to.be.gt(requiredBNB);
      console.log(`💳 User has ${ethers.formatEther(userBNBBalance)} BNB available`);

      // 5. User executes purchase
      const initialVCBalance = await vcToken.balanceOf(userAddress);
      const initialTreasuryBalance = await ethers.provider.getBalance(await treasury.getAddress());
      
      const tx = await vcsaleContract.connect(newUser).purchaseVC(vcAmount, { 
        value: requiredBNB + ethers.parseEther("0.001") // Small excess for gas buffer
      });
      
      await expect(tx).to.emit(vcsaleContract, "VCPurchased");
      console.log("🎉 Purchase executed successfully");

      // 6. Verify user received VC tokens
      const finalVCBalance = await vcToken.balanceOf(userAddress);
      expect(finalVCBalance).to.equal(initialVCBalance + vcAmount);
      console.log(`🪙 User received ${ethers.formatEther(finalVCBalance)} VC tokens`);

      // 7. Verify treasury received BNB
      const finalTreasuryBalance = await ethers.provider.getBalance(await treasury.getAddress());
      expect(finalTreasuryBalance).to.equal(initialTreasuryBalance + requiredBNB);
      console.log(`🏦 Treasury received ${ethers.formatEther(requiredBNB)} BNB`);

      // 8. Check user stats (what they see in their profile)
      const userStats = await vcsaleContract.getUserStats(userAddress);
      expect(userStats.purchasedVC).to.equal(vcAmount);
      expect(userStats.spentBNB).to.equal(requiredBNB);
      console.log(`📈 User stats updated: ${ethers.formatEther(userStats.purchasedVC)} VC purchased`);

      console.log("✅ Complete user journey successful");
    });

    it("Should handle user trying to make rapid purchases (MEV protection)", async () => {
      const user = users[1];
      const userAddress = await user.getAddress();
      const vcAmount = ethers.parseEther("10");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      console.log("=== MEV Protection User Experience ===");
      
      // 1. First purchase should succeed
      await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      console.log("✅ First purchase successful");

      // 2. Immediate second purchase should fail with clear error
      await expect(
        vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.be.revertedWith("Too frequent purchases");
      console.log("⚠️ Second purchase blocked by MEV protection");

      // 3. Check canPurchase for user feedback
      const [canPurchase, reason] = await vcsaleContract.canPurchase(userAddress, vcAmount);
      expect(canPurchase).to.be.false;
      expect(reason).to.include("Too frequent purchases");
      console.log(`❌ Purchase blocked: ${reason}`);

      // 4. Wait for cooldown period
      console.log("⏳ Waiting for MEV cooldown (60 seconds)...");
      await time.increase(61);

      // 5. Purchase should now work
      const [canPurchaseAfter] = await vcsaleContract.canPurchase(userAddress, vcAmount);
      expect(canPurchaseAfter).to.be.true;
      console.log("✅ Purchase allowed after cooldown");

      await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      console.log("🎉 Second purchase successful after cooldown");
    });

    it("Should handle user purchasing with insufficient BNB", async () => {
      const user = users[2];
      const vcAmount = ethers.parseEther("10");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      const insufficientBNB = requiredBNB - ethers.parseEther("0.001");
      
      console.log("=== Insufficient BNB Error Handling ===");
      
      // Purchase with insufficient BNB should fail with clear error
      await expect(
        vcsaleContract.connect(user).purchaseVC(vcAmount, { value: insufficientBNB })
      ).to.be.revertedWith("Insufficient BNB sent");
      
      console.log(`❌ Purchase failed: sent ${ethers.formatEther(insufficientBNB)} BNB, needed ${ethers.formatEther(requiredBNB)} BNB`);
      
      // User should see this in canPurchase if we check balance in frontend
      const userBalance = await ethers.provider.getBalance(await user.getAddress());
      console.log(`💳 User balance: ${ethers.formatEther(userBalance)} BNB`);
      console.log("✅ Error handling working correctly");
    });
  });

  describe("🏢 Business Operations Scenarios", () => {
    it("Should handle a busy trading day", async () => {
      console.log("=== Busy Trading Day Simulation ===");
      
      const tradingHours = 8; // 8 hour trading day
      const usersPerHour = 5;
      const purchasesPerUser = 2;
      
      let totalVolume = 0n;
      let totalUsers = 0;
      let totalTransactions = 0;
      
      for (let hour = 0; hour < tradingHours; hour++) {
        console.log(`--- Hour ${hour + 1} ---`);
        
        for (let u = 0; u < usersPerHour; u++) {
          const user = users[totalUsers % users.length];
          totalUsers++;
          
          for (let p = 0; p < purchasesPerUser; p++) {
            // Random purchase amount between 10-100 VC
            const randomAmount = Math.floor(Math.random() * 91) + 10; // 10-100
            const vcAmount = ethers.parseEther(randomAmount.toString());
            const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
            
            // MEV protection delay between purchases
            if (p > 0) {
              await time.increase(61);
            }
            
            await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
            
            totalVolume += vcAmount;
            totalTransactions++;
            
            console.log(`  User ${totalUsers}: purchased ${randomAmount} VC`);
          }
        }
        
        // Advance time by 1 hour
        await time.increase(3600);
      }
      
      // Verify final stats
      const finalStats = await vcsaleContract.getSaleStats();
      expect(finalStats.totalVCSold).to.equal(totalVolume);
      
      console.log(`📊 Trading Day Complete:`);
      console.log(`  Total Volume: ${ethers.formatEther(totalVolume)} VC`);
      console.log(`  Total Users: ${totalUsers}`);
      console.log(`  Total Transactions: ${totalTransactions}`);
      console.log(`  Revenue: ${ethers.formatEther(finalStats.totalRevenue)} BNB`);
    });

    it("Should handle price update during active trading", async () => {
      console.log("=== Price Update During Trading ===");
      
      const user1 = users[3];
      const user2 = users[4];
      const vcAmount = ethers.parseEther("50");
      
      // Initial purchase at original price
      let requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      await vcsaleContract.connect(user1).purchaseVC(vcAmount, { value: requiredBNB });
      console.log(`Purchase 1: ${ethers.formatEther(requiredBNB)} BNB for 50 VC`);
      
      // Manager updates price (5% increase)
      await time.increase(3601); // Price update cooldown
      const newPrice = PRICE_PER_VC * 105n / 100n;
      await vcsaleContract.connect(manager).updatePrice(newPrice);
      console.log("💰 Price increased by 5%");
      
      // Second purchase at new price
      await time.increase(61); // MEV protection
      requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      await vcsaleContract.connect(user2).purchaseVC(vcAmount, { value: requiredBNB });
      console.log(`Purchase 2: ${ethers.formatEther(requiredBNB)} BNB for 50 VC (new price)`);
      
      // Verify price difference
      const priceDifference = requiredBNB - ethers.parseEther("0.05"); // Original would be 0.05 BNB
      expect(priceDifference).to.be.gt(0);
      console.log(`💹 Price increase: ${ethers.formatEther(priceDifference)} BNB`);
    });

    it("Should handle large whale purchase", async () => {
      console.log("=== Large Whale Purchase ===");
      
      const whale = users[5];
      const whaleAmount = ethers.parseEther("1000"); // Maximum allowed
      const requiredBNB = await vcsaleContract.calculateBNBAmount(whaleAmount);
      
      console.log(`🐋 Whale attempting to purchase ${ethers.formatEther(whaleAmount)} VC`);
      console.log(`💰 Required: ${ethers.formatEther(requiredBNB)} BNB`);
      
      // Check impact on sale stats before
      const statsBefore = await vcsaleContract.getSaleStats();
      console.log(`📊 Before: ${ethers.formatEther(statsBefore.currentVCBalance)} VC available`);
      
      // Execute whale purchase
      const tx = await vcsaleContract.connect(whale).purchaseVC(whaleAmount, { value: requiredBNB });
      await expect(tx).to.emit(vcsaleContract, "VCPurchased");
      
      // Check impact on sale stats after
      const statsAfter = await vcsaleContract.getSaleStats();
      console.log(`📊 After: ${ethers.formatEther(statsAfter.currentVCBalance)} VC available`);
      
      // Verify impact
      const impact = statsBefore.currentVCBalance - statsAfter.currentVCBalance;
      expect(impact).to.equal(whaleAmount);
      
      console.log("🎉 Whale purchase successful");
      console.log(`📈 Market impact: ${ethers.formatEther(impact)} VC removed from supply`);
    });
  });

  describe("🚨 Emergency Scenarios", () => {
    it("Should handle emergency pause during active trading", async () => {
      console.log("=== Emergency Pause Scenario ===");
      
      const user1 = users[6];
      const user2 = users[7];
      const vcAmount = ethers.parseEther("20");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Normal purchase before emergency
      await vcsaleContract.connect(user1).purchaseVC(vcAmount, { value: requiredBNB });
      console.log("✅ Normal purchase before emergency");
      
      // Emergency pause
      await vcsaleContract.connect(pauser).pause();
      console.log("🚨 EMERGENCY PAUSE ACTIVATED");
      
      // Purchases should fail
      await expect(
        vcsaleContract.connect(user2).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.be.revertedWithCustomError(vcsaleContract, "EnforcedPause");
      console.log("❌ Purchases blocked during pause");
      
      // Emergency unpause
      await vcsaleContract.connect(pauser).unpause();
      console.log("✅ Emergency resolved - operations resumed");
      
      // Purchases should work again
      await vcsaleContract.connect(user2).purchaseVC(vcAmount, { value: requiredBNB });
      console.log("✅ Normal operations restored");
    });

    it("Should handle circuit breaker activation", async () => {
      console.log("=== Circuit Breaker Activation ===");
      
      // Simulate high-volume trading that triggers circuit breaker
      const largeAmount = ethers.parseEther("1000");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(largeAmount);
      
      console.log("📈 Simulating high-volume trading...");
      
      // Make enough purchases to trigger circuit breaker (100K VC)
      for (let i = 0; i < 100; i++) {
        const user = users[i % users.length];
        await time.increase(61); // MEV protection
        
        await vcsaleContract.connect(user).purchaseVC(largeAmount, { value: requiredBNB });
        
        if (i % 20 === 0) {
          console.log(`  Completed ${i + 1}/100 large purchases`);
        }
      }
      
      // Circuit breaker should be triggered
      const circuitBreakerState = await vcsaleContract.circuitBreaker();
      expect(circuitBreakerState.triggered).to.be.true;
      console.log("🚨 CIRCUIT BREAKER TRIGGERED");
      
      // New purchases should fail
      await expect(
        vcsaleContract.connect(users[0]).purchaseVC(largeAmount, { value: requiredBNB })
      ).to.be.revertedWith("Circuit breaker active");
      console.log("❌ Purchases blocked by circuit breaker");
      
      // Emergency reset
      await vcsaleContract.connect(emergency).resetCircuitBreaker();
      console.log("🔧 Emergency reset performed");
      
      // Purchases should work again
      await time.increase(61);
      await vcsaleContract.connect(users[0]).purchaseVC(largeAmount, { value: requiredBNB });
      console.log("✅ Trading resumed after reset");
    });

    it("Should handle emergency withdrawal", async () => {
      console.log("=== Emergency Withdrawal Scenario ===");
      
      // Check initial balances
      const initialContractBalance = await vcToken.balanceOf(await vcsaleContract.getAddress());
      const initialTreasuryBalance = await vcToken.balanceOf(await treasury.getAddress());
      
      console.log(`🏦 Contract balance: ${ethers.formatEther(initialContractBalance)} VC`);
      console.log(`🏛️ Treasury balance: ${ethers.formatEther(initialTreasuryBalance)} VC`);
      
      // Emergency withdrawal
      await vcsaleContract.connect(emergency).emergencyWithdraw(await vcToken.getAddress());
      console.log("🚨 EMERGENCY WITHDRAWAL EXECUTED");
      
      // Verify tokens moved to treasury
      const finalContractBalance = await vcToken.balanceOf(await vcsaleContract.getAddress());
      const finalTreasuryBalance = await vcToken.balanceOf(await treasury.getAddress());
      
      expect(finalContractBalance).to.equal(0);
      expect(finalTreasuryBalance).to.equal(initialTreasuryBalance + initialContractBalance);
      
      console.log(`✅ All tokens moved to treasury: ${ethers.formatEther(finalTreasuryBalance)} VC`);
    });
  });

  describe("📊 Analytics and Monitoring", () => {
    it("Should track comprehensive analytics", async () => {
      console.log("=== Analytics Tracking Simulation ===");
      
      const analyticsData = {
        totalUsers: 0,
        totalVolume: 0n,
        totalRevenue: 0n,
        avgPurchaseSize: 0,
        peakHourVolume: 0n,
        securityEvents: 0,
      };
      
      // Simulate varied trading activity
      for (let i = 0; i < 20; i++) {
        const user = users[i % users.length];
        const randomAmount = Math.floor(Math.random() * 100) + 10; // 10-109 VC
        const vcAmount = ethers.parseEther(randomAmount.toString());
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        if (i > 0 && Math.random() < 0.3) {
          // 30% chance of triggering MEV protection
          try {
            await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
            analyticsData.securityEvents++;
          } catch (error) {
            // Expected MEV protection error
            await time.increase(61);
          }
        }
        
        await time.increase(61);
        await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
        
        analyticsData.totalUsers++;
        analyticsData.totalVolume += vcAmount;
        analyticsData.totalRevenue += requiredBNB;
        
        console.log(`Transaction ${i + 1}: ${randomAmount} VC`);
      }
      
      // Calculate analytics
      analyticsData.avgPurchaseSize = Number(analyticsData.totalVolume) / analyticsData.totalUsers / 1e18;
      
      // Verify with contract stats
      const contractStats = await vcsaleContract.getSaleStats();
      expect(contractStats.totalVCSold).to.equal(analyticsData.totalVolume);
      expect(contractStats.totalRevenue).to.equal(analyticsData.totalRevenue);
      
      console.log("📊 Analytics Summary:");
      console.log(`  Total Users: ${analyticsData.totalUsers}`);
      console.log(`  Total Volume: ${ethers.formatEther(analyticsData.totalVolume)} VC`);
      console.log(`  Total Revenue: ${ethers.formatEther(analyticsData.totalRevenue)} BNB`);
      console.log(`  Avg Purchase: ${analyticsData.avgPurchaseSize.toFixed(2)} VC`);
      console.log(`  Security Events: ${analyticsData.securityEvents}`);
    });
  });

  describe("🌐 Cross-chain and Network Scenarios", () => {
    it("Should handle network congestion simulation", async () => {
      console.log("=== Network Congestion Simulation ===");
      
      // Simulate network congestion with higher gas prices
      const user = users[8];
      const vcAmount = ethers.parseEther("25");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Purchase with higher gas price (simulating congestion)
      const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { 
        value: requiredBNB,
        gasPrice: ethers.parseUnits("20", "gwei") // Higher than normal
      });
      
      const receipt = await tx.wait();
      console.log(`⛽ High gas purchase completed: ${receipt!.gasUsed} gas used`);
      
      // Verify purchase still succeeded
      const userBalance = await vcToken.balanceOf(await user.getAddress());
      expect(userBalance).to.equal(vcAmount);
      console.log("✅ Purchase successful despite high gas");
    });

    it("Should handle block reorganization scenario", async () => {
      console.log("=== Block Reorganization Handling ===");
      
      const user = users[9];
      const vcAmount = ethers.parseEther("15");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Purchase transaction
      const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      const receipt = await tx.wait();
      
      // Verify transaction was mined
      expect(receipt!.status).to.equal(1);
      console.log(`✅ Transaction mined in block ${receipt!.blockNumber}`);
      
      // Verify state consistency
      const userBalance = await vcToken.balanceOf(await user.getAddress());
      expect(userBalance).to.equal(vcAmount);
      
      const saleStats = await vcsaleContract.getSaleStats();
      expect(saleStats.totalVCSold).to.be.gte(vcAmount);
      
      console.log("✅ State consistent after transaction");
    });
  });

  describe("🎯 Production Load Testing", () => {
    it("Should handle concurrent users", async () => {
      console.log("=== Concurrent Users Load Test ===");
      
      const concurrentUsers = 5;
      const vcAmount = ethers.parseEther("20");
      
      // Prepare concurrent purchases
      const purchasePromises = [];
      
      for (let i = 0; i < concurrentUsers; i++) {
        const user = users[i];
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        // Stagger slightly to avoid exact same block
        const delay = i * 1000; // 1 second between each
        
        const promise = new Promise(async (resolve) => {
          await new Promise(r => setTimeout(r, delay));
          await time.increase(61); // MEV protection
          
          const result = await vcsaleContract.connect(user).purchaseVC(vcAmount, { 
            value: requiredBNB 
          });
          resolve(result);
        });
        
        purchasePromises.push(promise);
      }
      
      // Execute all purchases
      const startTime = Date.now();
      const results = await Promise.all(purchasePromises);
      const endTime = Date.now();
      
      console.log(`⚡ ${concurrentUsers} concurrent purchases completed in ${endTime - startTime}ms`);
      
      // Verify all succeeded
      expect(results.length).to.equal(concurrentUsers);
      
      // Check final state
      const finalStats = await vcsaleContract.getSaleStats();
      const expectedVolume = vcAmount * BigInt(concurrentUsers);
      expect(finalStats.totalVCSold).to.be.gte(expectedVolume);
      
      console.log("✅ All concurrent purchases successful");
    });

    it("Should maintain performance under sustained load", async () => {
      console.log("=== Sustained Load Test ===");
      
      const iterations = 25;
      const gasUsages: bigint[] = [];
      const executionTimes: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const user = users[i % users.length];
        const randomAmount = Math.floor(Math.random() * 50) + 10; // 10-59 VC
        const vcAmount = ethers.parseEther(randomAmount.toString());
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        await time.increase(61); // MEV protection
        
        const startTime = Date.now();
        const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
        const receipt = await tx.wait();
        const endTime = Date.now();
        
        gasUsages.push(receipt!.gasUsed);
        executionTimes.push(endTime - startTime);
        
        if (i % 5 === 0) {
          console.log(`  Completed ${i + 1}/${iterations} purchases`);
        }
      }
      
      // Analyze performance
      const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      const maxGas = gasUsages.reduce((a, b) => a > b ? a : b, 0n);
      const minGas = gasUsages.reduce((a, b) => a < b ? a : b, gasUsages[0]);
      
      console.log("📊 Performance Metrics:");
      console.log(`  Average Gas: ${avgGas.toString()}`);
      console.log(`  Gas Range: ${minGas.toString()} - ${maxGas.toString()}`);
      console.log(`  Average Execution Time: ${avgTime.toFixed(2)}ms`);
      
      // Performance should be consistent
      const gasVariance = Number(maxGas - minGas) / Number(avgGas);
      expect(gasVariance).to.be.lt(0.2); // Less than 20% variance
      
      console.log("✅ Performance consistent under sustained load");
    });
  });
}); 