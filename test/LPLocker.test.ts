import { ethers, upgrades, network } from "hardhat";
import { expect } from "chai";
import { Signer, Contract } from "ethers";
import { ERC20, LPLocker } from "../typechain-types";

describe("LPLocker", () => {
  let owner: Signer;
  let authority: Signer;
  let user: Signer;
  let lpLocker: LPLocker;
  let vgToken: ERC20;
  let vcToken: ERC20;
  let lpToken: ERC20;
  let pancakeRouter: Contract;
  
  const MIN_BNB = ethers.parseEther("0.01");
  const MIN_VC = ethers.parseUnits("1", 18);
  const LP_DIVISOR = 10n ** 6n;
  
  beforeEach(async () => {
    [owner, authority, user] = await ethers.getSigners();

    // Деплой мок-токенов
    const ERC20 = await ethers.getContractFactory("MockERC20");
    vgToken = await ERC20.deploy("VG Token", "VG");
    vcToken = await ERC20.deploy("VC Token", "VC");
    lpToken = await ERC20.deploy("LP Token", "LP");

    // Деплой мок-роутера PancakeSwap
    const PancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
    pancakeRouter = await PancakeRouter.deploy();

    // Подготовка конфигурации
    const initConfig = {
      vgTokenAddress: await vgToken.getAddress(),
      vcTokenAddress: await vcToken.getAddress(),
      pancakeRouter: await pancakeRouter.getAddress(),
      lpTokenAddress: await lpToken.getAddress(),
      stakingVaultAddress: await owner.getAddress(),
      lpDivisor: LP_DIVISOR,
      lpToVgRatio: 10,
      minBnbAmount: MIN_BNB,
      minVcAmount: MIN_VC,
      maxSlippageBps: 1000, // 10%
      defaultSlippageBps: 200, // 2%
      mevProtectionEnabled: true,
      minTimeBetweenTxs: 60,
      maxTxPerUserPerBlock: 1  // Изменено с 3 на 1 для корректной работы MEV protection теста
    };

    // Деплой LPLocker через прокси
    const LPLocker = await ethers.getContractFactory("LPLocker");
    lpLocker = await upgrades.deployProxy(
      LPLocker, 
      [initConfig],
      { 
        initializer: "initialize"
      }
    );
  });

  describe("Инициализация", () => {
    it("Устанавливает правильные параметры конфигурации", async () => {
      const config = await lpLocker.config();
      expect(config.authority).to.eq(await owner.getAddress());
      expect(config.vgTokenAddress).to.eq(await vgToken.getAddress());
      expect(config.vcTokenAddress).to.eq(await vcToken.getAddress());
      expect(config.pancakeRouter).to.eq(await pancakeRouter.getAddress());
      expect(config.lpTokenAddress).to.eq(await lpToken.getAddress());
      expect(config.stakingVaultAddress).to.eq(await owner.getAddress());
      expect(config.lpDivisor).to.eq(LP_DIVISOR);
      expect(config.lpToVgRatio).to.eq(10);
      expect(config.minBnbAmount).to.eq(MIN_BNB);
      expect(config.minVcAmount).to.eq(MIN_VC);
      expect(config.maxSlippageBps).to.eq(1000);
      expect(config.defaultSlippageBps).to.eq(200);
      expect(config.mevProtectionEnabled).to.be.true;
      expect(config.minTimeBetweenTxs).to.eq(60);
      expect(config.maxTxPerUserPerBlock).to.eq(1);
    });

    it("Блокирует повторную инициализацию", async () => {
      const initConfig = {
        vgTokenAddress: await vgToken.getAddress(),
        vcTokenAddress: await vcToken.getAddress(),
        pancakeRouter: await pancakeRouter.getAddress(),
        lpTokenAddress: await lpToken.getAddress(),
        stakingVaultAddress: await owner.getAddress(),
        lpDivisor: LP_DIVISOR,
        lpToVgRatio: 10,
        minBnbAmount: MIN_BNB,
        minVcAmount: MIN_VC,
        maxSlippageBps: 1000,
        defaultSlippageBps: 200,
        mevProtectionEnabled: true,
        minTimeBetweenTxs: 60,
        maxTxPerUserPerBlock: 1
      };
      await expect(
        lpLocker.initialize(initConfig)
      ).to.be.revertedWithCustomError(lpLocker, "InvalidInitialization");
    });
  });

  describe("earnVG", () => {
    const VC_AMOUNT = MIN_VC * 100n;
    const BNB_AMOUNT = MIN_BNB * 10n;
    const EXPECTED_LP = (VC_AMOUNT * BNB_AMOUNT) / LP_DIVISOR;
    const VG_REWARD = EXPECTED_LP * 10n;

    beforeEach(async () => {
      // Настройка моков
      await vcToken.mint(await user.getAddress(), VC_AMOUNT * 10n);
      await vcToken.connect(user).approve(await lpLocker.getAddress(), VC_AMOUNT * 10n);
      
      // Подготовка VG токенов
      await vgToken.mint(await owner.getAddress(), VG_REWARD * 1000n);
      await vgToken.connect(owner).approve(await lpLocker.getAddress(), VG_REWARD * 100n);
      
      // ✅ ВАЖНО: Депонируем VG токены в контракт для выдачи наград
      await lpLocker.depositVGTokens(VG_REWARD * 50n);

      await pancakeRouter.setAddLiquidityResult(0, 0, EXPECTED_LP);
    });

    it("Успешно создает LP и выдает VG", async () => {
      const tx = await lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 200, { value: BNB_AMOUNT });
      await expect(tx)
        .to.emit(lpLocker, "VGTokensEarned")
        .withArgs(
          await user.getAddress(),
          EXPECTED_LP,
          VG_REWARD,
          BNB_AMOUNT,
          VC_AMOUNT,
          (await ethers.provider.getBlock(tx.blockNumber!)).timestamp
        );

      expect(await vgToken.balanceOf(await user.getAddress())).to.eq(VG_REWARD);
      expect(await (await lpLocker.config()).totalLockedLp).to.eq(EXPECTED_LP);
      expect(await (await lpLocker.config()).totalVgIssued).to.eq(VG_REWARD);
    });

    it("Блокирует недостаточное количество BNB", async () => {
      const insufficientBnb = MIN_BNB - 1n;
      await expect(
        lpLocker.connect(user).earnVG(VC_AMOUNT, insufficientBnb, 200, { value: insufficientBnb })
      ).to.be.revertedWith("BNB amount too low");
    });

    it("Блокирует недостаточное количество VC", async () => {
      const insufficientVc = MIN_VC - 1n;
      await expect(
        lpLocker.connect(user).earnVG(insufficientVc, BNB_AMOUNT, 200, { value: BNB_AMOUNT })
      ).to.be.revertedWith("VC amount too low");
    });

    it("Блокирует высокий slippage", async () => {
      await expect(
        lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 1001, { value: BNB_AMOUNT })
      ).to.be.revertedWith("Slippage too high");
    });

    it("Блокирует несоответствие переданного BNB", async () => {
      await expect(
        lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 200, { value: BNB_AMOUNT - 1n })
      ).to.be.revertedWith("BNB amount mismatch");
    });

    it("Блокирует если slippage превышен", async () => {
      // Устанавливаем результат PancakeRouter так чтобы LP было намного меньше ожидаемого
      const vcAmountSmall = VC_AMOUNT / 10n; // Используем меньшее количество VC
      const lowLiquidity = 1n; // Очень мало LP
      
      await pancakeRouter.setAddLiquidityResult(vcAmountSmall, BNB_AMOUNT, lowLiquidity);
      
      await vcToken.mint(await user.getAddress(), vcAmountSmall);
      await vcToken.connect(user).approve(await lpLocker.getAddress(), vcAmountSmall);
      
      // Низкий slippage (2%) при очень низком LP должен вызвать ошибку
      await expect(
        lpLocker.connect(user).earnVG(vcAmountSmall, BNB_AMOUNT, 200, { value: BNB_AMOUNT })
      ).to.be.revertedWith("Slippage exceeded");
    });

    it("Применяет MEV защиту", async () => {
      // Проверяем что MEV защита включена и настроена правильно
      const config = await lpLocker.config();
      expect(config.mevProtectionEnabled).to.be.true;
      expect(config.maxTxPerUserPerBlock).to.equal(1); // Должно быть 1 для блокировки второй транзакции
      
      // Первая транзакция должна пройти
      await lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 200, { value: BNB_AMOUNT });
      
      // Вторая транзакция срабатывает time-based защита (т.к. timestamp не изменился)
      await expect(
        lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 200, { value: BNB_AMOUNT })
      ).to.be.revertedWith("Too frequent transactions");

      // После майнинга нового блока и продвижения времени транзакция должна пройти
      await network.provider.send("evm_increaseTime", [61]); // Увеличиваем время на 61 секунду
      await network.provider.send("evm_mine");
      await expect(
        lpLocker.connect(user).earnVG(VC_AMOUNT, BNB_AMOUNT, 200, { value: BNB_AMOUNT })
      ).to.not.be.reverted;
    });
  });

  describe("lockLPTokens", () => {
    const LP_AMOUNT = ethers.parseEther("10");
    const VG_REWARD = LP_AMOUNT * 10n; // 10 VG за 1 LP (lpToVgRatio = 10)

    beforeEach(async () => {
      // Подготовка LP токенов для пользователя
      await lpToken.mint(await user.getAddress(), LP_AMOUNT * 10n);
      await lpToken.connect(user).approve(await lpLocker.getAddress(), LP_AMOUNT * 10n);
      
      // Подготовка VG токенов в vault
      await vgToken.mint(await owner.getAddress(), VG_REWARD * 1000n);
      await vgToken.connect(owner).approve(await lpLocker.getAddress(), VG_REWARD * 100n);
      
      // ✅ ВАЖНО: Депонируем VG токены в контракт для выдачи наград
      await lpLocker.depositVGTokens(VG_REWARD * 50n);
    });

    it("Успешно блокирует LP токены и выдает VG награды", async () => {
      const initialLpBalance = await lpToken.balanceOf(await user.getAddress());
      const initialVgBalance = await vgToken.balanceOf(await user.getAddress());
      
      const tx = await lpLocker.connect(user).lockLPTokens(LP_AMOUNT);
      
      await expect(tx)
        .to.emit(lpLocker, "LPTokensLocked")
        .withArgs(
          await user.getAddress(),
          LP_AMOUNT,
          VG_REWARD,
          (await ethers.provider.getBlock(tx.blockNumber!)).timestamp
        );

      // Проверяем что LP токены переведены к контракту
      expect(await lpToken.balanceOf(await user.getAddress())).to.eq(initialLpBalance - LP_AMOUNT);
      expect(await lpToken.balanceOf(await lpLocker.getAddress())).to.eq(LP_AMOUNT);
      
      // Проверяем что пользователь получил VG награды
      expect(await vgToken.balanceOf(await user.getAddress())).to.eq(initialVgBalance + VG_REWARD);
      
      // Проверяем обновление статистики
      const config = await lpLocker.config();
      expect(config.totalLockedLp).to.eq(LP_AMOUNT);
      expect(config.totalVgIssued).to.eq(VG_REWARD);
    });

    it("Блокирует нулевое количество LP токенов", async () => {
      await expect(
        lpLocker.connect(user).lockLPTokens(0)
      ).to.be.revertedWith("LP amount must be positive");
    });

    it("Блокирует если недостаточно LP токенов у пользователя", async () => {
      const excessiveAmount = LP_AMOUNT * 20n;
      await expect(
        lpLocker.connect(user).lockLPTokens(excessiveAmount)
      ).to.be.revertedWith("Insufficient LP balance");
    });

    it("Блокирует если недостаточно allowance для LP токенов", async () => {
      await lpToken.connect(user).approve(await lpLocker.getAddress(), LP_AMOUNT - 1n);
      await expect(
        lpLocker.connect(user).lockLPTokens(LP_AMOUNT)
      ).to.be.revertedWith("Insufficient LP allowance");
    });

    it("Блокирует если недостаточно VG токенов в vault", async () => {
      // Используем огромное количество LP токенов чтобы превысить доступные VG
      const hugeLpAmount = ethers.parseEther("100000"); // 100K LP
      
      // Подготавливаем огромные LP токены для пользователя
      await lpToken.mint(await user.getAddress(), hugeLpAmount);
      await lpToken.connect(user).approve(await lpLocker.getAddress(), hugeLpAmount);
      
      await expect(
        lpLocker.connect(user).lockLPTokens(hugeLpAmount)
      ).to.be.revertedWith("Insufficient VG tokens in contract");
    });

    it("Применяет MEV защиту", async () => {
      // Первая транзакция должна пройти
      await lpLocker.connect(user).lockLPTokens(LP_AMOUNT);
      
      // Вторая транзакция срабатывает time-based защита
      await expect(
        lpLocker.connect(user).lockLPTokens(LP_AMOUNT)
      ).to.be.revertedWith("Too frequent transactions");

      // После продвижения времени транзакция должна пройти
      await network.provider.send("evm_increaseTime", [61]);
      await network.provider.send("evm_mine");
      await expect(
        lpLocker.connect(user).lockLPTokens(LP_AMOUNT)
      ).to.not.be.reverted;
    });

    it("Корректно обновляет статистику при множественных блокировках", async () => {
      // Первая блокировка
      await lpLocker.connect(user).lockLPTokens(LP_AMOUNT);
      
      let config = await lpLocker.config();
      expect(config.totalLockedLp).to.eq(LP_AMOUNT);
      expect(config.totalVgIssued).to.eq(VG_REWARD);
      
      // Продвигаем время для MEV защиты
      await network.provider.send("evm_increaseTime", [61]);
      await network.provider.send("evm_mine");
      
      // Вторая блокировка
      await lpLocker.connect(user).lockLPTokens(LP_AMOUNT);
      
      config = await lpLocker.config();
      expect(config.totalLockedLp).to.eq(LP_AMOUNT * 2n);
      expect(config.totalVgIssued).to.eq(VG_REWARD * 2n);
    });

    it("Работает с разными соотношениями LP к VG", async () => {
      // Изменяем соотношение на 15:1
      await lpLocker.updateRates(15, LP_DIVISOR);
      
      const newVgReward = LP_AMOUNT * 15n;
      
      const tx = await lpLocker.connect(user).lockLPTokens(LP_AMOUNT);
      
      await expect(tx)
        .to.emit(lpLocker, "LPTokensLocked")
        .withArgs(
          await user.getAddress(),
          LP_AMOUNT,
          newVgReward,
          (await ethers.provider.getBlock(tx.blockNumber!)).timestamp
        );
        
      expect(await vgToken.balanceOf(await user.getAddress())).to.eq(newVgReward);
    });
  });

  describe("depositVGTokens", () => {
    const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 18);

    beforeEach(async () => {
      await vgToken.mint(await owner.getAddress(), DEPOSIT_AMOUNT * 3n);
      await vgToken.connect(owner).approve(await lpLocker.getAddress(), DEPOSIT_AMOUNT * 3n);
    });

    it("Позволяет authority вносить VG", async () => {
      const tx = await lpLocker.depositVGTokens(DEPOSIT_AMOUNT);
      await expect(tx)
        .to.emit(lpLocker, "VGTokensDeposited")
        .withArgs(
          await owner.getAddress(),
          DEPOSIT_AMOUNT,
          DEPOSIT_AMOUNT,
          (await ethers.provider.getBlock(tx.blockNumber!)).timestamp
        );

      expect(await vgToken.balanceOf(await lpLocker.getAddress())).to.eq(DEPOSIT_AMOUNT);
      expect(await (await lpLocker.config()).totalVgDeposited).to.eq(DEPOSIT_AMOUNT);
    });

    it("Блокирует вызов не-authority", async () => {
      await expect(
        lpLocker.connect(user).depositVGTokens(DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Only authority");
    });

    it("Обновляет totalVgDeposited при повторном депозите", async () => {
      await lpLocker.depositVGTokens(DEPOSIT_AMOUNT);
      await lpLocker.depositVGTokens(DEPOSIT_AMOUNT);
      expect(await (await lpLocker.config()).totalVgDeposited).to.eq(DEPOSIT_AMOUNT * 2n);
    });
  });

  describe("Обновление конфигурации", () => {
    it("Обновляет коэффициенты", async () => {
      await lpLocker.updateRates(15, 500000);
      const config = await lpLocker.config();
      expect(config.lpToVgRatio).to.eq(15);
      expect(config.lpDivisor).to.eq(500000n);
    });

    it("Обновляет Pancake конфигурацию", async () => {
      // Деплоим mock контракт для router'а вместо случайного адреса
      const MockRouter = await ethers.getContractFactory("MockPancakeRouter");
      const mockRouter = await MockRouter.deploy();
      await mockRouter.waitForDeployment();
      
      const newLpToken = ethers.Wallet.createRandom().address;
      
      await lpLocker.updatePancakeConfig(await mockRouter.getAddress(), newLpToken);
      const config = await lpLocker.config();
      expect(config.pancakeRouter).to.eq(await mockRouter.getAddress());
      expect(config.lpTokenAddress).to.eq(newLpToken);
    });

    it("Обновляет MEV настройки", async () => {
      await lpLocker.updateMevProtection(false, 120, 5);
      const config = await lpLocker.config();
      expect(config.mevProtectionEnabled).to.be.false;
      expect(config.minTimeBetweenTxs).to.eq(120);
      expect(config.maxTxPerUserPerBlock).to.eq(5);
    });

    it("Блокирует вызов не-authority для updateRates", async () => {
      await expect(
        lpLocker.connect(user).updateRates(15, 500000)
      ).to.be.revertedWith("Only authority");
    });

    it("Блокирует вызов не-authority для updatePancakeConfig", async () => {
      await expect(
        lpLocker.connect(user).updatePancakeConfig(
          ethers.Wallet.createRandom().address,
          ethers.Wallet.createRandom().address
        )
      ).to.be.revertedWith("Only authority");
    });

    it("Блокирует вызов не-authority для updateMevProtection", async () => {
      await expect(
        lpLocker.connect(user).updateMevProtection(false, 120, 5)
      ).to.be.revertedWith("Only authority");
    });
  });

  describe("Дополнительные функции", () => {
    it("Передача прав authority", async () => {
      await lpLocker.transferAuthority(await user.getAddress());
      expect((await lpLocker.config()).authority).to.eq(await user.getAddress());
      
      // Проверяем что новый authority может вызывать функции
      await vgToken.mint(await user.getAddress(), MIN_VC);
      await vgToken.connect(user).approve(await lpLocker.getAddress(), MIN_VC);
      await expect(
        lpLocker.connect(user).depositVGTokens(MIN_VC)
      ).to.emit(lpLocker, "VGTokensDeposited");
    });

    it("Блокирует передачу authority на нулевой адрес", async () => {
      await expect(
        lpLocker.transferAuthority(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Блокирует передачу authority без прав", async () => {
      await expect(
        lpLocker.connect(user).transferAuthority(await user.getAddress())
      ).to.be.revertedWith("Only authority");
    });

    it("Возвращает информацию о пуле", async () => {
      const [locked, issued, deposited, available] = await lpLocker.getPoolInfo();
      expect(locked).to.eq(0);
      expect(issued).to.eq(0);
      expect(deposited).to.eq(0);
      expect(available).to.eq(0);
    });

    describe("Апгрейд контракта", () => {
      it("Должен обновить реализацию контракта", async () => {
        // Сохраняем текущее состояние контракта
        const initialConfig = await lpLocker.config();
        const initialTotalLockedLp = initialConfig.totalLockedLp;
        
        // Деплоим новую версию контракта
        const LPLockerV2 = await ethers.getContractFactory("LPLocker");
        
        // Апгрейд прокси
        const upgraded = await upgrades.upgradeProxy(
          await lpLocker.getAddress(), 
          LPLockerV2
        );
        
        // Проверяем что состояние сохранилось
        const newConfig = await upgraded.config();
        expect(newConfig.authority).to.equal(initialConfig.authority);
        expect(newConfig.lpToVgRatio).to.equal(initialConfig.lpToVgRatio);
        expect(newConfig.totalLockedLp).to.equal(initialTotalLockedLp);
        
        // Проверяем работу существующих функций
        const poolInfo = await upgraded.getPoolInfo();
        expect(poolInfo[0]).to.equal(initialTotalLockedLp);
        
        // Проверяем что можем изменять состояние
        const newRatio = 15;
        await upgraded.updateRates(newRatio, initialConfig.lpDivisor);
        const updatedConfig = await upgraded.config();
        expect(updatedConfig.lpToVgRatio).to.equal(newRatio);
      });

      it("Блокирует апгрейд не-владельцем", async () => {
        const LPLockerV2 = await ethers.getContractFactory("LPLocker");
        await expect(
          upgrades.upgradeProxy(
            await lpLocker.getAddress(),
            LPLockerV2.connect(user)
          )
        ).to.be.reverted;
      });
    });
  });
});