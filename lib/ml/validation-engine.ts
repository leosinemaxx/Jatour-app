// Validation Engine for Data Integrity Checks and Cost Calculation Validation
// Multi-layer validation with comprehensive error reporting

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-1 validation confidence score
}

export interface ValidationRule {
  name: string;
  description: string;
  validator: (data: any, context?: any) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  category: 'data' | 'cost' | 'logic' | 'consistency';
}

export interface ValidationConfig {
  enableStrictMode: boolean;
  enableCostValidation: boolean;
  enableLogicValidation: boolean;
  maxErrors: number;
  validationTimeout: number;
}

export class ValidationEngine {
  private rules: ValidationRule[] = [];
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableStrictMode: true,
      enableCostValidation: true,
      enableLogicValidation: true,
      maxErrors: 50,
      validationTimeout: 5000,
      ...config
    };

    this.initializeValidationRules();
  }

  async validateItinerary(itineraryResult: any, input?: any): Promise<ValidationResult> {
    console.log(`[ValidationEngine] Validating itinerary`);

    const startTime = Date.now();
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let totalScore = 0;
    let ruleCount = 0;

    try {
      // Validate with timeout
      const validationPromise = this.runValidationRules(itineraryResult, input);

      const timeoutPromise = new Promise<ValidationResult>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), this.config.validationTimeout);
      });

      const result = await Promise.race([validationPromise, timeoutPromise]);

      return result;
    } catch (error) {
      console.error(`[ValidationEngine] Validation failed:`, error);
      return {
        isValid: false,
        errors: [`Validation engine error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        score: 0
      };
    }
  }

  private async runValidationRules(itineraryResult: any, input?: any): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let totalScore = 0;
    let ruleCount = 0;

    for (const rule of this.rules) {
      if (allErrors.length >= this.config.maxErrors) {
        allErrors.push(`Maximum error limit (${this.config.maxErrors}) reached`);
        break;
      }

      try {
        const result = rule.validator(itineraryResult, input);

        if (!result.isValid && rule.severity === 'error') {
          allErrors.push(...result.errors);
        } else if (rule.severity === 'warning') {
          allWarnings.push(...result.warnings);
        }

        totalScore += result.score;
        ruleCount++;
      } catch (error) {
        console.warn(`[ValidationEngine] Rule ${rule.name} failed:`, error);
        allErrors.push(`Validation rule '${rule.name}' failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const averageScore = ruleCount > 0 ? totalScore / ruleCount : 0;
    const isValid = allErrors.length === 0;

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      score: averageScore
    };
  }

  private initializeValidationRules(): void {
    // Data integrity rules
    this.addRule({
      name: 'itinerary_structure',
      description: 'Validates basic itinerary structure',
      category: 'data',
      severity: 'error',
      validator: (itinerary) => {
        const errors: string[] = [];

        if (!itinerary) {
          errors.push('Itinerary is null or undefined');
          return { isValid: false, errors, warnings: [], score: 0 };
        }

        if (!itinerary.itinerary || !Array.isArray(itinerary.itinerary)) {
          errors.push('Itinerary days array is missing or invalid');
        }

        if (!itinerary.totalCost || itinerary.totalCost < 0) {
          errors.push('Total cost is missing or negative');
        }

        if (!itinerary.totalDuration || itinerary.totalDuration < 0) {
          errors.push('Total duration is missing or negative');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings: [],
          score: errors.length === 0 ? 1 : 0
        };
      }
    });

    this.addRule({
      name: 'day_structure',
      description: 'Validates individual day structures',
      category: 'data',
      severity: 'error',
      validator: (itinerary) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!itinerary.itinerary) return { isValid: false, errors: ['No itinerary data'], warnings: [], score: 0 };

        itinerary.itinerary.forEach((day: any, index: number) => {
          if (!day.day || day.day !== index + 1) {
            errors.push(`Day ${index + 1} has invalid day number`);
          }

          if (!day.date) {
            errors.push(`Day ${index + 1} is missing date`);
          }

          if (!day.destinations || !Array.isArray(day.destinations)) {
            errors.push(`Day ${index + 1} has invalid destinations array`);
          } else if (day.destinations.length === 0) {
            warnings.push(`Day ${index + 1} has no destinations`);
          }

          if (!day.totalCost && day.totalCost !== 0) {
            errors.push(`Day ${index + 1} is missing total cost`);
          }

          if (!day.totalTime && day.totalTime !== 0) {
            errors.push(`Day ${index + 1} is missing total time`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          score: Math.max(0, 1 - (errors.length * 0.2) - (warnings.length * 0.1))
        };
      }
    });

    this.addRule({
      name: 'destination_integrity',
      description: 'Validates destination data integrity',
      category: 'data',
      severity: 'error',
      validator: (itinerary) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!itinerary.itinerary) return { isValid: false, errors: ['No itinerary data'], warnings: [], score: 0 };

        itinerary.itinerary.forEach((day: any) => {
          if (!day.destinations) return;

          day.destinations.forEach((dest: any, destIndex: number) => {
            if (!dest.id) {
              errors.push(`Destination ${destIndex + 1} in day ${day.day} is missing ID`);
            }

            if (!dest.name) {
              errors.push(`Destination ${dest.id || destIndex + 1} in day ${day.day} is missing name`);
            }

            if (!dest.coordinates || !dest.coordinates.lat || !dest.coordinates.lng) {
              warnings.push(`Destination ${dest.name || dest.id} in day ${day.day} has incomplete coordinates`);
            }

            if (!dest.scheduledTime) {
              errors.push(`Destination ${dest.name || dest.id} in day ${day.day} is missing scheduled time`);
            }

            if (!dest.duration || dest.duration <= 0) {
              errors.push(`Destination ${dest.name || dest.id} in day ${day.day} has invalid duration`);
            }

            if (!dest.estimatedCost && dest.estimatedCost !== 0) {
              warnings.push(`Destination ${dest.name || dest.id} in day ${day.day} is missing cost estimate`);
            }
          });
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          score: Math.max(0, 1 - (errors.length * 0.15) - (warnings.length * 0.05))
        };
      }
    });

    // Cost validation rules
    if (this.config.enableCostValidation) {
      this.addRule({
        name: 'cost_consistency',
        description: 'Validates cost calculations consistency',
        category: 'cost',
        severity: 'error',
        validator: (itinerary) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!itinerary.itinerary) return { isValid: false, errors: ['No itinerary data'], warnings: [], score: 0 };

          let calculatedTotalCost = 0;

          itinerary.itinerary.forEach((day: any) => {
            let dayCalculatedCost = 0;

            if (day.destinations) {
              dayCalculatedCost = day.destinations.reduce((sum: number, dest: any) =>
                sum + (dest.estimatedCost || 0), 0);
            }

            if (day.accommodation) {
              dayCalculatedCost += day.accommodation.cost || 0;
            }

            if (day.transportation) {
              dayCalculatedCost += day.transportation.cost || 0;
            }

            // Check day total cost consistency
            if (Math.abs(day.totalCost - dayCalculatedCost) > 1000) { // Allow 1k tolerance
              errors.push(`Day ${day.day} cost mismatch: expected ${dayCalculatedCost}, got ${day.totalCost}`);
            }

            calculatedTotalCost += day.totalCost || 0;
          });

          // Check total cost consistency
          if (Math.abs(itinerary.totalCost - calculatedTotalCost) > 5000) { // Allow 5k tolerance
            errors.push(`Total cost mismatch: expected ${calculatedTotalCost}, got ${itinerary.totalCost}`);
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: errors.length === 0 ? 1 : 0.5
          };
        }
      });

      this.addRule({
        name: 'budget_compliance',
        description: 'Validates budget compliance',
        category: 'cost',
        severity: 'warning',
        validator: (itinerary, input) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!input || !input.preferences || !input.preferences.budget) {
            return { isValid: true, errors, warnings, score: 1 }; // Skip if no budget info
          }

          const budget = input.preferences.budget;
          const totalCost = itinerary.totalCost || 0;
          const variance = ((totalCost - budget) / budget) * 100;

          if (variance > 20) {
            errors.push(`Itinerary cost exceeds budget by ${variance.toFixed(1)}%`);
          } else if (variance > 10) {
            warnings.push(`Itinerary cost exceeds budget by ${variance.toFixed(1)}%`);
          } else if (variance < -20) {
            warnings.push(`Itinerary is significantly under budget (${Math.abs(variance).toFixed(1)}% savings)`);
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: Math.max(0, 1 - Math.abs(variance) / 100)
          };
        }
      });
    }

    // Logic validation rules
    if (this.config.enableLogicValidation) {
      this.addRule({
        name: 'time_logic',
        description: 'Validates time scheduling logic',
        category: 'logic',
        severity: 'error',
        validator: (itinerary) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!itinerary.itinerary) return { isValid: false, errors: ['No itinerary data'], warnings: [], score: 0 };

          itinerary.itinerary.forEach((day: any) => {
            if (!day.destinations || day.destinations.length === 0) return;

            // Sort destinations by scheduled time
            const sortedDests = [...day.destinations].sort((a, b) => {
              const timeA = this.parseTime(a.scheduledTime);
              const timeB = this.parseTime(b.scheduledTime);
              return timeA - timeB;
            });

            // Check for time overlaps and gaps
            for (let i = 0; i < sortedDests.length - 1; i++) {
              const current = sortedDests[i];
              const next = sortedDests[i + 1];

              const currentEndTime = this.parseTime(current.scheduledTime) + (current.duration || 0);
              const nextStartTime = this.parseTime(next.scheduledTime);

              if (currentEndTime > nextStartTime) {
                errors.push(`Time overlap in day ${day.day}: ${current.name} ends at ${this.formatTime(currentEndTime)} but ${next.name} starts at ${next.scheduledTime}`);
              }

              const gap = nextStartTime - currentEndTime;
              if (gap > 240) { // More than 4 hours gap
                warnings.push(`Large time gap (${Math.round(gap/60)}h) in day ${day.day} between ${current.name} and ${next.name}`);
              }
            }
          });

          return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: Math.max(0, 1 - (errors.length * 0.2) - (warnings.length * 0.1))
          };
        }
      });

      this.addRule({
        name: 'geographic_logic',
        description: 'Validates geographic routing logic',
        category: 'logic',
        severity: 'warning',
        validator: (itinerary) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!itinerary.itinerary) return { isValid: true, errors, warnings, score: 1 };

          itinerary.itinerary.forEach((day: any) => {
            if (!day.destinations || day.destinations.length < 2) return;

            let totalDistance = 0;
            for (let i = 0; i < day.destinations.length - 1; i++) {
              const dest1 = day.destinations[i];
              const dest2 = day.destinations[i + 1];

              if (dest1.coordinates && dest2.coordinates) {
                const distance = this.calculateDistance(dest1.coordinates, dest2.coordinates);
                totalDistance += distance;

                if (distance > 50) { // More than 50km between consecutive destinations
                  warnings.push(`Long distance (${distance.toFixed(1)}km) between ${dest1.name} and ${dest2.name} in day ${day.day}`);
                }
              }
            }

            if (totalDistance > 200) { // More than 200km total travel in a day
              warnings.push(`High daily travel distance (${totalDistance.toFixed(1)}km) in day ${day.day}`);
            }
          });

          return {
            isValid: true, // Geographic issues are warnings, not errors
            errors,
            warnings,
            score: Math.max(0.5, 1 - (warnings.length * 0.1))
          };
        }
      });
    }
  }

  private addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  // Helper methods
  private parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Public methods for external validation
  validateData(data: any, rules?: string[]): ValidationResult {
    const relevantRules = rules ?
      this.rules.filter(rule => rules.includes(rule.name)) :
      this.rules;

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let totalScore = 0;

    for (const rule of relevantRules) {
      const result = rule.validator(data);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      totalScore += result.score;
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      score: totalScore / relevantRules.length
    };
  }

  getAvailableRules(): ValidationRule[] {
    return [...this.rules];
  }
}

// Singleton instance
export const validationEngine = new ValidationEngine();