import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { VGToken } from "../../typechain-types";

describe("VGToken", function () {
    let vgToken: VGToken;
    let owner: Signer;
    let authority: Signer;
    let user1: Signer;
    let user2: Signer;

    const MAX_SUPPLY = ethers.parseEther("100000000"); // 100M VG
    const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M VG

    beforeEach(async function () {
        [owner, authority, user1, user2] = await ethers.getSigners();
        
        const VGTokenFactory = await ethers.getContractFactory("VGToken");
        vgToken = await VGTokenFactory.deploy(await owner.getAddress());
        await vgToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy with correct initial parameters", async function () {
            expect(await vgToken.name()).to.equal("Value Governance");
            expect(await vgToken.symbol()).to.equal("VG");
            expect(await vgToken.decimals()).to.equal(18);
            expect(await vgToken.totalSupply()).to.equal(INITIAL_SUPPLY);
            expect(await vgToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
            expect(await vgToken.owner()).to.equal(await owner.getAddress());
        });

        it("Should mint initial supply to owner", async function () {
            expect(await vgToken.balanceOf(await owner.getAddress())).to.equal(INITIAL_SUPPLY);
        });

        it("Should return correct _OWNER_", async function () {
            expect(await vgToken._OWNER_()).to.equal(await owner.getAddress());
        });

        it("Should have remaining mintable supply", async function () {
            const remaining = await vgToken.remainingMintableSupply();
            expect(remaining).to.equal(MAX_SUPPLY - INITIAL_SUPPLY);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens with reason", async function () {
            const mintAmount = ethers.parseEther("1000");
            const reason = "Test minting";
            
            await expect(vgToken.mint(await user1.getAddress(), mintAmount, reason))
                .to.emit(vgToken, "TokensMinted")
                .withArgs(await user1.getAddress(), mintAmount, reason);

            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
            expect(await vgToken.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
        });

        it("Should allow owner to mint tokens without reason", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(vgToken.mintTo(await user1.getAddress(), mintAmount))
                .to.emit(vgToken, "TokensMinted")
                .withArgs(await user1.getAddress(), mintAmount, "Standard mint");

            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
        });

        it("Should revert if non-owner tries to mint", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(
                vgToken.connect(user1).mint(await user2.getAddress(), mintAmount, "Unauthorized")
            ).to.be.revertedWithCustomError(vgToken, "OwnableUnauthorizedAccount");
        });

        it("Should revert when minting to zero address", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(
                vgToken.mint(ethers.ZeroAddress, mintAmount, "Zero address")
            ).to.be.revertedWith("VGToken: mint to zero address");
        });

        it("Should revert when minting zero amount", async function () {
            await expect(
                vgToken.mint(await user1.getAddress(), 0, "Zero amount")
            ).to.be.revertedWith("VGToken: mint amount zero");
        });

        it("Should revert when exceeding max supply", async function () {
            const remainingSupply = await vgToken.remainingMintableSupply();
            const excessAmount = remainingSupply + 1n;
            
            await expect(
                vgToken.mint(await user1.getAddress(), excessAmount, "Excess mint")
            ).to.be.revertedWith("VGToken: exceeds max supply");
        });

        it("Should allow minting exactly to max supply", async function () {
            const remainingSupply = await vgToken.remainingMintableSupply();
            
            await vgToken.mint(await user1.getAddress(), remainingSupply, "Max supply mint");
            
            expect(await vgToken.totalSupply()).to.equal(MAX_SUPPLY);
            expect(await vgToken.remainingMintableSupply()).to.equal(0);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            // Transfer some tokens to user1 for burning tests
            const transferAmount = ethers.parseEther("5000");
            await vgToken.transfer(await user1.getAddress(), transferAmount);
        });

        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("1000");
            const initialBalance = await vgToken.balanceOf(await user1.getAddress());
            const initialSupply = await vgToken.totalSupply();
            
            await vgToken.connect(user1).burn(burnAmount);
            
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialBalance - burnAmount);
            expect(await vgToken.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should revert when burning zero amount", async function () {
            await expect(
                vgToken.connect(user1).burn(0)
            ).to.be.revertedWith("VGToken: burn amount zero");
        });

        it("Should revert when burning more than balance", async function () {
            const userBalance = await vgToken.balanceOf(await user1.getAddress());
            const excessAmount = userBalance + 1n;
            
            await expect(
                vgToken.connect(user1).burn(excessAmount)
            ).to.be.revertedWithCustomError(vgToken, "ERC20InsufficientBalance");
        });
    });

    describe("Ownership", function () {
        it("Should transfer ownership correctly", async function () {
            await vgToken.transferOwnership(await authority.getAddress());
            
            expect(await vgToken.owner()).to.equal(await authority.getAddress());
            expect(await vgToken._OWNER_()).to.equal(await authority.getAddress());
        });

        it("Should update _OWNER_ when ownership changes", async function () {
            const initialOwner = await vgToken._OWNER_();
            expect(initialOwner).to.equal(await owner.getAddress());
            
            await vgToken.transferOwnership(await authority.getAddress());
            
            const newOwner = await vgToken._OWNER_();
            expect(newOwner).to.equal(await authority.getAddress());
            expect(newOwner).to.not.equal(initialOwner);
        });

        it("Should allow new owner to mint", async function () {
            await vgToken.transferOwnership(await authority.getAddress());
            
            const mintAmount = ethers.parseEther("1000");
            await vgToken.connect(authority).mint(await user1.getAddress(), mintAmount, "New owner mint");
            
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(mintAmount);
        });
    });

    describe("Standard ERC20 functionality", function () {
        beforeEach(async function () {
            // Setup tokens for tests
            const transferAmount = ethers.parseEther("5000");
            await vgToken.transfer(await user1.getAddress(), transferAmount);
        });

        it("Should handle transfers correctly", async function () {
            const transferAmount = ethers.parseEther("1000");
            const initialUser1Balance = await vgToken.balanceOf(await user1.getAddress());
            const initialUser2Balance = await vgToken.balanceOf(await user2.getAddress());
            
            await vgToken.connect(user1).transfer(await user2.getAddress(), transferAmount);
            
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialUser1Balance - transferAmount);
            expect(await vgToken.balanceOf(await user2.getAddress())).to.equal(initialUser2Balance + transferAmount);
        });

        it("Should handle allowances correctly", async function () {
            const allowanceAmount = ethers.parseEther("2000");
            
            await vgToken.connect(user1).approve(await user2.getAddress(), allowanceAmount);
            
            expect(await vgToken.allowance(await user1.getAddress(), await user2.getAddress())).to.equal(allowanceAmount);
        });

        it("Should handle transferFrom correctly", async function () {
            const allowanceAmount = ethers.parseEther("2000");
            const transferAmount = ethers.parseEther("1000");
            
            await vgToken.connect(user1).approve(await user2.getAddress(), allowanceAmount);
            
            const initialUser1Balance = await vgToken.balanceOf(await user1.getAddress());
            const initialOwnerBalance = await vgToken.balanceOf(await owner.getAddress());
            
            await vgToken.connect(user2).transferFrom(await user1.getAddress(), await owner.getAddress(), transferAmount);
            
            expect(await vgToken.balanceOf(await user1.getAddress())).to.equal(initialUser1Balance - transferAmount);
            expect(await vgToken.balanceOf(await owner.getAddress())).to.equal(initialOwnerBalance + transferAmount);
            expect(await vgToken.allowance(await user1.getAddress(), await user2.getAddress())).to.equal(allowanceAmount - transferAmount);
        });
    });
}); 