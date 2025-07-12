import { ethers, upgrades, network } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VCSaleContract, VCToken } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Performance Tests for VCSale Contract
 * These tests focus on gas optimization, throughput, and scalability
 */
describe("VCSale Performance Tests", () => {
  let owner: Signer;
  let admin: Signer;
  let manager: Signer;
  let treasury: Signer;
  let users: Signer[];
  let vcsaleContract: VCSaleContract;
  let vcToken: VCToken;
  
  const PRICE_PER_VC = ethers.parseEther("0.001");
  const MIN_PURCHASE = ethers.parseEther("1");
  const MAX_PURCHASE = ethers.parseEther("1000");
  const INITIAL_VC_SUPPLY = ethers.parseEther("50000000"); // 50M VC for stress testing
  
  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [owner, admin, manager, treasury] = signers.slice(0, 4);
    users = signers.slice(4, 20); // 16 test users for performance testing

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
    
    // Deposit a reasonable amount for performance testing
    const testSupply = ethers.parseEther("1000000"); // 1M VC for testing
    await vcToken.mintTo(await admin.getAddress(), testSupply);
    await vcToken.connect(admin).approve(await vcsaleContract.getAddress(), testSupply);
    await vcsaleContract.connect(admin).depositVCTokens(testSupply);
    
    const MANAGER_ROLE = await vcsaleContract.MANAGER_ROLE();
    await vcsaleContract.connect(admin).grantRole(MANAGER_ROLE, await manager.getAddress());
    await vcsaleContract.connect(manager).setSaleActive(true);
  });

  describe("⛽ Gas Optimization Tests", () => {
    it("Should optimize gas usage for standard purchases", async () => {
      const testCases = [
        { amount: "1", description: "Minimum purchase" },
        { amount: "10", description: "Small purchase" },
        { amount: "100", description: "Medium purchase" },
        { amount: "1000", description: "Maximum purchase" },
      ];

      console.log("=== Gas Usage Analysis ===");
      
      for (const testCase of testCases) {
        const user = users[0];
        const vcAmount = ethers.parseEther(testCase.amount);
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        await time.increase(61); // MEV protection
        
        const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
        const receipt = await tx.wait();
        
        console.log(`${testCase.description}: ${receipt!.gasUsed.toString()} gas`);
        
        // Gas should be reasonable (less than 300k for any purchase)
        expect(receipt!.gasUsed).to.be.lt(300000);
      }
    });

    it("Should have consistent gas usage regardless of purchase amount", async () => {
      const amounts = ["1", "50", "500", "1000"];
      const gasUsages: bigint[] = [];
      
      for (let i = 0; i < amounts.length; i++) {
        const user = users[i];
        const vcAmount = ethers.parseEther(amounts[i]);
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        await time.increase(61);
        
        const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
        const receipt = await tx.wait();
        
        gasUsages.push(receipt!.gasUsed);
      }
      
      // Gas usage should be consistent (within 10% variance)
      const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
      
      for (const gasUsed of gasUsages) {
        const variance = Number(gasUsed > avgGas ? gasUsed - avgGas : avgGas - gasUsed) / Number(avgGas);
        expect(variance).to.be.lt(0.1); // Less than 10% variance
      }
      
      console.log(`Average gas usage: ${avgGas.toString()}`);
      console.log(`Gas variance: ${gasUsages.map(g => Number(g)).join(", ")}`);
    });

    it("Should optimize gas for state updates", async () => {
      const user = users[0];
      const vcAmount = ethers.parseEther("100");
      const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
      
      // First purchase (more expensive due to cold storage)
      const firstTx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      const firstReceipt = await firstTx.wait();
      
      await time.increase(61);
      
      // Second purchase (should be more efficient)
      const secondTx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      const secondReceipt = await secondTx.wait();
      
      console.log(`First purchase: ${firstReceipt!.gasUsed.toString()} gas`);
      console.log(`Second purchase: ${secondReceipt!.gasUsed.toString()} gas`);
      
      // Second purchase should use less gas (warm storage)
      expect(secondReceipt!.gasUsed).to.be.lt(firstReceipt!.gasUsed);
    });

    it("Should optimize gas for view functions", async () => {
      const user = users[0];
      const userAddress = await user.getAddress();
      
      // Measure gas for view functions (should be minimal)
      console.log("=== View Function Gas Usage ===");
      
      const viewFunctions = [
        { name: "getSaleStats", call: () => vcsaleContract.getSaleStats.estimateGas() },
        { name: "getUserStats", call: () => vcsaleContract.getUserStats.estimateGas(userAddress) },
        { name: "canPurchase", call: () => vcsaleContract.canPurchase.estimateGas(userAddress, ethers.parseEther("10")) },
        { name: "calculateBNBAmount", call: () => vcsaleContract.calculateBNBAmount.estimateGas(ethers.parseEther("10")) },
      ];
      
      for (const func of viewFunctions) {
        const gasEstimate = await func.call();
        console.log(`${func.name}: ${gasEstimate.toString()} gas`);
        
        // View functions should use minimal gas
        expect(gasEstimate).to.be.lt(50000);
      }
    });
  });

  describe("🚀 Throughput Tests", () => {
    it("Should handle high-frequency purchases efficiently", async () => {
      const iterations = 50;
      const vcAmount = ethers.parseEther("10");
      const startTime = Date.now();
      
      console.log(`=== High-Frequency Test: ${iterations} purchases ===`);
      
      for (let i = 0; i < iterations; i++) {
        const user = users[i % users.length];
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        await time.increase(61); // MEV protection
        
        await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
        
        if (i % 10 === 0) {
          console.log(`  Completed ${i + 1}/${iterations} purchases`);
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const throughput = iterations / (totalTime / 1000); // purchases per second
      
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} purchases/second`);
      
      // Verify all purchases were successful
      const finalStats = await vcsaleContract.getSaleStats();
      expect(finalStats.totalVCSold).to.equal(vcAmount * BigInt(iterations));
    });

    it("Should maintain performance with increasing contract state", async () => {
      const phases = [
        { purchases: 10, description: "Initial state" },
        { purchases: 50, description: "Growing state" },
        { purchases: 100, description: "Large state" },
      ];
      
      let totalPurchases = 0;
      const phasePerformance: Array<{ phase: string; avgGas: bigint; avgTime: number }> = [];
      
      for (const phase of phases) {
        console.log(`=== ${phase.description}: ${phase.purchases} purchases ===`);
        
        const gasUsages: bigint[] = [];
        const executionTimes: number[] = [];
        
        for (let i = 0; i < phase.purchases; i++) {
          const user = users[(totalPurchases + i) % users.length];
          const vcAmount = ethers.parseEther("20");
          const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
          
          await time.increase(61);
          
          const startTime = Date.now();
          const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
          const receipt = await tx.wait();
          const endTime = Date.now();
          
          gasUsages.push(receipt!.gasUsed);
          executionTimes.push(endTime - startTime);
        }
        
        const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
        const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        
        phasePerformance.push({
          phase: phase.description,
          avgGas,
          avgTime,
        });
        
        totalPurchases += phase.purchases;
        
        console.log(`  Average gas: ${avgGas.toString()}`);
        console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
      }
      
      // Performance should not degrade significantly with state growth
      const initialPerf = phasePerformance[0];
      const finalPerf = phasePerformance[phasePerformance.length - 1];
      
      const gasIncrease = Number(finalPerf.avgGas - initialPerf.avgGas) / Number(initialPerf.avgGas);
      const timeIncrease = (finalPerf.avgTime - initialPerf.avgTime) / initialPerf.avgTime;
      
      console.log(`Gas increase: ${(gasIncrease * 100).toFixed(2)}%`);
      console.log(`Time increase: ${(timeIncrease * 100).toFixed(2)}%`);
      
      // Performance degradation should be minimal
      expect(gasIncrease).to.be.lt(0.1); // Less than 10% gas increase
      expect(timeIncrease).to.be.lt(0.2); // Less than 20% time increase
    });

    it("Should handle batch operations efficiently", async () => {
      const batchSizes = [5, 10, 15];
      
      for (const batchSize of batchSizes) {
        console.log(`=== Batch test: ${batchSize} concurrent purchases ===`);
        
        const vcAmount = ethers.parseEther("30");
        const promises: Promise<any>[] = [];
        
        // Prepare batch
        for (let i = 0; i < batchSize; i++) {
          const user = users[i % users.length];
          const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
          
          // Stagger slightly to avoid exact same block
          const delay = i * 100; // 100ms between each
          
          const promise = new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, delay));
            await time.increase(61);
            
            const startTime = Date.now();
            const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
            const receipt = await tx.wait();
            const endTime = Date.now();
            
            resolve({
              gasUsed: receipt!.gasUsed,
              executionTime: endTime - startTime,
            });
          });
          
          promises.push(promise);
        }
        
        // Execute batch
        const startTime = Date.now();
        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        const totalTime = endTime - startTime;
        const avgGas = results.reduce((sum: bigint, r: any) => sum + r.gasUsed, 0n) / BigInt(results.length);
        
        console.log(`  Batch completed in: ${totalTime}ms`);
        console.log(`  Average gas: ${avgGas.toString()}`);
        console.log(`  Effective throughput: ${(batchSize / (totalTime / 1000)).toFixed(2)} purchases/second`);
        
        // All transactions should succeed
        expect(results.length).to.equal(batchSize);
      }
    });
  });

  describe("📈 Scalability Tests", () => {
    it("Should scale with increasing number of users", async () => {
      const userCounts = [5, 10, 16];
      
      for (const userCount of userCounts) {
        console.log(`=== Scalability test: ${userCount} users ===`);
        
        const vcAmount = ethers.parseEther("25");
        const purchasesPerUser = 3;
        let totalGas = 0n;
        let totalTime = 0;
        let totalTransactions = 0;
        
        const startTime = Date.now();
        
        for (let u = 0; u < userCount; u++) {
          const user = users[u];
          
          for (let p = 0; p < purchasesPerUser; p++) {
            const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
            
            await time.increase(61);
            
            const txStartTime = Date.now();
            const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
            const receipt = await tx.wait();
            const txEndTime = Date.now();
            
            totalGas += receipt!.gasUsed;
            totalTime += (txEndTime - txStartTime);
            totalTransactions++;
          }
        }
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        const avgGas = totalGas / BigInt(totalTransactions);
        const avgTime = totalTime / totalTransactions;
        const throughput = totalTransactions / (totalDuration / 1000);
        
        console.log(`  Total transactions: ${totalTransactions}`);
        console.log(`  Average gas: ${avgGas.toString()}`);
        console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`  Throughput: ${throughput.toFixed(2)} tx/sec`);
        
        // Verify all transactions succeeded
        const expectedVolume = vcAmount * BigInt(totalTransactions);
        const stats = await vcsaleContract.getSaleStats();
        expect(stats.totalVCSold).to.be.gte(expectedVolume);
      }
    });

    it("Should handle large volume scenarios", async () => {
      console.log("=== Large Volume Scenario ===");
      
      const largeVolumePurchases = [
        { amount: "1000", count: 10, description: "10 maximum purchases" },
        { amount: "500", count: 20, description: "20 large purchases" },
        { amount: "100", count: 100, description: "100 medium purchases" },
      ];
      
      for (const scenario of largeVolumePurchases) {
        console.log(`--- ${scenario.description} ---`);
        
        const vcAmount = ethers.parseEther(scenario.amount);
        const startTime = Date.now();
        let totalGas = 0n;
        
        for (let i = 0; i < scenario.count; i++) {
          const user = users[i % users.length];
          const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
          
          await time.increase(61);
          
          const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
          const receipt = await tx.wait();
          
          totalGas += receipt!.gasUsed;
          
          if (i % 10 === 0) {
            console.log(`    Completed ${i + 1}/${scenario.count}`);
          }
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        const avgGas = totalGas / BigInt(scenario.count);
        const totalVolume = vcAmount * BigInt(scenario.count);
        
        console.log(`  Duration: ${duration}ms`);
        console.log(`  Average gas: ${avgGas.toString()}`);
        console.log(`  Total volume: ${ethers.formatEther(totalVolume)} VC`);
        console.log(`  Rate: ${ethers.formatEther(totalVolume)} VC in ${duration / 1000}s`);
      }
    });

    it("Should maintain data consistency under heavy load", async () => {
      console.log("=== Data Consistency Under Load ===");
      
      const heavyLoadTest = {
        users: 10,
        purchasesPerUser: 10,
        vcAmount: ethers.parseEther("50"),
      };
      
      let expectedTotalVolume = 0n;
      let expectedTotalRevenue = 0n;
      const userExpectedVolumes = new Map<string, bigint>();
      
      for (let u = 0; u < heavyLoadTest.users; u++) {
        const user = users[u];
        const userAddress = await user.getAddress();
        userExpectedVolumes.set(userAddress, 0n);
        
        for (let p = 0; p < heavyLoadTest.purchasesPerUser; p++) {
          const requiredBNB = await vcsaleContract.calculateBNBAmount(heavyLoadTest.vcAmount);
          
          await time.increase(61);
          
          await vcsaleContract.connect(user).purchaseVC(heavyLoadTest.vcAmount, { value: requiredBNB });
          
          expectedTotalVolume += heavyLoadTest.vcAmount;
          expectedTotalRevenue += requiredBNB;
          userExpectedVolumes.set(userAddress, userExpectedVolumes.get(userAddress)! + heavyLoadTest.vcAmount);
        }
      }
      
      // Verify contract state consistency
      const finalStats = await vcsaleContract.getSaleStats();
      expect(finalStats.totalVCSold).to.equal(expectedTotalVolume);
      expect(finalStats.totalRevenue).to.equal(expectedTotalRevenue);
      
      // Verify individual user balances
      for (let u = 0; u < heavyLoadTest.users; u++) {
        const user = users[u];
        const userAddress = await user.getAddress();
        const expectedVolume = userExpectedVolumes.get(userAddress)!;
        
        const userVCBalance = await vcToken.balanceOf(userAddress);
        expect(userVCBalance).to.equal(expectedVolume);
        
        const userStats = await vcsaleContract.getUserStats(userAddress);
        expect(userStats.purchasedVC).to.equal(expectedVolume);
      }
      
      console.log("✅ Data consistency maintained under heavy load");
      console.log(`  Total volume: ${ethers.formatEther(expectedTotalVolume)} VC`);
      console.log(`  Total revenue: ${ethers.formatEther(expectedTotalRevenue)} BNB`);
    });
  });

  describe("🏎️ Optimization Benchmarks", () => {
    it("Should benchmark against theoretical maximum throughput", async () => {
      console.log("=== Theoretical Maximum Throughput Benchmark ===");
      
      // Disable MEV protection for maximum throughput test
      await vcsaleContract.connect(manager).updateSecurityConfig(
        false, // mevProtectionEnabled
        0,     // minTimeBetweenPurchases
        1000,  // maxPurchasesPerBlock (high limit)
        false, // circuitBreakerActive
        ethers.parseEther("1000000"),
        3600
      );
      
      const iterations = 20;
      const vcAmount = ethers.parseEther("100");
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const user = users[i % users.length];
        const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
        
        await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const theoreticalThroughput = iterations / (duration / 1000);
      
      console.log(`Maximum throughput: ${theoreticalThroughput.toFixed(2)} purchases/second`);
      console.log(`Average time per purchase: ${(duration / iterations).toFixed(2)}ms`);
      
      // Re-enable security features
      await vcsaleContract.connect(manager).updateSecurityConfig(
        true,  // mevProtectionEnabled
        60,    // minTimeBetweenPurchases
        5,     // maxPurchasesPerBlock
        true,  // circuitBreakerActive
        ethers.parseEther("100000"),
        3600
      );
    });

    it("Should compare performance with and without security features", async () => {
      console.log("=== Security Features Performance Impact ===");
      
      const testScenarios = [
        { name: "With all security", mevEnabled: true, circuitBreakerEnabled: true },
        { name: "MEV only", mevEnabled: true, circuitBreakerEnabled: false },
        { name: "Circuit breaker only", mevEnabled: false, circuitBreakerEnabled: true },
        { name: "No security", mevEnabled: false, circuitBreakerEnabled: false },
      ];
      
      const vcAmount = ethers.parseEther("75");
      const iterations = 10;
      
      for (const scenario of testScenarios) {
        console.log(`--- ${scenario.name} ---`);
        
        // Configure security features
        await vcsaleContract.connect(manager).updateSecurityConfig(
          scenario.mevEnabled,
          scenario.mevEnabled ? 60 : 0,
          scenario.mevEnabled ? 5 : 1000,
          scenario.circuitBreakerEnabled,
          ethers.parseEther("100000"),
          3600
        );
        
        const gasUsages: bigint[] = [];
        const executionTimes: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const user = users[i % users.length];
          const requiredBNB = await vcsaleContract.calculateBNBAmount(vcAmount);
          
          if (scenario.mevEnabled && i > 0) {
            await time.increase(61);
          }
          
          const startTime = Date.now();
          const tx = await vcsaleContract.connect(user).purchaseVC(vcAmount, { value: requiredBNB });
          const receipt = await tx.wait();
          const endTime = Date.now();
          
          gasUsages.push(receipt!.gasUsed);
          executionTimes.push(endTime - startTime);
        }
        
        const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
        const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        
        console.log(`  Average gas: ${avgGas.toString()}`);
        console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
      }
    });
  });
}); 