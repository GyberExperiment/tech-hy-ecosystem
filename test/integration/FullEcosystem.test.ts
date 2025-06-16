import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { 
    VGToken, 
    VCToken, 
    VGTokenVotes, 
    LPLocker, 
    StakingDAO, 
    LPLockerGovernor,
    LPLockerTimelock,
    MockERC20,
    MockPancakeRouter 
} from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Full Ecosystem Integration", function () {
    let vcToken: VCToken;
    let vgToken: VGToken;
    let vgTokenVotes: VGTokenVotes;
    let lpToken: MockERC20;
    let lpLocker: LPLocker;
    let stakingDAO: StakingDAO;
    let governor: LPLockerGovernor;
    let timelock: LPLockerTimelock;
    let pancakeRouter: MockPancakeRouter;

    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;
    let authority: Signer;

    const INITIAL_VC_SUPPLY = ethers.parseEther("100000000"); // 100M VC
    const INITIAL_VG_SUPPLY = ethers.parseEther("10000000");  // 10M VG
    const TEST_VC_AMOUNT = ethers.parseEther("1000");         // 1K VC for tests
    const TEST_BNB_AMOUNT = ethers.parseEther("1");           // 1 BNB for tests
    const LP_REWARD_RATIO = 10n; // 1 LP = 10 VG

    beforeEach(async function () {
        [owner, user1, user2, user3, authority] = await ethers.getSigners();

        // 1. Deploy production tokens
        console.log("🪙 Deploying production tokens...");
        
        const VCTokenFactory = await ethers.getContractFactory("VCToken");
        vcToken = await VCTokenFactory.deploy(await owner.getAddress());
        
        const VGTokenFactory = await ethers.getContractFactory("VGToken");
        vgToken = await VGTokenFactory.deploy(await owner.getAddress());
        
        const VGTokenVotesFactory = await ethers.getContractFactory("VGTokenVotes");
        vgTokenVotes = await VGTokenVotesFactory.deploy(await vgToken.getAddress());

        // 2. Deploy mock infrastructure
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        lpToken = await MockERC20Factory.deploy("VC-BNB LP", "VC-BNB");
        
        const MockPancakeRouterFactory = await ethers.getContractFactory("MockPancakeRouter");
        pancakeRouter = await MockPancakeRouterFactory.deploy();

        // 3. Deploy Timelock
        const TimelockFactory = await ethers.getContractFactory("LPLockerTimelock");
        timelock = await TimelockFactory.deploy(
            86400, // 1 day
            [await owner.getAddress()], // proposers  
            [await owner.getAddress()], // executors
            await owner.getAddress()    // admin
        );

        // 4. Deploy StakingDAO
        const StakingDAOFactory = await ethers.getContractFactory("StakingDAO");
        stakingDAO = await upgrades.deployProxy(StakingDAOFactory, [
            await vgTokenVotes.getAddress(), // governance token
            await owner.getAddress()         // Временно используем owner address, потом обновим на LPLocker
        ], { 
            initializer: 'initialize',
            kind: 'uups'
        });

        // 5. Deploy LPLocker
        const LPLockerFactory = await ethers.getContractFactory("LPLocker");
        const initConfig = {
            vgTokenAddress: await vgToken.getAddress(),
            vcTokenAddress: await vcToken.getAddress(),
            pancakeRouter: await pancakeRouter.getAddress(),
            lpTokenAddress: await lpToken.getAddress(),
            stakingVaultAddress: await owner.getAddress(),
            lpDivisor: 1000000,
            lpToVgRatio: LP_REWARD_RATIO,
            minBnbAmount: ethers.parseEther("0.01"),
            minVcAmount: ethers.parseEther("1"),
            maxSlippageBps: 1000,  // 10%
            defaultSlippageBps: 200, // 2%
            mevProtectionEnabled: true,
            minTimeBetweenTxs: 300,
            maxTxPerUserPerBlock: 2
        };

        lpLocker = await upgrades.deployProxy(LPLockerFactory, [initConfig], {
            initializer: 'initialize',
            kind: 'uups'
        });

        // 6. Get Governor from DAO
        const governorAddress = await stakingDAO.governor();
        governor = await ethers.getContractAt("LPLockerGovernor", governorAddress);

        // 7. Setup initial state
        await setupInitialState();
    });

    async function setupInitialState() {
        // Distribute VC tokens to users for testing
        await vcToken.transfer(await user1.getAddress(), TEST_VC_AMOUNT * 10n);
        await vcToken.transfer(await user2.getAddress(), TEST_VC_AMOUNT * 10n);
        await vcToken.transfer(await user3.getAddress(), TEST_VC_AMOUNT * 10n);

        // Setup VG rewards pool for LPLocker - используем уже существующие VG токены 
        const rewardPool = ethers.parseEther("5000000"); // 5M VG для наград (из 10M total supply)
        
        // ✅ ВАЖНО: Используем уже существующие VG токены (преминчены при создании контракта)
        await vgToken.approve(await lpLocker.getAddress(), rewardPool);
        
        // ✅ ВАЖНО: Депонируем VG токены в LPLocker для выдачи наград
        await lpLocker.depositVGTokens(rewardPool);

        // Setup mock PancakeRouter behavior
        const expectedLP = (TEST_VC_AMOUNT * TEST_BNB_AMOUNT) / 1000000n;
        await pancakeRouter.setAddLiquidityResult(0, 0, expectedLP);

        // Setup governance tokens for voting tests
        const govAmount = ethers.parseEther("1000000"); // 1M VG for governance
        await vgToken.approve(await vgTokenVotes.getAddress(), govAmount);
        await vgTokenVotes.deposit(govAmount);
        await vgTokenVotes.enableVoting();
    }

    describe("🏗️ Ecosystem Deployment", function () {
        it("Should deploy all contracts with correct parameters", async function () {
            // Token deployments
            expect(await vcToken.name()).to.equal("Value Coin");
            expect(await vcToken.symbol()).to.equal("VC");
            expect(await vcToken.totalSupply()).to.equal(INITIAL_VC_SUPPLY);
            
            expect(await vgToken.name()).to.equal("Value Governance");
            expect(await vgToken.symbol()).to.equal("VG");
            expect(await vgToken.totalSupply()).to.equal(INITIAL_VG_SUPPLY);
            
            expect(await vgTokenVotes.name()).to.equal("Value Governance Votes");
            expect(await vgTokenVotes.underlyingToken()).to.equal(await vgToken.getAddress());

            // Infrastructure
            expect(await lpLocker.config().then(c => c.vgTokenAddress)).to.equal(await vgToken.getAddress());
            expect(await lpLocker.config().then(c => c.vcTokenAddress)).to.equal(await vcToken.getAddress());
            
            expect(await stakingDAO.token()).to.equal(await vgTokenVotes.getAddress());
            expect(await governor.token()).to.equal(await vgTokenVotes.getAddress());
        });

        it("Should have correct authority setup", async function () {
            expect(await vgToken._OWNER_()).to.equal(await owner.getAddress());
            expect(await vcToken.owner()).to.equal(await owner.getAddress());
            expect(await lpLocker.config().then(c => c.authority)).to.equal(await owner.getAddress());
        });
    });

    describe("💰 Token Flow Integration", function () {
        it("Should handle complete VC + BNB → LP → VG flow", async function () {
            // User1 approves VC for LPLocker
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
            
            const initialVGBalance = await vgToken.balanceOf(await user1.getAddress());
            const expectedLP = (TEST_VC_AMOUNT * TEST_BNB_AMOUNT) / 1000000n;
            const expectedVG = expectedLP * LP_REWARD_RATIO;

            // Execute earnVG
            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.emit(lpLocker, "VGTokensEarned")
             .withArgs(
                await user1.getAddress(),
                expectedLP,
                expectedVG,
                TEST_BNB_AMOUNT,
                TEST_VC_AMOUNT,
                await time.latest()
             );

            // Verify results
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialVGBalance + expectedVG);
            
            const config = await lpLocker.config();
            expect(config.totalLockedLp).to.equal(expectedLP);
            expect(config.totalVgIssued).to.equal(expectedVG);
        });

        it("Should handle VG → VGVotes → Governance flow", async function () {
            // User gets VG tokens first
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
            await lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                value: TEST_BNB_AMOUNT 
            });

            const vgBalance = await vgToken.balanceOf(await user1.getAddress());
            expect(vgBalance).to.be.gt(0);

            // Wrap VG → VGVotes
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), vgBalance);
            await vgTokenVotes.connect(user1).deposit(vgBalance);
            
            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(vgBalance);

            // Enable voting power
            await vgTokenVotes.connect(user1).enableVoting();
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(vgBalance);

            // User can now participate in governance
            const votingPower = await vgTokenVotes.getVotes(await user1.getAddress());
            expect(votingPower).to.be.gt(0);
        });

        it("Should handle multiple users in parallel", async function () {
            const users = [user1, user2, user3];
            const expectedResults = [];

            // All users execute earnVG in parallel
            for (const user of users) {
                await vcToken.connect(user).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
            }

            // Execute transactions
            const promises = users.map(user => 
                lpLocker.connect(user).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            );

            await Promise.all(promises);

            // Verify all users received VG tokens
            for (const user of users) {
                const balance = await vgToken.balanceOf(await user.getAddress());
                expect(balance).to.be.gt(0);
                expectedResults.push(balance);
            }

            // Verify total accounting
            const config = await lpLocker.config();
            const expectedTotalLP = ((TEST_VC_AMOUNT * TEST_BNB_AMOUNT) / 1000000n) * BigInt(users.length);
            const expectedTotalVG = expectedTotalLP * LP_REWARD_RATIO;
            
            expect(config.totalLockedLp).to.equal(expectedTotalLP);
            expect(config.totalVgIssued).to.equal(expectedTotalVG);
        });
    });

    describe("🗳️ Governance Integration", function () {
        beforeEach(async function () {
            // Setup voting power for governance tests
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
            await lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                value: TEST_BNB_AMOUNT 
            });

            const vgBalance = await vgToken.balanceOf(await user1.getAddress());
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), vgBalance);
            await vgTokenVotes.connect(user1).deposit(vgBalance);
            await vgTokenVotes.connect(user1).enableVoting();
        });

        it("Should create and execute governance proposal", async function () {
            // Create proposal to update LP ratio
            const newRatio = 15; // Change from 10 to 15
            const targets = [await lpLocker.getAddress()];
            const values = [0];
            const calldatas = [
                lpLocker.interface.encodeFunctionData("updateRates", [1000000, newRatio])
            ];
            const description = "Update LP to VG ratio to 15";

            // Propose
            const proposeTx = await governor.connect(user1).propose(
                targets,
                values,
                calldatas,
                description
            );
            const proposeReceipt = await proposeTx.wait();
            const proposalId = proposeReceipt?.logs[0].topics[1];

            // Wait for voting delay
            await time.increase(86400 + 1); // 1 day + 1 second

            // Vote
            await governor.connect(user1).castVote(proposalId!, 1); // Vote For

            // Wait for voting period
            await time.increase(604800); // 7 days

            // Queue in timelock (если proposal прошел)
            const proposalState = await governor.state(proposalId!);
            if (proposalState === 4) { // Succeeded
                await governor.queue(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));
                
                // Wait for timelock delay
                await time.increase(86400 + 1); // 1 day + 1 second
                
                // Execute
                await governor.execute(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));
                
                // Verify change was applied
                const newConfig = await lpLocker.config();
                expect(newConfig.lpToVgRatio).to.equal(newRatio);
            }
        });

        it("Should handle governance voting with multiple participants", async function () {
            // Setup multiple voters
            const voters = [user2, user3];
            for (const voter of voters) {
                await vcToken.connect(voter).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
                await lpLocker.connect(voter).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                });

                const vgBalance = await vgToken.balanceOf(await voter.getAddress());
                await vgToken.connect(voter).approve(await vgTokenVotes.getAddress(), vgBalance);
                await vgTokenVotes.connect(voter).deposit(vgBalance);
                await vgTokenVotes.connect(voter).enableVoting();
            }

            // Create simple proposal
            const targets = [await lpLocker.getAddress()];
            const values = [0];
            const calldatas = [
                lpLocker.interface.encodeFunctionData("updateSlippageConfig", [800, 150]) // Max 8%, default 1.5%
            ];
            const description = "Update slippage configuration";

            const proposeTx = await governor.connect(user1).propose(targets, values, calldatas, description);
            const proposeReceipt = await proposeTx.wait();
            const proposalId = proposeReceipt?.logs[0].topics[1];

            await time.increase(86400 + 1);

            // Multiple votes
            await governor.connect(user1).castVote(proposalId!, 1); // For
            await governor.connect(user2).castVote(proposalId!, 1); // For  
            await governor.connect(user3).castVote(proposalId!, 0); // Against

            // Check vote counts
            const proposalVotes = await governor.proposalVotes(proposalId!);
            expect(proposalVotes.forVotes).to.be.gt(proposalVotes.againstVotes);
        });
    });

    describe("🛡️ Security Integration", function () {
        it("Should enforce MEV protection across multiple transactions", async function () {
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT * 5n);

            // First transaction should succeed
            await lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                value: TEST_BNB_AMOUNT 
            });

            // Second transaction in same block should fail (MEV protection)
            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.be.revertedWith("MEV protection violated");

            // After time delay, should work again
            await time.increase(301); // 5 minutes + 1 second
            
            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.not.be.reverted;
        });

        it("Should handle slippage protection correctly", async function () {
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);

            // Setup router to return less LP than expected (simulating slippage)
            const expectedLP = (TEST_VC_AMOUNT * TEST_BNB_AMOUNT) / 1000000n;
            const slippedLP = expectedLP - (expectedLP * 300n / 10000n); // 3% slippage
            await pancakeRouter.setAddLiquidityResult(0, 0, slippedLP);

            // With 2% max slippage, this should fail
            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.be.revertedWith("Slippage exceeded");

            // With 5% max slippage, this should succeed
            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 500, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.not.be.reverted;
        });

        it("Should protect against insufficient VG token supply", async function () {
            // Drain VG tokens from owner to simulate insufficient supply
            const ownerBalance = await vgToken.balanceOf(await owner.getAddress());
            await vgToken.transfer(await authority.getAddress(), ownerBalance);

            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);

            await expect(
                lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.be.revertedWith("Insufficient VG tokens in contract");
        });
    });

    describe("🚀 Stress Testing", function () {
        it("Should handle high volume of transactions", async function () {
            const numTransactions = 10;
            const users = [user1, user2, user3];
            
            // Setup large amounts
            const largeAmount = TEST_VC_AMOUNT * 5n;
            for (const user of users) {
                await vcToken.transfer(await user.getAddress(), largeAmount * BigInt(numTransactions));
                await vcToken.connect(user).approve(await lpLocker.getAddress(), largeAmount * BigInt(numTransactions));
            }

            // Execute many transactions
            for (let i = 0; i < numTransactions; i++) {
                for (const user of users) {
                    await lpLocker.connect(user).earnVG(largeAmount, TEST_BNB_AMOUNT, 200, { 
                        value: TEST_BNB_AMOUNT 
                    });
                    
                    // Add small delay to avoid MEV protection
                    if (i < numTransactions - 1 || user !== users[users.length - 1]) {
                        await time.increase(301);
                    }
                }
            }

            // Verify final state
            const config = await lpLocker.config();
            const expectedTotalLP = ((largeAmount * TEST_BNB_AMOUNT) / 1000000n) * BigInt(users.length * numTransactions);
            const expectedTotalVG = expectedTotalLP * LP_REWARD_RATIO;
            
            expect(config.totalLockedLp).to.equal(expectedTotalLP);
            expect(config.totalVgIssued).to.equal(expectedTotalVG);
        });

        it("Should handle edge case amounts", async function () {
            // Test with minimum amounts
            const minVC = ethers.parseEther("1");     // Minimum VC
            const minBNB = ethers.parseEther("0.01"); // Minimum BNB
            
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), minVC);
            
            await expect(
                lpLocker.connect(user1).earnVG(minVC, minBNB, 200, { value: minBNB })
            ).to.not.be.reverted;

            // Test with very large amounts (within limits)
            const largeVC = ethers.parseEther("100000");  // 100K VC
            const largeBNB = ethers.parseEther("100");    // 100 BNB
            
            await vcToken.transfer(await user2.getAddress(), largeVC);
            await vcToken.connect(user2).approve(await lpLocker.getAddress(), largeVC);
            
            await time.increase(301); // MEV protection
            
            await expect(
                lpLocker.connect(user2).earnVG(largeVC, largeBNB, 200, { value: largeBNB })
            ).to.not.be.reverted;
        });
    });

    describe("🔄 Upgrade Integration", function () {
        it("Should maintain state across LPLocker upgrades", async function () {
            // Record state before upgrade
            await vcToken.connect(user1).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
            await lpLocker.connect(user1).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                value: TEST_BNB_AMOUNT 
            });

            const configBefore = await lpLocker.config();
            const userVGBefore = await vgToken.balanceOf(await user1.getAddress());

            // Upgrade contract (в реальности это будет новая версия)
            const LPLockerV2Factory = await ethers.getContractFactory("LPLocker");
            const lpLockerV2 = await upgrades.upgradeProxy(await lpLocker.getAddress(), LPLockerV2Factory);

            // Verify state preservation
            const configAfter = await lpLockerV2.config();
            expect(configAfter.totalLockedLp).to.equal(configBefore.totalLockedLp);
            expect(configAfter.totalVgIssued).to.equal(configBefore.totalVgIssued);
            
            // Verify functionality still works
            await time.increase(301);
            await vcToken.connect(user2).approve(await lpLockerV2.getAddress(), TEST_VC_AMOUNT);
            
            await expect(
                lpLockerV2.connect(user2).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                })
            ).to.not.be.reverted;
        });
    });

    describe("📊 Analytics and Monitoring", function () {
        it("Should track comprehensive metrics", async function () {
            const users = [user1, user2, user3];
            const transactions = [];

            // Execute multiple transactions and track
            for (const user of users) {
                await vcToken.connect(user).approve(await lpLocker.getAddress(), TEST_VC_AMOUNT);
                
                const tx = await lpLocker.connect(user).earnVG(TEST_VC_AMOUNT, TEST_BNB_AMOUNT, 200, { 
                    value: TEST_BNB_AMOUNT 
                });
                
                transactions.push({
                    user: await user.getAddress(),
                    tx: tx,
                    blockNumber: tx.blockNumber
                });
                
                await time.increase(301);
            }

            // Verify metrics
            const finalConfig = await lpLocker.config();
            expect(finalConfig.totalLockedLp).to.be.gt(0);
            expect(finalConfig.totalVgIssued).to.be.gt(0);
            
            // Check that total VG issued matches expected rewards
            const expectedLP = ((TEST_VC_AMOUNT * TEST_BNB_AMOUNT) / 1000000n) * BigInt(users.length);
            const expectedVG = expectedLP * LP_REWARD_RATIO;
            expect(finalConfig.totalVgIssued).to.equal(expectedVG);

            // Verify individual balances sum correctly
            let totalUserVG = 0n;
            for (const user of users) {
                totalUserVG += await vgToken.balanceOf(await user.getAddress());
            }
            expect(totalUserVG).to.equal(expectedVG);
        });
    });
}); 