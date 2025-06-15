const { ethers } = require('hardhat');
const deployedContracts = require('../deployed-ecosystem.json');
const { log } = require('./logger');

async function main() {
  log.section('VG Token Ownership Fix');

  const [deployer] = await ethers.getSigners();
  log.info('Deployer address', { script: 'fix-vg-ownership', address: deployer.address });

  // Получаем адреса контрактов
  const CONTRACTS = {
    VG_TOKEN: deployedContracts.VG_TOKEN,
    LP_LOCKER: deployedContracts.LP_LOCKER_PROXY,
  };

  // Получаем контракты
  const VGToken = await ethers.getContractAt('VGToken', CONTRACTS.VG_TOKEN);

  log.section('Contract Addresses');
  log.info('VG Token', { script: 'fix-vg-ownership' }, CONTRACTS.VG_TOKEN);
  log.info('LP Locker', { script: 'fix-vg-ownership' }, CONTRACTS.LP_LOCKER);

  try {
    // 1. Проверяем текущий owner
    log.section('Current Status Check');
    const currentOwner = await VGToken.owner();
    log.info('Current VG Token owner', { script: 'fix-vg-ownership', contract: CONTRACTS.VG_TOKEN }, currentOwner);
    log.info('LP Locker address', { script: 'fix-vg-ownership' }, CONTRACTS.LP_LOCKER);
    
    const isLPLockerOwner = currentOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase();
    log.info('Is LPLocker already owner', { script: 'fix-vg-ownership' }, isLPLockerOwner);

    if (isLPLockerOwner) {
      log.success('LPLocker уже является owner VGToken', { script: 'fix-vg-ownership' });
      return;
    }

    // 2. Передаем ownership LPLocker контракту
    log.section('Ownership Transfer');
    log.info('Starting ownership transfer...', { script: 'fix-vg-ownership' });
    
    const tx = await VGToken.transferOwnership(CONTRACTS.LP_LOCKER);
    log.transaction('Transfer ownership transaction sent', tx.hash, {
      from: currentOwner,
      to: CONTRACTS.LP_LOCKER,
      contract: CONTRACTS.VG_TOKEN
    });
    
    log.info('Waiting for confirmation...', { script: 'fix-vg-ownership', txHash: tx.hash });
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      log.success('Ownership transfer completed!', { script: 'fix-vg-ownership', txHash: tx.hash });
      
      // 3. Проверяем новый owner
      const newOwner = await VGToken.owner();
      log.info('New VG Token owner', { script: 'fix-vg-ownership', contract: CONTRACTS.VG_TOKEN }, newOwner);
      
      const transferSuccessful = newOwner.toLowerCase() === CONTRACTS.LP_LOCKER.toLowerCase();
      log.info('Transfer verification', { script: 'fix-vg-ownership' }, transferSuccessful);
      
      if (transferSuccessful) {
        log.success('Ownership transfer verification passed!', { script: 'fix-vg-ownership' });
      } else {
        log.failure('Ownership transfer verification failed!', { script: 'fix-vg-ownership' });
      }
    } else {
      log.failure('Transaction failed', { script: 'fix-vg-ownership', txHash: tx.hash });
    }

  } catch (error) {
    log.failure('Script execution failed', { 
      script: 'fix-vg-ownership',
      function: 'main',
      errorMessage: error.message 
    }, error);
  }
}

main()
  .then(() => {
    log.separator();
    log.success('Script completed successfully', { script: 'fix-vg-ownership' });
    process.exit(0);
  })
  .catch((error) => {
    log.separator();
    log.failure('Script failed with critical error', { script: 'fix-vg-ownership' }, error);
    process.exit(1);
  }); 