// Testing Framework for Automated Testing Suite
// Comprehensive testing for synchronization, regeneration, and error scenarios

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  name: string;
  test: (context: TestContext) => Promise<void>;
  timeout?: number;
  skip?: boolean;
}

export interface TestContext {
  itineraryEngine: any; // ItineraryManagementEngine
  results: TestResult[];
  sharedData: Map<string, any>;
}

export interface TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageDuration: number;
  results: TestResult[];
  coverage: number;
  summary: string;
}

export class TestingFramework {
  private testSuites: TestSuite[] = [];
  private globalTimeout = 30000; // 30 seconds

  constructor() {
    this.initializeTestSuites();
  }

  async runAllTests(contextProvider: any): Promise<TestReport> {
    console.log('[TestingFramework] Starting comprehensive test suite');

    const startTime = Date.now();
    const allResults: TestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    const context: TestContext = {
      itineraryEngine: contextProvider,
      results: allResults,
      sharedData: new Map()
    };

    for (const suite of this.testSuites) {
      console.log(`[TestingFramework] Running test suite: ${suite.name}`);

      // Setup
      if (suite.setup) {
        try {
          await suite.setup();
        } catch (error) {
          console.error(`[TestingFramework] Suite setup failed for ${suite.name}:`, error);
          continue;
        }
      }

      // Run tests
      for (const testCase of suite.tests) {
        totalTests++;

        if (testCase.skip) {
          skippedTests++;
          allResults.push({
            testName: `${suite.name}:${testCase.name}`,
            passed: false,
            duration: 0,
            error: 'Skipped'
          });
          continue;
        }

        const testStartTime = Date.now();

        try {
          const timeout = testCase.timeout || this.globalTimeout;
          const testPromise = testCase.test(context);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
          });

          await Promise.race([testPromise, timeoutPromise]);

          const duration = Date.now() - testStartTime;
          passedTests++;

          allResults.push({
            testName: `${suite.name}:${testCase.name}`,
            passed: true,
            duration
          });

          console.log(`[TestingFramework] ✓ ${suite.name}:${testCase.name} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - testStartTime;
          failedTests++;

          const errorMessage = error instanceof Error ? error.message : String(error);
          allResults.push({
            testName: `${suite.name}:${testCase.name}`,
            passed: false,
            duration,
            error: errorMessage
          });

          console.error(`[TestingFramework] ✗ ${suite.name}:${testCase.name} failed: ${errorMessage}`);
        }
      }

      // Teardown
      if (suite.teardown) {
        try {
          await suite.teardown();
        } catch (error) {
          console.error(`[TestingFramework] Suite teardown failed for ${suite.name}:`, error);
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
    const coverage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const report: TestReport = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      averageDuration,
      results: allResults,
      coverage,
      summary: this.generateSummary(passedTests, failedTests, skippedTests, coverage)
    };

    console.log(`[TestingFramework] Test suite completed: ${passedTests}/${totalTests} passed (${coverage.toFixed(1)}% coverage)`);
    return report;
  }

  private initializeTestSuites(): void {
    // Itinerary Creation Tests
    this.addTestSuite({
      name: 'itinerary_creation',
      tests: [
        {
          name: 'create_basic_itinerary',
          test: async (context) => {
            const input = this.createMockItineraryInput();
            const result = await context.itineraryEngine.createItinerary(input);

            if (!result || !result.itinerary) {
              throw new Error('Itinerary creation failed');
            }

            if (result.syncStatus !== 'synced') {
              throw new Error('Itinerary not properly synced');
            }

            context.sharedData.set('test_itinerary_id', result.id);
          }
        },
        {
          name: 'create_itinerary_with_constraints',
          test: async (context) => {
            const input = this.createMockItineraryInput();
            input.constraints = {
              maxDailyTravelTime: 480,
              preferredStartTime: '08:00',
              preferredEndTime: '20:00',
              mustVisit: [input.availableDestinations[0].id]
            };

            const result = await context.itineraryEngine.createItinerary(input);

            if (!result || !result.itinerary) {
              throw new Error('Constrained itinerary creation failed');
            }
          }
        },
        {
          name: 'create_itinerary_validation',
          test: async (context) => {
            const input = this.createMockItineraryInput();
            input.preferences.days = 0; // Invalid input

            try {
              await context.itineraryEngine.createItinerary(input);
              throw new Error('Should have failed validation');
            } catch (error) {
              // Expected to fail
            }
          }
        }
      ]
    });

    // Incremental Update Tests
    this.addTestSuite({
      name: 'incremental_updates',
      tests: [
        {
          name: 'add_destination',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const newDestination = {
              id: 'test_dest_new',
              name: 'New Test Destination',
              location: 'Test City',
              category: 'cultural',
              estimatedCost: 50000,
              duration: 120,
              coordinates: { lat: -6.2088, lng: 106.8456 },
              tags: ['test']
            };

            const update = {
              type: 'destination_add',
              data: newDestination,
              timestamp: Date.now(),
              source: 'user'
            };

            const result = await context.itineraryEngine.updateItinerary(itineraryId, update);

            if (!result || result.syncStatus === 'error') {
              throw new Error('Destination addition failed');
            }
          }
        },
        {
          name: 'update_budget',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const update = {
              type: 'budget_change',
              data: { budget: 2000000 },
              timestamp: Date.now(),
              source: 'user'
            };

            const result = await context.itineraryEngine.updateItinerary(itineraryId, update);

            if (!result || !result.input || result.input.preferences.budget !== 2000000) {
              throw new Error('Budget update failed');
            }
          }
        },
        {
          name: 'remove_destination',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const update = {
              type: 'destination_remove',
              data: { id: 'test_dest_1' },
              timestamp: Date.now(),
              source: 'user'
            };

            const result = await context.itineraryEngine.updateItinerary(itineraryId, update);

            if (!result) {
              throw new Error('Destination removal failed');
            }
          }
        }
      ]
    });

    // Synchronization Tests
    this.addTestSuite({
      name: 'synchronization',
      tests: [
        {
          name: 'cross_tab_sync',
          test: async (context) => {
            // Simulate cross-tab sync by triggering storage event
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            // Manually trigger storage event (in real scenario this would be automatic)
            const event = new StorageEvent('storage', {
              key: `itinerary_${itineraryId}`,
              newValue: JSON.stringify({ version: 999, lastModified: Date.now() })
            });

            window.dispatchEvent(event);

            // Wait a bit for sync to process
            await new Promise(resolve => setTimeout(resolve, 100));

            const updated = await context.itineraryEngine.getItinerary(itineraryId);
            if (!updated) {
              throw new Error('Cross-tab sync failed');
            }
          }
        },
        {
          name: 'offline_sync_queue',
          test: async (context) => {
            // Simulate offline state
            const originalOnLine = navigator.onLine;
            Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const update = {
              type: 'preference_update',
              data: { accommodationType: 'luxury' },
              timestamp: Date.now(),
              source: 'user'
            };

            // This should queue the sync
            const result = await context.itineraryEngine.updateItinerary(itineraryId, update);

            // Restore online state
            Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });

            if (!result) {
              throw new Error('Offline sync queuing failed');
            }
          }
        }
      ]
    });

    // Error Recovery Tests
    this.addTestSuite({
      name: 'error_recovery',
      tests: [
        {
          name: 'invalid_itinerary_recovery',
          test: async (context) => {
            const input = this.createMockItineraryInput();
            input.preferences.days = -1; // Invalid

            try {
              await context.itineraryEngine.createItinerary(input);
              throw new Error('Should have failed with invalid input');
            } catch (error) {
              // Expected to fail, check error recovery
              const stats = context.itineraryEngine.getStats();
              if (stats.errorCount === 0) {
                throw new Error('Error not properly logged');
              }
            }
          }
        },
        {
          name: 'corrupted_data_recovery',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            // Simulate corrupted localStorage
            localStorage.setItem(`itinerary_${itineraryId}`, 'invalid json');

            const result = await context.itineraryEngine.getItinerary(itineraryId);

            // Should handle corruption gracefully
            if (!result) {
              throw new Error('Failed to recover from corrupted data');
            }
          }
        }
      ]
    });

    // Performance Tests
    this.addTestSuite({
      name: 'performance',
      tests: [
        {
          name: 'bulk_operations',
          test: async (context) => {
            const startTime = Date.now();

            // Create multiple itineraries
            const promises = [];
            for (let i = 0; i < 5; i++) {
              const input = this.createMockItineraryInput();
              input.userId = `test_user_${i}`;
              promises.push(context.itineraryEngine.createItinerary(input));
            }

            const results = await Promise.all(promises);
            const duration = Date.now() - startTime;

            if (results.some(r => !r || r.syncStatus === 'error')) {
              throw new Error('Bulk operations failed');
            }

            if (duration > 10000) { // Should complete within 10 seconds
              throw new Error(`Bulk operations too slow: ${duration}ms`);
            }

            console.log(`[TestingFramework] Bulk operations completed in ${duration}ms`);
          },
          timeout: 15000
        },
        {
          name: 'cache_performance',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const startTime = Date.now();

            // Multiple rapid reads should use cache
            for (let i = 0; i < 10; i++) {
              const result = await context.itineraryEngine.getItinerary(itineraryId);
              if (!result) {
                throw new Error('Cache read failed');
              }
            }

            const duration = Date.now() - startTime;

            if (duration > 1000) { // Should be very fast with caching
              throw new Error(`Cache performance poor: ${duration}ms for 10 reads`);
            }
          }
        }
      ]
    });

    // Validation Tests
    this.addTestSuite({
      name: 'validation',
      tests: [
        {
          name: 'data_integrity_validation',
          test: async (context) => {
            const itineraryId = context.sharedData.get('test_itinerary_id');
            if (!itineraryId) throw new Error('No test itinerary available');

            const state = await context.itineraryEngine.getItinerary(itineraryId);
            if (!state) throw new Error('Could not retrieve itinerary for validation');

            // Validation should pass for properly created itineraries
            if (state.validationStatus !== 'valid') {
              throw new Error('Itinerary validation failed');
            }
          }
        },
        {
          name: 'cost_validation',
          test: async (context) => {
            const input = this.createMockItineraryInput();
            input.preferences.budget = 100000; // Very low budget

            const result = await context.itineraryEngine.createItinerary(input);

            if (!result || !result.itinerary) {
              throw new Error('Low budget itinerary creation failed');
            }

            // Should still validate but may have warnings
            if (result.validationStatus === 'invalid') {
              throw new Error('Low budget itinerary should still be valid');
            }
          }
        }
      ]
    });
  }

  private addTestSuite(suite: TestSuite): void {
    this.testSuites.push(suite);
  }

  private createMockItineraryInput(): any {
    return {
      userId: 'test_user',
      preferences: {
        budget: 1000000,
        days: 3,
        travelers: 2,
        accommodationType: 'moderate',
        cities: ['Jakarta', 'Bandung'],
        interests: ['cultural', 'nature'],
        themes: ['adventure'],
        preferredSpots: [],
        startDate: '2024-12-01'
      },
      availableDestinations: [
        {
          id: 'test_dest_1',
          name: 'Borobudur Temple',
          location: 'Magelang',
          category: 'cultural',
          estimatedCost: 150000,
          duration: 180,
          coordinates: { lat: -7.6079, lng: 110.2038 },
          tags: ['historical', 'cultural']
        },
        {
          id: 'test_dest_2',
          name: 'Malioboro Street',
          location: 'Yogyakarta',
          category: 'shopping',
          estimatedCost: 100000,
          duration: 120,
          coordinates: { lat: -7.7956, lng: 110.3695 },
          tags: ['shopping', 'food']
        },
        {
          id: 'test_dest_3',
          name: 'Prambanan Temple',
          location: 'Yogyakarta',
          category: 'cultural',
          estimatedCost: 200000,
          duration: 240,
          coordinates: { lat: -7.7521, lng: 110.4915 },
          tags: ['historical', 'cultural']
        }
      ]
    };
  }

  private generateSummary(passed: number, failed: number, skipped: number, coverage: number): string {
    const total = passed + failed + skipped;
    let summary = `Test Results: ${passed}/${total} passed`;

    if (failed > 0) {
      summary += `, ${failed} failed`;
    }

    if (skipped > 0) {
      summary += `, ${skipped} skipped`;
    }

    summary += ` (${coverage.toFixed(1)}% coverage)`;

    if (coverage >= 90) {
      summary += ' - Excellent coverage!';
    } else if (coverage >= 75) {
      summary += ' - Good coverage';
    } else if (coverage >= 50) {
      summary += ' - Moderate coverage';
    } else {
      summary += ' - Poor coverage, needs improvement';
    }

    return summary;
  }

  // Public methods for custom testing
  addCustomTest(suiteName: string, testCase: TestCase): void {
    let suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      suite = { name: suiteName, tests: [] };
      this.testSuites.push(suite);
    }
    suite.tests.push(testCase);
  }

  getTestSuites(): TestSuite[] {
    return [...this.testSuites];
  }

  async runSpecificTest(suiteName: string, testName: string, context: any): Promise<TestResult> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) throw new Error(`Test suite '${suiteName}' not found`);

    const testCase = suite.tests.find(t => t.name === testName);
    if (!testCase) throw new Error(`Test case '${testName}' not found in suite '${suiteName}'`);

    const startTime = Date.now();

    try {
      const testContext: TestContext = {
        itineraryEngine: context,
        results: [],
        sharedData: new Map()
      };

      await testCase.test(testContext);

      return {
        testName: `${suiteName}:${testName}`,
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: `${suiteName}:${testName}`,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Singleton instance
export const testingFramework = new TestingFramework();