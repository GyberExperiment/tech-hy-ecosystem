import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VCToken } from "../../typechain-types";

describe("VCToken", function () {
    let vcToken: VCToken;
    let owner: Signer;
    let authority: Signer;
    let user1: Signer;
    let user2: Signer;

    const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1B VC
    const INITIAL_SUPPLY = ethers.parseEther("100000000"); // 100M VC

    beforeEach(async function () {
        [owner, authority, user1, user2] = await ethers.getSigners();
        
        const VCTokenFactory = await ethers.getContractFactory("VCToken");
        vcToken = await VCTokenFactory.deploy(await owner.getAddress());
        await vcToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy with correct initial parameters", async function () {
            expect(await vcToken.name()).to.equal("Value Coin");
            expect(await vcToken.symbol()).to.equal("VC");
            expect(await vcToken.decimals()).to.equal(18);
            expect(await vcToken.totalSupply()).to.equal(INITIAL_SUPPLY);
            expect(await vcToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
            expect(await vcToken.owner()).to.equal(await owner.getAddress());
        });

        it("Should mint initial supply to owner", async function () {
            expect(await vcToken.balanceOf(await owner.getAddress())).to.equal(INITIAL_SUPPLY);
        });

        it("Should have remaining mintable supply", async function () {
            const remaining = await vcToken.remainingMintableSupply();
            expect(remaining).to.equal(MAX_SUPPLY - INITIAL_SUPPLY);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens with reason", async function () {
            const mintAmount = ethers.parseEther("1000");
            const reason = "Test minting";
            
            await expect(vcToken.mint(await user1.getAddress(), mintAmount, reason))
                .to.emit(vcToken, "TokensMinted")
                .withArgs(await user1.getAddress(), mintAmount, reason);

            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
            expect(await vcToken.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
        });

        it("Should allow owner to mint tokens without reason", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(vcToken.mintTo(await user1.getAddress(), mintAmount))
                .to.emit(vcToken, "TokensMinted")
                .withArgs(await user1.getAddress(), mintAmount, "Standard mint");

            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
        });

        it("Should revert if non-owner tries to mint", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(
                vcToken.connect(user1).mint(await user2.getAddress(), mintAmount, "Unauthorized")
            ).to.be.revertedWithCustomError(vcToken, "OwnableUnauthorizedAccount");
        });

        it("Should revert when minting to zero address", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(
                vcToken.mint(ethers.ZeroAddress, mintAmount, "Zero address")
            ).to.be.revertedWith("VCToken: mint to zero address");
        });

        it("Should revert when minting zero amount", async function () {
            await expect(
                vcToken.mint(await user1.getAddress(), 0, "Zero amount")
            ).to.be.revertedWith("VCToken: mint amount zero");
        });

        it("Should revert when exceeding max supply", async function () {
            const remainingSupply = await vcToken.remainingMintableSupply();
            const excessAmount = remainingSupply + 1n;
            
            await expect(
                vcToken.mint(await user1.getAddress(), excessAmount, "Excess mint")
            ).to.be.revertedWith("VCToken: exceeds max supply");
        });

        it("Should allow minting exactly to max supply", async function () {
            const remainingSupply = await vcToken.remainingMintableSupply();
            
            await vcToken.mint(await user1.getAddress(), remainingSupply, "Max supply mint");
            
            expect(await vcToken.totalSupply()).to.equal(MAX_SUPPLY);
            expect(await vcToken.remainingMintableSupply()).to.equal(0);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            // Transfer some tokens to user1 for burning tests
            const transferAmount = ethers.parseEther("5000");
            await vcToken.transfer(await user1.getAddress(), transferAmount);
        });

        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("1000");
            const initialBalance = await vcToken.balanceOf(await user1.getAddress());
            const initialSupply = await vcToken.totalSupply();
            
            await vcToken.connect(user1).burn(burnAmount);
            
            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(initialBalance - burnAmount);
            expect(await vcToken.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should revert when burning zero amount", async function () {
            await expect(
                vcToken.connect(user1).burn(0)
            ).to.be.revertedWith("VCToken: burn amount zero");
        });

        it("Should revert when burning more than balance", async function () {
            const userBalance = await vcToken.balanceOf(await user1.getAddress());
            const excessAmount = userBalance + 1n;
            
            await expect(
                vcToken.connect(user1).burn(excessAmount)
            ).to.be.revertedWithCustomError(vcToken, "ERC20InsufficientBalance");
        });
    });

    describe("Ownership", function () {
        it("Should transfer ownership correctly", async function () {
            await vcToken.transferOwnership(await authority.getAddress());
            
            expect(await vcToken.owner()).to.equal(await authority.getAddress());
        });

        it("Should allow new owner to mint", async function () {
            await vcToken.transferOwnership(await authority.getAddress());
            
            const mintAmount = ethers.parseEther("1000");
            await vcToken.connect(authority).mint(await user1.getAddress(), mintAmount, "New owner mint");
            
            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
        });
    });

    describe("Standard ERC20 functionality", function () {
        beforeEach(async function () {
            // Setup tokens for tests
            const transferAmount = ethers.parseEther("5000");
            await vcToken.transfer(await user1.getAddress(), transferAmount);
        });

        it("Should handle transfers correctly", async function () {
            const transferAmount = ethers.parseEther("1000");
            const initialUser1Balance = await vcToken.balanceOf(await user1.getAddress());
            const initialUser2Balance = await vcToken.balanceOf(await user2.getAddress());
            
            await vcToken.connect(user1).transfer(await user2.getAddress(), transferAmount);
            
            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(initialUser1Balance - transferAmount);
            expect(await vcToken.balanceOf(await user2.getAddress())).to.equal(initialUser2Balance + transferAmount);
        });

        it("Should handle allowances correctly", async function () {
            const allowanceAmount = ethers.parseEther("2000");
            
            await vcToken.connect(user1).approve(await user2.getAddress(), allowanceAmount);
            
            expect(await vcToken.allowance(await user1.getAddress(), await user2.getAddress())).to.equal(allowanceAmount);
        });

        it("Should handle transferFrom correctly", async function () {
            const allowanceAmount = ethers.parseEther("2000");
            const transferAmount = ethers.parseEther("1000");
            
            await vcToken.connect(user1).approve(await user2.getAddress(), allowanceAmount);
            
            const initialUser1Balance = await vcToken.balanceOf(await user1.getAddress());
            const initialOwnerBalance = await vcToken.balanceOf(await owner.getAddress());
            
            await vcToken.connect(user2).transferFrom(await user1.getAddress(), await owner.getAddress(), transferAmount);
            
            expect(await vcToken.balanceOf(await user1.getAddress())).to.equal(initialUser1Balance - transferAmount);
            expect(await vcToken.balanceOf(await owner.getAddress())).to.equal(initialOwnerBalance + transferAmount);
            expect(await vcToken.allowance(await user1.getAddress(), await user2.getAddress())).to.equal(allowanceAmount - transferAmount);
        });
    });
}); 