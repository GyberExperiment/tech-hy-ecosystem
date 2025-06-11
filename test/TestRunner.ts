import { execSync } from "child_process";
import * as fs from "fs";

interface TestResult {
    name: string;
    passed: number;
    failed: number;
    duration: number;
    errors: string[];
}

interface TestSuite {
    category: string;
    tests: string[];
    description: string;
}

const TEST_SUITES: TestSuite[] = [
    {
        category: "🪙 Production Tokens",
        tests: [
            "test/tokens/VGToken.test.ts",
            "test/tokens/VGTokenVotes.test.ts",
            "test/tokens/VCToken.test.ts"
        ],
        description: "Complete testing of production token contracts"
    },
    {
        category: "🔒 Core LPLocker",
        tests: [
            "test/LPLocker.test.ts"
        ],
        description: "Core LPLocker functionality with security features"
    },
    {
        category: "🔄 Full Integration",
        tests: [
            "test/integration/FullEcosystem.test.ts"
        ],
        description: "End-to-end ecosystem integration testing"
    }
];

class TestRunner {
    private results: TestResult[] = [];
    private startTime: number = 0;

    async runAllTests(): Promise<void> {
        console.log("🚀 НАЧИНАЕМ КОМПЛЕКСНОЕ БОЕВОЕ ТЕСТИРОВАНИЕ");
        console.log("=" .repeat(60));
        
        this.startTime = Date.now();

        for (const suite of TEST_SUITES) {
            await this.runTestSuite(suite);
        }

        this.generateReport();
    }

    private async runTestSuite(suite: TestSuite): Promise<void> {
        console.log(`\n${suite.category}`);
        console.log("-".repeat(40));
        console.log(`📋 ${suite.description}`);
        console.log("");

        for (const testFile of suite.tests) {
            await this.runSingleTest(testFile, suite.category);
        }
    }

    private async runSingleTest(testFile: string, category: string): Promise<void> {
        const testName = testFile.split("/").pop()?.replace(".test.ts", "") || testFile;
        
        console.log(`🧪 Запуск ${testName}...`);
        
        const startTime = Date.now();
        
        try {
            // Компиляция контрактов если нужно
            if (!fs.existsSync("artifacts")) {
                console.log("  📦 Компилируем контракты...");
                execSync("npx hardhat compile", { stdio: "pipe" });
            }

            // Запуск тестов без --reporter json
            const output = execSync(`npx hardhat test ${testFile}`, { 
                stdio: "pipe",
                encoding: "utf8"
            });

            const result = this.parseTestOutput(output, testName, Date.now() - startTime);
            this.results.push(result);
            
            if (result.failed === 0) {
                console.log(`  ✅ ${testName}: ${result.passed} tests passed (${result.duration}ms)`);
            } else {
                console.log(`  ❌ ${testName}: ${result.failed} tests failed, ${result.passed} passed`);
                result.errors.forEach(error => console.log(`     💀 ${error}`));
            }

        } catch (error: any) {
            console.log(`  💥 ${testName}: КРИТИЧЕСКАЯ ОШИБКА`);
            console.log(`     ${error.message}`);
            
            this.results.push({
                name: testName,
                passed: 0,
                failed: 1,
                duration: Date.now() - startTime,
                errors: [error.message]
            });
        }
    }

    private parseTestOutput(output: string, testName: string, duration: number): TestResult {
        try {
            // Parse standard hardhat output format
            const passedMatch = output.match(/(\d+) passing/);
            const failedMatch = output.match(/(\d+) failing/);
            
            const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
            const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
            
            // Extract error messages if any
            const errors: string[] = [];
            if (failed > 0) {
                const errorMatches = output.match(/Error: .+/g);
                if (errorMatches) {
                    errors.push(...errorMatches.slice(0, 3)); // Limit to first 3 errors
                }
            }
            
            return {
                name: testName,
                passed: passed,
                failed: failed,
                duration: duration,
                errors: errors
            };
        } catch {
            // Fallback parsing
            const hasError = output.includes("Error") || output.includes("failing");
            return {
                name: testName,
                passed: hasError ? 0 : 1,
                failed: hasError ? 1 : 0,
                duration: duration,
                errors: hasError ? ["Parse error - see detailed output"] : []
            };
        }
    }

    private generateReport(): void {
        const totalDuration = Date.now() - this.startTime;
        const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
        const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
        const totalTests = totalPassed + totalFailed;

        console.log("\n" + "=".repeat(60));
        console.log("📊 ИТОГОВЫЙ ОТЧЕТ БОЕВОГО ТЕСТИРОВАНИЯ");
        console.log("=".repeat(60));

        // Статистика по категориям
        for (const suite of TEST_SUITES) {
            const suiteResults = this.results.filter(r => 
                suite.tests.some(test => test.includes(r.name))
            );
            
            const suitePassed = suiteResults.reduce((sum, r) => sum + r.passed, 0);
            const suiteFailed = suiteResults.reduce((sum, r) => sum + r.failed, 0);
            
            const status = suiteFailed === 0 ? "✅" : "❌";
            console.log(`${status} ${suite.category}: ${suitePassed} passed, ${suiteFailed} failed`);
        }

        console.log("\n📈 ОБЩАЯ СТАТИСТИКА:");
        console.log(`• Всего тестов: ${totalTests}`);
        console.log(`• Прошло: ${totalPassed} ✅`);
        console.log(`• Упало: ${totalFailed} ❌`);
        console.log(`• Процент успеха: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
        console.log(`• Общее время: ${(totalDuration / 1000).toFixed(2)}s`);

        // Детальные ошибки
        const failedResults = this.results.filter(r => r.failed > 0);
        if (failedResults.length > 0) {
            console.log("\n💀 ДЕТАЛИ ОШИБОК:");
            failedResults.forEach(result => {
                console.log(`\n❌ ${result.name}:`);
                result.errors.forEach(error => console.log(`   • ${error}`));
            });
        }

        // Рекомендации
        console.log("\n🎯 РЕКОМЕНДАЦИИ:");
        
        if (totalFailed === 0) {
            console.log("🎉 ВСЕ ТЕСТЫ ПРОШЛИ! Система готова к деплою в testnet");
            console.log("📋 Следующие шаги:");
            console.log("   1. Запустить deploy-tokens.ts");
            console.log("   2. Запустить deploy-ecosystem.ts");
            console.log("   3. Протестировать на BSC testnet");
        } else {
            console.log("⚠️  Есть проваленные тесты - ДЕПЛОЙ НЕ РЕКОМЕНДУЕТСЯ");
            console.log("🔧 Необходимо исправить ошибки перед деплоем");
        }

        // Сохранение отчета
        this.saveReport({
            timestamp: new Date().toISOString(),
            totalTests,
            totalPassed,
            totalFailed,
            successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
            duration: totalDuration,
            results: this.results,
            readyForDeploy: totalFailed === 0
        });

        console.log("\n💾 Отчет сохранен в test-report.json");
    }

    private saveReport(report: any): void {
        fs.writeFileSync("test-report.json", JSON.stringify(report, null, 2));
    }
}

// Запуск тестирования
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Критическая ошибка тест-раннера:", error);
            process.exit(1);
        });
}

export { TestRunner }; 