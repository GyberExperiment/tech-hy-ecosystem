import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

interface TestResult {
  testFile: string;
  description: string;
  passed: number;
  failed: number;
  duration: number;
  status: 'passed' | 'failed' | 'error';
  errorMessage?: string;
}

interface TestSuite {
  name: string;
  files: string[];
  description: string;
  critical: boolean;
}

/**
 * VCSale Test Runner - Comprehensive Test Suite for Production Readiness
 * 
 * This runner executes all VCSale tests in sequence and generates detailed reports
 * for contract and frontend testing coverage.
 */
class VCSaleTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: "Core Contract Tests",
      files: ["test/VCSaleContract.test.ts"],
      description: "Basic contract functionality and initialization",
      critical: true
    },
    {
      name: "Comprehensive Contract Tests", 
      files: ["test/VCSaleContract.comprehensive.test.ts"],
      description: "Edge cases, security mechanisms, and advanced scenarios",
      critical: true
    },
    {
      name: "Widget Component Tests",
      files: ["frontend/src/widgets/VCSaleWidget/__tests__/VCSaleWidget.comprehensive.test.tsx"],
      description: "Frontend widget functionality and user interactions",
      critical: true
    },
    {
      name: "Integration Tests",
      files: ["test/integration/VCSale.integration.test.ts"],
      description: "End-to-end frontend to contract integration",
      critical: true
    },
    {
      name: "E2E Production Tests",
      files: ["test/e2e/VCSale.e2e.test.ts"],
      description: "Real-world user scenarios and production simulations",
      critical: false
    },
    {
      name: "Performance Tests",
      files: ["test/performance/VCSale.performance.test.ts"],
      description: "Gas optimization, throughput, and scalability",
      critical: false
    },
    {
      name: "Security Stress Tests",
      files: ["test/security/VCSale.security.test.ts"],
      description: "Attack vectors and security mechanism testing",
      critical: true
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log("🚀 VCSale Comprehensive Test Suite");
    console.log("==================================");
    console.log(`Running ${this.testSuites.length} test suites...`);
    console.log();

    this.startTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    await this.generateReport();
  }

  async runCriticalTests(): Promise<void> {
    console.log("⚠️  VCSale Critical Test Suite");
    console.log("=============================");
    
    const criticalSuites = this.testSuites.filter(suite => suite.critical);
    console.log(`Running ${criticalSuites.length} critical test suites...`);
    console.log();

    this.startTime = Date.now();

    for (const suite of criticalSuites) {
      await this.runTestSuite(suite);
    }

    await this.generateReport();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📦 ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   ${suite.critical ? '🔴 CRITICAL' : '🟡 Optional'}`);
    console.log();

    for (const testFile of suite.files) {
      await this.runTestFile(testFile, suite.name);
    }
  }

  private async runTestFile(testFile: string, suiteName: string): Promise<void> {
    const startTime = Date.now();
    const result: TestResult = {
      testFile,
      description: suiteName,
      passed: 0,
      failed: 0,
      duration: 0,
      status: 'passed'
    };

    try {
      console.log(`   🧪 Running ${path.basename(testFile)}...`);
      
      // Determine test command based on file type
      const isHardhatTest = testFile.startsWith('test/') && testFile.endsWith('.ts');
      const isVitestTest = testFile.includes('frontend/') && testFile.endsWith('.tsx');
      
      let command: string;
      
      if (isHardhatTest) {
        command = `npx hardhat test ${testFile}`;
      } else if (isVitestTest) {
        // For vitest, use path relative to frontend directory
        const relativePath = testFile.replace('frontend/', '');
        command = `cd frontend && npm run test ${relativePath}`;
      } else {
        throw new Error(`Unknown test type for file: ${testFile}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large test outputs
      });

      // Parse test output for results
      const output = stdout + stderr;
      result.passed = this.parseTestCount(output, 'passed');
      result.failed = this.parseTestCount(output, 'failed');
      
      if (result.failed > 0) {
        result.status = 'failed';
      }

      console.log(`   ✅ ${result.passed} passed, ${result.failed} failed`);

    } catch (error: any) {
      result.status = 'error';
      result.errorMessage = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);
    
    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log();
  }

  private parseTestCount(output: string, type: 'passed' | 'failed'): number {
    // Parse different test output formats
    const patterns = [
      // Hardhat/Mocha format
      new RegExp(`(\\d+) ${type}`, 'i'),
      // Vitest format
      new RegExp(`${type}: (\\d+)`, 'i'),
      // Jest format
      new RegExp(`Tests:\\s+\\d+ failed,\\s+(\\d+) passed` ),
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // Fallback: count occurrences of test result indicators
    const indicators = {
      passed: ['✓', '✅', 'PASS', 'OK'],
      failed: ['✗', '❌', 'FAIL', 'ERROR']
    };

    const count = indicators[type].reduce((total, indicator) => {
      const matches = output.match(new RegExp(indicator, 'g'));
      return total + (matches ? matches.length : 0);
    }, 0);

    return count;
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const criticalResults = this.results.filter(r => 
      this.testSuites.find(s => s.files.includes(r.testFile))?.critical
    );
    const criticalFailed = criticalResults.reduce((sum, r) => sum + r.failed, 0);

    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=======================");
    console.log();
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`🧪 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    console.log();

    // Detailed results by test suite
    console.log("📋 DETAILED RESULTS");
    console.log("===================");
    
    for (const suite of this.testSuites) {
      const suiteResults = this.results.filter(r => suite.files.includes(r.testFile));
      const suitePassed = suiteResults.reduce((sum, r) => sum + r.passed, 0);
      const suiteFailed = suiteResults.reduce((sum, r) => sum + r.failed, 0);
      const suiteStatus = suiteFailed === 0 ? '✅ PASS' : '❌ FAIL';
      const suiteIcon = suite.critical ? '🔴' : '🟡';
      
      console.log(`${suiteIcon} ${suite.name}: ${suiteStatus}`);
      console.log(`   Tests: ${suitePassed + suiteFailed} (${suitePassed} passed, ${suiteFailed} failed)`);
      
      if (suiteFailed > 0) {
        for (const result of suiteResults.filter(r => r.failed > 0 || r.status === 'error')) {
          console.log(`   ❌ ${path.basename(result.testFile)}: ${result.failed} failed`);
          if (result.errorMessage) {
            console.log(`      Error: ${result.errorMessage.substring(0, 100)}...`);
          }
        }
      }
      console.log();
    }

    // Production readiness assessment
    console.log("🏭 PRODUCTION READINESS ASSESSMENT");
    console.log("===================================");
    
    if (criticalFailed === 0 && successRate >= 95) {
      console.log("🟢 READY FOR PRODUCTION");
      console.log("   All critical tests pass and success rate > 95%");
    } else if (criticalFailed === 0 && successRate >= 90) {
      console.log("🟡 CAUTION - REVIEW REQUIRED");
      console.log("   Critical tests pass but some non-critical tests failed");
      console.log("   Review failed tests before production deployment");
    } else {
      console.log("🔴 NOT READY FOR PRODUCTION");
      console.log("   Critical test failures or success rate < 90%");
      console.log("   Must fix all issues before production deployment");
    }
    
    console.log();
    console.log(`Critical Test Status: ${criticalFailed === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}%`);

    // Security assessment
    const securityResults = this.results.filter(r => r.testFile.includes('security'));
    if (securityResults.length > 0) {
      const securityFailed = securityResults.reduce((sum, r) => sum + r.failed, 0);
      console.log(`Security Test Status: ${securityFailed === 0 ? '🛡️  SECURE' : '⚠️  VULNERABILITIES FOUND'}`);
    }

    // Performance assessment
    const performanceResults = this.results.filter(r => r.testFile.includes('performance'));
    if (performanceResults.length > 0) {
      const performanceFailed = performanceResults.reduce((sum, r) => sum + r.failed, 0);
      console.log(`Performance Test Status: ${performanceFailed === 0 ? '⚡ OPTIMIZED' : '🐌 PERFORMANCE ISSUES'}`);
    }

    // Generate detailed report file
    await this.saveReportToFile();
  }

  private async saveReportToFile(): Promise<void> {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      summary: {
        totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed, 0),
        totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
        totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
        successRate: 0
      },
      testSuites: this.testSuites.map(suite => ({
        ...suite,
        results: this.results.filter(r => suite.files.includes(r.testFile))
      })),
      productionReadiness: {
        criticalTestsPassed: this.results.filter(r => 
          this.testSuites.find(s => s.files.includes(r.testFile))?.critical
        ).every(r => r.failed === 0),
        securityTestsPassed: this.results.filter(r => 
          r.testFile.includes('security')
        ).every(r => r.failed === 0),
        performanceTestsPassed: this.results.filter(r => 
          r.testFile.includes('performance')
        ).every(r => r.failed === 0)
      }
    };

    reportData.summary.successRate = reportData.summary.totalTests > 0 ? 
      (reportData.summary.totalPassed / reportData.summary.totalTests) * 100 : 0;

    const reportPath = path.join(process.cwd(), 'test-reports', `vcsale-test-report-${Date.now()}.json`);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }

  // Individual test runners for development
  async runContractTests(): Promise<void> {
    console.log("🏗️  Running Contract Tests Only");
    console.log("==============================");
    
    const contractSuites = this.testSuites.filter(suite => 
      !suite.name.includes('Widget') && !suite.name.includes('E2E')
    );
    
    this.startTime = Date.now();
    
    for (const suite of contractSuites) {
      await this.runTestSuite(suite);
    }
    
    await this.generateReport();
  }

  async runFrontendTests(): Promise<void> {
    console.log("🖥️  Running Frontend Tests Only");
    console.log("===============================");
    
    const frontendSuites = this.testSuites.filter(suite => 
      suite.name.includes('Widget') || suite.name.includes('Integration')
    );
    
    this.startTime = Date.now();
    
    for (const suite of frontendSuites) {
      await this.runTestSuite(suite);
    }
    
    await this.generateReport();
  }

  async runSecurityTests(): Promise<void> {
    console.log("🔒 Running Security Tests Only");
    console.log("==============================");
    
    const securitySuites = this.testSuites.filter(suite => 
      suite.name.includes('Security') || suite.name.includes('Comprehensive')
    );
    
    this.startTime = Date.now();
    
    for (const suite of securitySuites) {
      await this.runTestSuite(suite);
    }
    
    await this.generateReport();
  }
}

// CLI interface
async function main() {
  const runner = new VCSaleTestRunner();
  const args = process.argv.slice(2);
  
  try {
    switch (args[0]) {
      case 'all':
        await runner.runAllTests();
        break;
      case 'critical':
        await runner.runCriticalTests();
        break;
      case 'contract':
        await runner.runContractTests();
        break;
      case 'frontend':
        await runner.runFrontendTests();
        break;
      case 'security':
        await runner.runSecurityTests();
        break;
      default:
        console.log("VCSale Test Runner");
        console.log("==================");
        console.log();
        console.log("Usage: npm run test:vcsale [command]");
        console.log();
        console.log("Commands:");
        console.log("  all       - Run all test suites");
        console.log("  critical  - Run only critical tests");
        console.log("  contract  - Run contract tests only");
        console.log("  frontend  - Run frontend tests only");
        console.log("  security  - Run security tests only");
        console.log();
        console.log("Examples:");
        console.log("  npm run test:vcsale all");
        console.log("  npm run test:vcsale critical");
        console.log("  npx ts-node test/VCSale.testRunner.ts security");
        process.exit(0);
    }
  } catch (error: any) {
    console.error("❌ Test runner failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { VCSaleTestRunner }; 