import { PolicyCompatibilityMode } from '../services/policyCompatibilityService';

export interface PolicyMigrationConfig {
  compatibility: PolicyCompatibilityMode;
  migration: {
    batchSize: number;
    enableAutoMigration: boolean;
    enableRollback: boolean;
    backupRetentionDays: number;
  };
  validation: {
    strictMode: boolean;
    allowDuplicates: boolean;
    validateDates: boolean;
    validateAmounts: boolean;
  };
}

/**
 * Default configuration for policy migration
 */
export const defaultPolicyMigrationConfig: PolicyMigrationConfig = {
  compatibility: {
    useTemplateSystem: true,
    allowFallback: true,
    migrateOnRead: false
  },
  migration: {
    batchSize: 100,
    enableAutoMigration: false,
    enableRollback: true,
    backupRetentionDays: 30
  },
  validation: {
    strictMode: true,
    allowDuplicates: false,
    validateDates: true,
    validateAmounts: true
  }
};

/**
 * Configuration for different migration phases
 */
export const migrationPhaseConfigs = {
  // Phase 1: Preparation - Old system only, validation enabled
  preparation: {
    compatibility: {
      useTemplateSystem: false,
      allowFallback: true,
      migrateOnRead: false
    },
    migration: {
      batchSize: 50,
      enableAutoMigration: false,
      enableRollback: true,
      backupRetentionDays: 30
    },
    validation: {
      strictMode: true,
      allowDuplicates: false,
      validateDates: true,
      validateAmounts: true
    }
  } as PolicyMigrationConfig,

  // Phase 2: Migration - Hybrid mode with fallback
  migration: {
    compatibility: {
      useTemplateSystem: true,
      allowFallback: true,
      migrateOnRead: false
    },
    migration: {
      batchSize: 100,
      enableAutoMigration: false,
      enableRollback: true,
      backupRetentionDays: 30
    },
    validation: {
      strictMode: true,
      allowDuplicates: true, // Allow during migration
      validateDates: true,
      validateAmounts: true
    }
  } as PolicyMigrationConfig,

  // Phase 3: Transition - Template system with auto-migration
  transition: {
    compatibility: {
      useTemplateSystem: true,
      allowFallback: true,
      migrateOnRead: true
    },
    migration: {
      batchSize: 100,
      enableAutoMigration: true,
      enableRollback: true,
      backupRetentionDays: 30
    },
    validation: {
      strictMode: false, // Relaxed during transition
      allowDuplicates: true,
      validateDates: true,
      validateAmounts: true
    }
  } as PolicyMigrationConfig,

  // Phase 4: Complete - Template system only
  complete: {
    compatibility: {
      useTemplateSystem: true,
      allowFallback: false,
      migrateOnRead: false
    },
    migration: {
      batchSize: 100,
      enableAutoMigration: false,
      enableRollback: false, // No rollback after cleanup
      backupRetentionDays: 7 // Shorter retention
    },
    validation: {
      strictMode: true,
      allowDuplicates: false,
      validateDates: true,
      validateAmounts: true
    }
  } as PolicyMigrationConfig
};

/**
 * Get configuration for current environment
 */
export function getPolicyMigrationConfig(): PolicyMigrationConfig {
  const phase = process.env.POLICY_MIGRATION_PHASE || 'migration';
  
  if (phase in migrationPhaseConfigs) {
    return migrationPhaseConfigs[phase as keyof typeof migrationPhaseConfigs];
  }
  
  return defaultPolicyMigrationConfig;
}

/**
 * Environment variable overrides
 */
export function getConfigWithOverrides(): PolicyMigrationConfig {
  const baseConfig = getPolicyMigrationConfig();
  
  return {
    compatibility: {
      useTemplateSystem: process.env.USE_TEMPLATE_SYSTEM === 'true' ?? baseConfig.compatibility.useTemplateSystem,
      allowFallback: process.env.ALLOW_FALLBACK === 'true' ?? baseConfig.compatibility.allowFallback,
      migrateOnRead: process.env.MIGRATE_ON_READ === 'true' ?? baseConfig.compatibility.migrateOnRead
    },
    migration: {
      batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '') || baseConfig.migration.batchSize,
      enableAutoMigration: process.env.ENABLE_AUTO_MIGRATION === 'true' ?? baseConfig.migration.enableAutoMigration,
      enableRollback: process.env.ENABLE_ROLLBACK === 'true' ?? baseConfig.migration.enableRollback,
      backupRetentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '') || baseConfig.migration.backupRetentionDays
    },
    validation: {
      strictMode: process.env.STRICT_MODE === 'true' ?? baseConfig.validation.strictMode,
      allowDuplicates: process.env.ALLOW_DUPLICATES === 'true' ?? baseConfig.validation.allowDuplicates,
      validateDates: process.env.VALIDATE_DATES === 'true' ?? baseConfig.validation.validateDates,
      validateAmounts: process.env.VALIDATE_AMOUNTS === 'true' ?? baseConfig.validation.validateAmounts
    }
  };
}