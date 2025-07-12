import { ethers, upgrades, network } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VCSaleContract, VCToken } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Security Stress Tests for VCSale Contract
 * These tests focus on breaking security mechanisms and attack vectors
 */
describe("VCSale Security Stress Tests", () => {
  let owner: Signer;
  let admin: Signer;
  let manager: Signer;
  let pauser: Signer;
  let emergency: Signer;
  let treasury: Signer;
  let attackers: Signer[];
  let legitimateUsers: Signer[];
  let vcsaleContract: VCSaleContract;
  let vcToken: VCToken;
  
  const PRICE_PER_VC = ethers.parseEther("0.001");
  const MIN_PURCHASE = ethers.parseEther("1");
  const MAX_PURCHASE = ethers.parseEther("1000");
  const INITIAL_VC_SUPPLY = ethers.parseEther("100000000"); // 100M VC for stress testing
  
  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [owner, admin, manager, pauser, emergency, treasury] = signers.slice(0, 6);
    attackers = signers.slice(6, 16); // 10 attackers
    legitimateUsers = signers.slice(16, 20); // 4 legitimate users

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
    
    // Deposit a reasonable amount for testing (not the entire supply)
    const testSupply = ethers.parseEther("1000000"); // 1M VC for testing
    await vcToken.mintTo(await admin.getAddress(), testSupply);
    await vcToken.connect(admin).approve(await vcsaleContract.getAddress(), testSupply);
    await vcsaleContract.connect(admin).depositVCTokens(testSupply);
    
    const MANAGER_ROLE = await vcsaleContract.MANAGER_ROLE();
    const PAUSER_ROLE = await vcsaleContract.PAUSER_ROLE();
    const EMERGENCY_ROLE = await vcsaleContract.EMERGENCY_ROLE();
    
    await vcsaleContract.connect(admin).grantRole(MANAGER_ROLE, await manager.getAddress());
    await vcsaleContract.connect(admin).grantRole(PAUSER_ROLE, await pauser.getAddress());
    await vcsaleContract.connect(admin).grantRole(EMERGENCY_ROLE, await emergency.getAddress());
    
    await vcsaleContract.connect(manager).setSaleActive(true);
  });

  describe("🔥 MEV Protection Stress Tests", () => {
    it("Should withstand coordinated rapid-fire attacks", async () => {
      console.log("=== Coordinated Rapid-Fire Attack ===");
      
      const vcAmount = ethers.parseEther("100");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Each attacker tries to make rapid purchases
      const attackPromises = attackers.map(async (attacker, index) => {
        const attempts = [];
        
        // First purchase should succeed
        const firstTx = await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
        attempts.push({ success: true, tx: firstTx });
        
        // Rapid subsequent attempts should fail
        for (let i = 0; i < 10; i++) {
          try {
            const tx = await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
            attempts.push({ success: true, tx });
          } catch (error: any) {
            attempts.push({ success: false, error: error.message });
          }
        }
        
        return { attacker: index, attempts };
      });
      
      const results = await Promise.all(attackPromises);
      
      // Analyze results
      let totalSuccessfulAttacks = 0;
      let totalAttempts = 0;
      
      for (const result of results) {
        const successfulAttacks = result.attempts.filter(a => a.success).length;
        totalSuccessfulAttacks += successfulAttacks;
        totalAttempts += result.attempts.length;
        
        // Each attacker should only succeed once (first purchase)
        expect(successfulAttacks).to.equal(1);
        console.log(`Attacker ${result.attacker}: ${successfulAttacks}/${result.attempts.length} successful`);
      }
      
      console.log(`Total: ${totalSuccessfulAttacks}/${totalAttempts} successful attacks`);
      console.log("✅ MEV protection successfully blocked rapid-fire attacks");
    });

    it("Should prevent sandwich attacks through timing manipulation", async () => {
      console.log("=== Sandwich Attack Prevention ===");
      
      const legitimateUser = legitimateUsers[0];
      const frontRunner = attackers[0];
      const backRunner = attackers[1];
      
      const vcAmount = ethers.parseEther("200");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Simulate legitimate user transaction in mempool
      console.log("Legitimate user initiates purchase...");
      
      // Front-runner tries to jump ahead
      console.log("Front-runner attempts to sandwich...");
      await vcsaleContract.connect(frontRunner).purchaseVC(vcAmount, { value: requiredBNB });
      
      // Legitimate user transaction (should be blocked by MEV protection if same user)
      // But different users should work
      await time.increase(61);
      await vcsaleContract.connect(legitimateUser).purchaseVC(vcAmount, { value: requiredBNB });
      
      // Back-runner tries to follow
      console.log("Back-runner attempts second part of sandwich...");
      await expect(
        vcsaleContract.connect(frontRunner).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.be.revertedWith("Too frequent purchases");
      
      console.log("✅ Sandwich attack prevented by MEV protection");
    });

    it("Should handle MEV protection bypass attempts", async () => {
      console.log("=== MEV Protection Bypass Attempts ===");
      
      const attacker = attackers[2];
      const vcAmount = ethers.parseEther("50");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // First purchase
      await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
      
      // Try various bypass techniques
      const bypassAttempts = [
        {
          name: "Immediate retry",
          action: () => vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB })
        },
        {
          name: "Different amount",
          action: () => vcsaleContract.connect(attacker).purchaseVC(ethers.parseEther("25"), { value: ethers.parseEther("0.025") })
        },
        {
          name: "Excess BNB",
          action: () => vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB * 2n })
        },
      ];
      
      for (const attempt of bypassAttempts) {
        console.log(`Attempting bypass: ${attempt.name}`);
        
        await expect(attempt.action()).to.be.revertedWith("Too frequent purchases");
        console.log(`  ❌ ${attempt.name} blocked`);
      }
      
      console.log("✅ All bypass attempts failed");
    });

    it("Should handle time manipulation attacks", async () => {
      console.log("=== Time Manipulation Attack Resistance ===");
      
      const attacker = attackers[3];
      const vcAmount = ethers.parseEther("75");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // First purchase
      await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
      
      // Try to manipulate time (this should not work in real blockchain)
      // But we test the contract's robustness
      
      // Advance time by 59 seconds (just under cooldown)
      await time.increase(59);
      
      await expect(
        vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.be.revertedWith("Too frequent purchases");
      console.log("❌ Purchase blocked at 59 seconds");
      
      // Advance time by 2 more seconds (61 total)
      await time.increase(2);
      
      await expect(
        vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.not.be.reverted;
      console.log("✅ Purchase allowed at 61 seconds");
      
      console.log("✅ Time manipulation resistance confirmed");
    });
  });

  describe("⚡ Circuit Breaker Stress Tests", () => {
    it("Should trigger under massive coordinated attack", async () => {
      console.log("=== Massive Coordinated Attack ===");
      
      const attackAmount = ethers.parseEther("1000"); // Maximum per transaction
      const requiredBNB = await vcsaleContract.calculateBNBAmount(attackAmount);
      
      console.log("Simulating massive buying pressure...");
      
      // Coordinate massive attack to trigger circuit breaker
      let purchaseCount = 0;
      let circuitBreakerTriggered = false;
      
      // Need 100 purchases of 1000 VC each to hit 100K threshold
      while (purchaseCount < 100 && !circuitBreakerTriggered) {
        const attacker = attackers[purchaseCount % attackers.length];
        
        try {
          await time.increase(61); // MEV protection
          await vcsaleContract.connect(attacker).purchaseVC(attackAmount, { value: requiredBNB });
          purchaseCount++;
          
          if (purchaseCount % 20 === 0) {
            console.log(`  ${purchaseCount}/100 attacks completed`);
          }
        } catch (error: any) {
          if (error.message.includes("Circuit breaker")) {
            circuitBreakerTriggered = true;
            console.log(`🚨 Circuit breaker triggered after ${purchaseCount} purchases`);
          } else {
            throw error;
          }
        }
      }
      
      // Verify circuit breaker state
      const circuitBreakerState = await vcsaleContract.circuitBreaker();
      expect(circuitBreakerState.triggered).to.be.true;
      
      // All subsequent purchases should fail
      for (let i = 0; i < 5; i++) {
        const attacker = attackers[i];
        await time.increase(61);
        
        await expect(
          vcsaleContract.connect(attacker).purchaseVC(attackAmount, { value: requiredBNB })
        ).to.be.revertedWith("Circuit breaker active");
      }
      
      console.log("✅ Circuit breaker successfully stopped massive attack");
    });

    it("Should resist circuit breaker reset attacks", async () => {
      console.log("=== Circuit Breaker Reset Attack ===");
      
      // First trigger circuit breaker
      const largeAmount = ethers.parseEther("1000");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(largeAmount);
      
      // Make enough purchases to trigger circuit breaker
      for (let i = 0; i < 100; i++) {
        const attacker = attackers[i % attackers.length];
        await time.increase(61);
        await vcsaleContract.connect(attacker).purchaseVC(largeAmount, { value: requiredBNB });
      }
      
      // Verify circuit breaker is triggered
      let state = await vcsaleContract.circuitBreaker();
      expect(state.triggered).to.be.true;
      console.log("Circuit breaker triggered");
      
      // Attackers try to reset circuit breaker (should fail)
      for (const attacker of attackers.slice(0, 5)) {
        await expect(
          vcsaleContract.connect(attacker).resetCircuitBreaker()
        ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      }
      console.log("❌ Unauthorized reset attempts blocked");
      
      // Only emergency role should be able to reset
      await vcsaleContract.connect(emergency).resetCircuitBreaker();
      
      state = await vcsaleContract.circuitBreaker();
      expect(state.triggered).to.be.false;
      console.log("✅ Authorized reset successful");
    });

    it("Should handle circuit breaker window edge cases", async () => {
      console.log("=== Circuit Breaker Window Edge Cases ===");
      
      const largeAmount = ethers.parseEther("1000");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(largeAmount);
      
      // Make purchases approaching threshold
      for (let i = 0; i < 99; i++) {
        const attacker = attackers[i % attackers.length];
        await time.increase(61);
        await vcsaleContract.connect(attacker).purchaseVC(largeAmount, { value: requiredBNB });
      }
      
      // Check we're at 99K VC (just under threshold)
      let state = await vcsaleContract.circuitBreaker();
      expect(state.salesInWindow).to.equal(ethers.parseEther("99000"));
      expect(state.triggered).to.be.false;
      console.log("At 99K VC - circuit breaker not triggered yet");
      
      // Wait for window to almost expire
      await time.increase(3599); // 1 hour - 1 second
      
      // One more purchase should still trigger circuit breaker
      await vcsaleContract.connect(attackers[0]).purchaseVC(largeAmount, { value: requiredBNB });
      
      state = await vcsaleContract.circuitBreaker();
      expect(state.triggered).to.be.true;
      console.log("✅ Circuit breaker triggered even at window edge");
      
      // Reset for next test
      await vcsaleContract.connect(emergency).resetCircuitBreaker();
      
      // Make one purchase after window reset
      await time.increase(2); // Now past window
      await vcsaleContract.connect(attackers[1]).purchaseVC(largeAmount, { value: requiredBNB });
      
      // Window should have reset, only 1K VC in new window
      state = await vcsaleContract.circuitBreaker();
      expect(state.salesInWindow).to.equal(largeAmount);
      expect(state.triggered).to.be.false;
      console.log("✅ Window reset correctly");
    });
  });

  describe("🚫 Access Control Attack Tests", () => {
    it("Should resist privilege escalation attacks", async () => {
      console.log("=== Privilege Escalation Attack ===");
      
      const attacker = attackers[4];
      const attackerAddress = await attacker.getAddress();
      
      // Try to grant themselves roles
      const roles = [
        await vcsaleContract.ADMIN_ROLE(),
        await vcsaleContract.MANAGER_ROLE(),
        await vcsaleContract.PAUSER_ROLE(),
        await vcsaleContract.EMERGENCY_ROLE(),
      ];
      
      for (const role of roles) {
        await expect(
          vcsaleContract.connect(attacker).grantRole(role, attackerAddress)
        ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      }
      console.log("❌ Role self-assignment blocked");
      
      // Try to perform privileged operations
      const privilegedOperations = [
        {
          name: "setSaleActive",
          action: async () => vcsaleContract.connect(attacker).setSaleActive(false)
        },
        {
          name: "updatePrice", 
          action: async () => vcsaleContract.connect(attacker).updatePrice(ethers.parseEther("0.002"))
        },
        {
          name: "blacklistUser",
          action: async () => vcsaleContract.connect(attacker).blacklistUser(await legitimateUsers[0].getAddress(), "Attack test")
        },
        {
          name: "emergencyPause",
          action: async () => vcsaleContract.connect(attacker).emergencyPause()
        },
        {
          name: "resetCircuitBreaker",
          action: async () => vcsaleContract.connect(attacker).resetCircuitBreaker()
        },
      ];
      
      for (const operation of privilegedOperations) {
        await expect(await operation.action()).to.be.revertedWithCustomError(
          vcsaleContract, 
          "AccessControlUnauthorizedAccount"
        );
        console.log(`❌ ${operation.name} blocked`);
      }
      
      console.log("✅ All privilege escalation attempts failed");
    });

    it("Should handle role admin attacks", async () => {
      console.log("=== Role Admin Attack ===");
      
      const attacker = attackers[5];
      const attackerAddress = await attacker.getAddress();
      
      // Admin grants attacker a role
      const MANAGER_ROLE = await vcsaleContract.MANAGER_ROLE();
      await vcsaleContract.connect(admin).grantRole(MANAGER_ROLE, attackerAddress);
      
      // Attacker tries to escalate beyond their role
      await expect(
        vcsaleContract.connect(attacker).grantRole(await vcsaleContract.ADMIN_ROLE(), attackerAddress)
      ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      console.log("❌ Cross-role escalation blocked");
      
      // Attacker tries to grant their role to others
      await expect(
        vcsaleContract.connect(attacker).grantRole(MANAGER_ROLE, await attackers[6].getAddress())
      ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      console.log("❌ Role distribution blocked");
      
      // Attacker can only use their designated role functions
      await expect(
        vcsaleContract.connect(attacker).setSaleActive(false)
      ).to.not.be.reverted;
      console.log("✅ Legitimate role function works");
      
      // Admin revokes role
      await vcsaleContract.connect(admin).revokeRole(MANAGER_ROLE, attackerAddress);
      
      // Attacker can no longer use role functions
      await expect(
        vcsaleContract.connect(attacker).setSaleActive(true)
      ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      console.log("✅ Role revocation works");
    });
  });

  describe("💰 Economic Attack Tests", () => {
    it("Should handle flash loan attacks", async () => {
      console.log("=== Flash Loan Attack Simulation ===");
      
      // Simulate a flash loan attack where attacker borrows large amount
      // and tries to manipulate price or drain contract
      
      const flashLoanAttacker = attackers[6];
      const massiveBNB = ethers.parseEther("1000"); // Simulate flash loaned BNB
      
      // Fund attacker with massive BNB (simulating flash loan)
      await network.provider.send("hardhat_setBalance", [
        await flashLoanAttacker.getAddress(),
        ethers.toQuantity(massiveBNB)
      ]);
      
      // Try to buy maximum VC with flash loaned funds
      const maxVCAmount = ethers.parseEther("1000"); // Contract maximum
      const requiredBNB = await vcsaleContract.calculateBNBAmount(maxVCAmount);
      
      // This should work but be limited by max purchase amount
      await vcsaleContract.connect(flashLoanAttacker).purchaseVC(maxVCAmount, { value: requiredBNB });
      
      // Try to make additional purchases immediately (should fail due to MEV protection)
      await expect(
        vcsaleContract.connect(flashLoanAttacker).purchaseVC(maxVCAmount, { value: requiredBNB })
      ).to.be.revertedWith("Too frequent purchases");
      
      console.log("❌ Rapid large purchases blocked by MEV protection");
      
      // Verify contract limits prevent excessive extraction
      const userStats = await vcsaleContract.getUserStats(await flashLoanAttacker.getAddress());
      expect(userStats.purchasedVC).to.equal(maxVCAmount); // Limited to max purchase
      
      console.log("✅ Flash loan attack contained by purchase limits");
    });

    it("Should resist price manipulation attacks", async () => {
      console.log("=== Price Manipulation Attack ===");
      
      const manipulator = attackers[7];
      
      // Attacker tries to manipulate price (should fail - no role)
      await expect(
        vcsaleContract.connect(manipulator).updatePrice(ethers.parseEther("0.01")) // 10x increase
      ).to.be.revertedWithCustomError(vcsaleContract, "AccessControlUnauthorizedAccount");
      console.log("❌ Unauthorized price manipulation blocked");
      
      // Even manager has limits on price changes
      await time.increase(3601); // Price update cooldown
      
      // Try to make excessive price change (should fail)
      const excessivePrice = PRICE_PER_VC * 200n / 100n; // 100% increase (exceeds 10% limit)
      await expect(
        vcsaleContract.connect(manager).updatePrice(excessivePrice)
      ).to.be.revertedWith("Price change too large");
      console.log("❌ Excessive price change blocked");
      
      // Only reasonable price changes allowed
      const reasonablePrice = PRICE_PER_VC * 105n / 100n; // 5% increase
      await expect(
        vcsaleContract.connect(manager).updatePrice(reasonablePrice)
      ).to.not.be.reverted;
      console.log("✅ Reasonable price change allowed");
      
      console.log("✅ Price manipulation protection working");
    });

    it("Should handle whale dumping attacks", async () => {
      console.log("=== Whale Dumping Attack ===");
      
      const whale = attackers[8];
      
      // Simulate whale making maximum purchases repeatedly
      const maxAmount = ethers.parseEther("1000");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(maxAmount);
      
      let purchaseCount = 0;
      const maxAttempts = 10;
      
      for (let i = 0; i < maxAttempts; i++) {
        try {
          await time.increase(61); // MEV protection
          await vcsaleContract.connect(whale).purchaseVC(maxAmount, { value: requiredBNB });
          purchaseCount++;
          console.log(`  Whale purchase ${purchaseCount} successful`);
        } catch (error: any) {
          if (error.message.includes("Circuit breaker")) {
            console.log(`🚨 Circuit breaker stopped whale after ${purchaseCount} purchases`);
            break;
          } else {
            throw error;
          }
        }
      }
      
      // Verify whale impact was limited
      const userStats = await vcsaleContract.getUserStats(await whale.getAddress());
      const totalPurchased = userStats.purchasedVC;
      
      console.log(`Whale purchased total: ${ethers.formatEther(totalPurchased)} VC`);
      
      // Should be limited by circuit breaker or daily limits
      const circuitBreakerState = await vcsaleContract.circuitBreaker();
      if (circuitBreakerState.triggered) {
        console.log("✅ Circuit breaker limited whale impact");
      }
    });
  });

  describe("🌊 DDoS and Spam Attack Tests", () => {
    it("Should handle transaction spam attacks", async () => {
      console.log("=== Transaction Spam Attack ===");
      
      const spammer = attackers[9];
      const smallAmount = ethers.parseEther("1"); // Minimum purchase
      const requiredBNB = await vcsaleContract.calculateBNBAmount(smallAmount);
      
      // Rapid spam attempts
      let successfulSpams = 0;
      let blockedSpams = 0;
      
      for (let i = 0; i < 20; i++) {
        try {
          if (i === 0) {
            // First should succeed
            await vcsaleContract.connect(spammer).purchaseVC(smallAmount, { value: requiredBNB });
            successfulSpams++;
          } else {
            // Rest should fail due to MEV protection
            await vcsaleContract.connect(spammer).purchaseVC(smallAmount, { value: requiredBNB });
            successfulSpams++;
          }
        } catch (error: any) {
          if (error.message.includes("Too frequent purchases")) {
            blockedSpams++;
          } else {
            throw error;
          }
        }
      }
      
      console.log(`Spam results: ${successfulSpams} successful, ${blockedSpams} blocked`);
      expect(successfulSpams).to.equal(1); // Only first should succeed
      expect(blockedSpams).to.equal(19); // Rest should be blocked
      
      console.log("✅ Spam attack effectively blocked");
    });

    it("Should handle multi-account coordinated spam", async () => {
      console.log("=== Multi-Account Coordinated Spam ===");
      
      const spamAmount = ethers.parseEther("10");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(spamAmount);
      
      // Each attacker makes one legitimate purchase
      let legitimatePurchases = 0;
      
      for (const attacker of attackers) {
        try {
          await vcsaleContract.connect(attacker).purchaseVC(spamAmount, { value: requiredBNB });
          legitimatePurchases++;
        } catch (error: any) {
          console.log(`Purchase failed: ${error.message}`);
        }
      }
      
      console.log(`Legitimate purchases: ${legitimatePurchases}/${attackers.length}`);
      
      // Now each tries to spam again (should all fail)
      let spamAttempts = 0;
      let blockedSpams = 0;
      
      for (const attacker of attackers) {
        spamAttempts++;
        try {
          await vcsaleContract.connect(attacker).purchaseVC(spamAmount, { value: requiredBNB });
        } catch (error: any) {
          if (error.message.includes("Too frequent purchases")) {
            blockedSpams++;
          }
        }
      }
      
      console.log(`Spam attempts: ${blockedSpams}/${spamAttempts} blocked`);
      expect(blockedSpams).to.equal(spamAttempts);
      
      console.log("✅ Multi-account spam attack blocked");
    });

    it("Should handle gas limit manipulation attacks", async () => {
      console.log("=== Gas Limit Manipulation Attack ===");
      
      const gasAttacker = attackers[0];
      const vcAmount = ethers.parseEther("50");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Try with extremely low gas (should fail)
      await expect(
        vcsaleContract.connect(gasAttacker).purchaseVC(vcAmount, { 
          value: requiredBNB,
          gasLimit: 21000 // Too low for contract call
        })
      ).to.be.reverted;
      console.log("❌ Low gas attack failed");
      
      // Try with extremely high gas (should work but waste attacker's money)
      await expect(
        vcsaleContract.connect(gasAttacker).purchaseVC(vcAmount, { 
          value: requiredBNB,
          gasLimit: 1000000 // Very high gas limit
        })
      ).to.not.be.reverted;
      console.log("✅ High gas transaction succeeded (attacker wasted gas)");
      
      console.log("✅ Gas manipulation attacks handled");
    });
  });

  describe("🔐 Emergency Response Tests", () => {
    it("Should handle emergency during active attack", async () => {
      console.log("=== Emergency Response During Attack ===");
      
      const vcAmount = ethers.parseEther("100");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Start coordinated attack
      const attackPromises = attackers.slice(0, 5).map(async (attacker, index) => {
        return new Promise(async (resolve) => {
          try {
            await time.increase(61 * index); // Stagger attacks
            await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
            resolve({ success: true, attacker: index });
          } catch (error: any) {
            resolve({ success: false, attacker: index, error: error.message });
          }
        });
      });
      
      // Emergency pause during attack
      setTimeout(async () => {
        console.log("🚨 EMERGENCY PAUSE ACTIVATED");
        await vcsaleContract.connect(pauser).pause();
      }, 100);
      
      const results = await Promise.all(attackPromises);
      const successfulAttacks = results.filter((r: any) => r.success).length;
      
      console.log(`Attacks before pause: ${successfulAttacks}/${results.length}`);
      
      // All new attacks should fail
      for (let i = 0; i < 3; i++) {
        await expect(
          vcsaleContract.connect(attackers[i]).purchaseVC(vcAmount, { value: requiredBNB })
        ).to.be.revertedWithCustomError(vcsaleContract, "EnforcedPause");
      }
      
      console.log("✅ Emergency pause stopped ongoing attack");
      
      // Resume operations
      await vcsaleContract.connect(pauser).unpause();
      
      // Normal operations should resume
      await time.increase(61);
      await expect(
        vcsaleContract.connect(legitimateUsers[0]).purchaseVC(vcAmount, { value: requiredBNB })
      ).to.not.be.reverted;
      
      console.log("✅ Normal operations resumed");
    });

    it("Should handle emergency withdrawal during attack", async () => {
      console.log("=== Emergency Withdrawal During Attack ===");
      
      const initialContractBalance = await vcToken.balanceOf(await vcsaleContract.getAddress());
      console.log(`Initial contract balance: ${ethers.formatEther(initialContractBalance)} VC`);
      
      // Start attack
      const largeAmount = ethers.parseEther("1000");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(largeAmount);
      
      // Make some purchases
      for (let i = 0; i < 3; i++) {
        await time.increase(61);
        await vcsaleContract.connect(attackers[i]).purchaseVC(largeAmount, { value: requiredBNB });
      }
      
      const midContractBalance = await vcToken.balanceOf(await vcsaleContract.getAddress());
      console.log(`Balance after attacks: ${ethers.formatEther(midContractBalance)} VC`);
      
      // Emergency withdrawal
      await vcsaleContract.connect(emergency).emergencyWithdraw(await vcToken.getAddress());
      
      const finalContractBalance = await vcToken.balanceOf(await vcsaleContract.getAddress());
      const treasuryBalance = await vcToken.balanceOf(await treasury.getAddress());
      
      expect(finalContractBalance).to.equal(0);
      expect(treasuryBalance).to.equal(midContractBalance);
      
      console.log("🚨 Emergency withdrawal completed");
      console.log(`All remaining tokens moved to treasury: ${ethers.formatEther(treasuryBalance)} VC`);
      
      // Further purchases should fail (no tokens left)
      await time.increase(61);
      await expect(
        vcsaleContract.connect(attackers[0]).purchaseVC(largeAmount, { value: requiredBNB })
      ).to.be.revertedWith("Insufficient VC in contract");
      
      console.log("✅ Emergency withdrawal successful");
    });
  });

  describe("📊 Attack Analytics and Monitoring", () => {
    it("Should track security events during coordinated attack", async () => {
      console.log("=== Security Event Tracking ===");
      
      const vcAmount = ethers.parseEther("200");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      let securityEvents = 0;
      
      // Monitor SecurityEvent emissions
      vcsaleContract.on("SecurityEvent", (user, eventType, description, timestamp) => {
        securityEvents++;
        console.log(`Security Event: ${eventType} for ${user}`);
      });
      
      // Coordinate attack that triggers various security events
      for (let i = 0; i < 5; i++) {
        const attacker = attackers[i];
        
        // First purchase should succeed and emit security event
        await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
        
        // Immediate second purchase should fail and emit security event
        try {
          await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Give events time to be captured
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Total security events captured: ${securityEvents}`);
      expect(securityEvents).to.be.gt(0);
      
      console.log("✅ Security event monitoring working");
    });

    it("Should generate comprehensive attack report", async () => {
      console.log("=== Attack Report Generation ===");
      
      const attackReport = {
        totalAttackers: attackers.length,
        successfulPurchases: 0,
        blockedAttempts: 0,
        mevProtectionTriggers: 0,
        circuitBreakerTriggers: 0,
        unauthorizedAccessAttempts: 0,
        totalVolumeAttempted: 0n,
        totalVolumeSuccessful: 0n,
      };
      
      const vcAmount = ethers.parseEther("500");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // Simulate various attack vectors
      for (let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        attackReport.totalVolumeAttempted += vcAmount;
        
        try {
          await time.increase(61);
          await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
          attackReport.successfulPurchases++;
          attackReport.totalVolumeSuccessful += vcAmount;
          
          // Try immediate second purchase (should trigger MEV protection)
          try {
            await vcsaleContract.connect(attacker).purchaseVC(vcAmount, { value: requiredBNB });
          } catch (error: any) {
            if (error.message.includes("Too frequent purchases")) {
              attackReport.mevProtectionTriggers++;
              attackReport.blockedAttempts++;
            }
          }
          
        } catch (error: any) {
          attackReport.blockedAttempts++;
        }
        
        // Try unauthorized operations
        try {
          await vcsaleContract.connect(attacker).pause();
        } catch (error) {
          attackReport.unauthorizedAccessAttempts++;
        }
      }
      
      console.log("=== ATTACK REPORT ===");
      console.log(`Total Attackers: ${attackReport.totalAttackers}`);
      console.log(`Successful Purchases: ${attackReport.successfulPurchases}`);
      console.log(`Blocked Attempts: ${attackReport.blockedAttempts}`);
      console.log(`MEV Protection Triggers: ${attackReport.mevProtectionTriggers}`);
      console.log(`Unauthorized Access Attempts: ${attackReport.unauthorizedAccessAttempts}`);
      console.log(`Volume Attempted: ${ethers.formatEther(attackReport.totalVolumeAttempted)} VC`);
      console.log(`Volume Successful: ${ethers.formatEther(attackReport.totalVolumeSuccessful)} VC`);
      
      const successRate = attackReport.successfulPurchases / (attackReport.successfulPurchases + attackReport.blockedAttempts);
      console.log(`Attack Success Rate: ${(successRate * 100).toFixed(2)}%`);
      
      // Security should have limited attack success
      expect(successRate).to.be.lt(0.6); // Less than 60% success rate
      expect(attackReport.mevProtectionTriggers).to.be.gt(0);
      expect(attackReport.unauthorizedAccessAttempts).to.equal(attackers.length);
      
      console.log("✅ Security mechanisms effectively limited attack impact");
    });
  });
}); 