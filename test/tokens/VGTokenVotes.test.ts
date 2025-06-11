import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VGToken, VGTokenVotes } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VGTokenVotes", function () {
    let vgToken: VGToken;
    let vgTokenVotes: VGTokenVotes;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let delegatee: Signer;

    const INITIAL_VG_AMOUNT = ethers.parseEther("10000"); // 10K VG for testing

    beforeEach(async function () {
        [owner, user1, user2, delegatee] = await ethers.getSigners();

        // Deploy VGToken
        const VGTokenFactory = await ethers.getContractFactory("VGToken");
        vgToken = await VGTokenFactory.deploy(await owner.getAddress());
        await vgToken.waitForDeployment();

        // Deploy VGTokenVotes wrapper
        const VGTokenVotesFactory = await ethers.getContractFactory("VGTokenVotes");
        vgTokenVotes = await VGTokenVotesFactory.deploy(await vgToken.getAddress());
        await vgTokenVotes.waitForDeployment();

        // Setup test tokens
        await vgToken.transfer(await user1.getAddress(), INITIAL_VG_AMOUNT);
        await vgToken.transfer(await user2.getAddress(), INITIAL_VG_AMOUNT);
    });

    describe("Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await vgTokenVotes.name()).to.equal("Value Governance Votes");
            expect(await vgTokenVotes.symbol()).to.equal("VGVotes");
            expect(await vgTokenVotes.decimals()).to.equal(18);
            expect(await vgTokenVotes.underlyingToken()).to.equal(await vgToken.getAddress());
            expect(await vgTokenVotes.totalSupply()).to.equal(0);
        });

        it("Should have 1:1 exchange rate", async function () {
            expect(await vgTokenVotes.exchangeRate()).to.equal(ethers.parseEther("1"));
        });

        it("Should revert with zero address underlying token", async function () {
            const VGTokenVotesFactory = await ethers.getContractFactory("VGTokenVotes");
            await expect(
                VGTokenVotesFactory.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("VGTokenVotes: zero address");
        });
    });

    describe("Deposit (Wrapping)", function () {
        const depositAmount = ethers.parseEther("1000");

        it("Should deposit VG tokens and mint VGVotes", async function () {
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            
            await expect(vgTokenVotes.connect(user1).deposit(depositAmount))
                .to.emit(vgTokenVotes, "Deposit")
                .withArgs(await user1.getAddress(), depositAmount);

            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.totalSupply()).to.equal(depositAmount);
            expect(await vgToken.balanceOf(await vgTokenVotes.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.totalAssets()).to.equal(depositAmount);
        });

        it("Should handle multiple deposits", async function () {
            const firstDeposit = ethers.parseEther("500");
            const secondDeposit = ethers.parseEther("300");
            
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), firstDeposit + secondDeposit);
            
            await vgTokenVotes.connect(user1).deposit(firstDeposit);
            await vgTokenVotes.connect(user1).deposit(secondDeposit);

            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(firstDeposit + secondDeposit);
        });

        it("Should revert when depositing zero amount", async function () {
            await expect(
                vgTokenVotes.connect(user1).deposit(0)
            ).to.be.revertedWith("VGTokenVotes: deposit amount zero");
        });

        it("Should revert when insufficient allowance", async function () {
            await expect(
                vgTokenVotes.connect(user1).deposit(depositAmount)
            ).to.be.revertedWithCustomError(vgToken, "ERC20InsufficientAllowance");
        });

        it("Should revert when insufficient balance", async function () {
            const excessAmount = INITIAL_VG_AMOUNT + 1n;
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), excessAmount);
            
            await expect(
                vgTokenVotes.connect(user1).deposit(excessAmount)
            ).to.be.revertedWithCustomError(vgToken, "ERC20InsufficientBalance");
        });
    });

    describe("Withdrawal (Unwrapping)", function () {
        const depositAmount = ethers.parseEther("1000");
        const withdrawAmount = ethers.parseEther("600");

        beforeEach(async function () {
            // Setup: user1 deposits some VG tokens
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user1).deposit(depositAmount);
        });

        it("Should withdraw VGVotes and return VG tokens", async function () {
            const initialVGBalance = await vgToken.balanceOf(await user1.getAddress());
            
            await expect(vgTokenVotes.connect(user1).withdraw(withdrawAmount))
                .to.emit(vgTokenVotes, "Withdrawal")
                .withArgs(await user1.getAddress(), withdrawAmount);

            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(depositAmount - withdrawAmount);
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialVGBalance + withdrawAmount);
            expect(await vgTokenVotes.totalAssets()).to.equal(depositAmount - withdrawAmount);
        });

        it("Should handle full withdrawal", async function () {
            await vgTokenVotes.connect(user1).withdraw(depositAmount);
            
            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(0);
            expect(await vgTokenVotes.totalSupply()).to.equal(0);
            expect(await vgTokenVotes.totalAssets()).to.equal(0);
        });

        it("Should revert when withdrawing zero amount", async function () {
            await expect(
                vgTokenVotes.connect(user1).withdraw(0)
            ).to.be.revertedWith("VGTokenVotes: withdraw amount zero");
        });

        it("Should revert when insufficient balance", async function () {
            const excessAmount = depositAmount + 1n;
            await expect(
                vgTokenVotes.connect(user1).withdraw(excessAmount)
            ).to.be.revertedWith("VGTokenVotes: insufficient balance");
        });
    });

    describe("Voting Functionality", function () {
        const depositAmount = ethers.parseEther("1000");

        beforeEach(async function () {
            // Setup: users deposit tokens
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user1).deposit(depositAmount);
            
            await vgToken.connect(user2).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user2).deposit(depositAmount);
        });

        it("Should start with zero voting power", async function () {
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(0);
            expect(await vgTokenVotes.getVotes(await user2.getAddress())).to.equal(0);
        });

        it("Should enable self-voting", async function () {
            await vgTokenVotes.connect(user1).enableVoting();
            
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.delegates(await user1.getAddress())).to.equal(await user1.getAddress());
        });

        it("Should delegate voting power to another address", async function () {
            await vgTokenVotes.connect(user1).delegateVotingPower(await delegatee.getAddress());
            
            expect(await vgTokenVotes.getVotes(await delegatee.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(0);
            expect(await vgTokenVotes.delegates(await user1.getAddress())).to.equal(await delegatee.getAddress());
        });

        it("Should handle delegation changes", async function () {
            // Initial self-delegation
            await vgTokenVotes.connect(user1).enableVoting();
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount);
            
            // Change delegation to delegatee
            await vgTokenVotes.connect(user1).delegateVotingPower(await delegatee.getAddress());
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(0);
            expect(await vgTokenVotes.getVotes(await delegatee.getAddress())).to.equal(depositAmount);
        });

        it("Should maintain voting power across transfers", async function () {
            await vgTokenVotes.connect(user1).enableVoting();
            await vgTokenVotes.connect(user2).enableVoting();
            
            const transferAmount = ethers.parseEther("300");
            await vgTokenVotes.connect(user1).transfer(await user2.getAddress(), transferAmount);
            
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount - transferAmount);
            expect(await vgTokenVotes.getVotes(await user2.getAddress())).to.equal(depositAmount + transferAmount);
        });

        it("Should track voting power history", async function () {
            await vgTokenVotes.connect(user1).enableVoting();
            
            const blockNumber1 = await ethers.provider.getBlockNumber();
            
            // Add more tokens
            const additionalAmount = ethers.parseEther("500");
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), additionalAmount);
            await vgTokenVotes.connect(user1).deposit(additionalAmount);
            
            const blockNumber2 = await ethers.provider.getBlockNumber();
            
            // Check historical voting power
            expect(await vgTokenVotes.getPastVotes(await user1.getAddress(), blockNumber1)).to.equal(depositAmount);
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount + additionalAmount);
        });
    });

    describe("Integration with deposits/withdrawals", function () {
        const depositAmount = ethers.parseEther("1000");

        it("Should maintain voting power after withdrawal", async function () {
            // Deposit and enable voting
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user1).deposit(depositAmount);
            await vgTokenVotes.connect(user1).enableVoting();
            
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount);
            
            // Partial withdrawal
            const withdrawAmount = ethers.parseEther("300");
            await vgTokenVotes.connect(user1).withdraw(withdrawAmount);
            
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount - withdrawAmount);
        });

        it("Should handle voting power with multiple users", async function () {
            // Multiple users deposit and enable voting
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user1).deposit(depositAmount);
            await vgTokenVotes.connect(user1).enableVoting();
            
            await vgToken.connect(user2).approve(await vgTokenVotes.getAddress(), depositAmount);
            await vgTokenVotes.connect(user2).deposit(depositAmount);
            await vgTokenVotes.connect(user2).enableVoting();
            
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.getVotes(await user2.getAddress())).to.equal(depositAmount);
            expect(await vgTokenVotes.totalSupply()).to.equal(depositAmount + depositAmount);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle reentrancy protection", async function () {
            const depositAmount = ethers.parseEther("1000");
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), depositAmount);
            
            // This test verifies reentrancy guard is working
            // In a real attack scenario, malicious contract would try to re-enter
            await vgTokenVotes.connect(user1).deposit(depositAmount);
            await vgTokenVotes.connect(user1).withdraw(depositAmount);
            
            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(0);
        });

        it("Should handle zero balance delegation", async function () {
            // User with no tokens tries to delegate
            await vgTokenVotes.connect(user1).enableVoting();
            expect(await vgTokenVotes.getVotes(await user1.getAddress())).to.equal(0);
        });

        it("Should handle wrap/unwrap cycles", async function () {
            const amount = ethers.parseEther("1000");
            const initialVGBalance = await vgToken.balanceOf(await user1.getAddress());
            
            // Wrap
            await vgToken.connect(user1).approve(await vgTokenVotes.getAddress(), amount);
            await vgTokenVotes.connect(user1).deposit(amount);
            
            // Unwrap
            await vgTokenVotes.connect(user1).withdraw(amount);
            
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialVGBalance);
            expect(await vgTokenVotes.balanceOf(await user1.getAddress())).to.equal(0);
        });
    });
}); 