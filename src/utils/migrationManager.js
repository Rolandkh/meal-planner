/**
 * Migration Manager
 * Handles schema version tracking and migration execution
 * Slice 3 - Task 46
 */

/**
 * Migration Manager Class
 * Tracks schema versions and runs migrations in sequence
 */
export class MigrationManager {
  constructor() {
    this.migrations = [];
    this.currentVersion = 0;
  }
  
  /**
   * Register a migration function
   * @param {number} version - Target version number
   * @param {Function} migrationFn - Async function that performs migration
   */
  registerMigration(version, migrationFn) {
    this.migrations.push({ version, migrationFn });
    // Sort migrations by version to ensure correct order
    this.migrations.sort((a, b) => a.version - b.version);
  }
  
  /**
   * Run all pending migrations
   * @returns {Promise<Object>} Result object with success status
   */
  async runMigrations() {
    try {
      // Get current schema version from localStorage
      const savedVersion = localStorage.getItem('vanessa_schema_version');
      this.currentVersion = savedVersion ? parseInt(savedVersion, 10) : 0;
      
      // Find migrations that need to be run
      const pendingMigrations = this.migrations.filter(m => m.version > this.currentVersion);
      
      if (pendingMigrations.length === 0) {
        console.log('No migrations needed');
        return { 
          success: true, 
          message: 'No migrations needed',
          currentVersion: this.currentVersion
        };
      }
      
      console.log(`Running ${pendingMigrations.length} migration(s)...`);
      
      // Run migrations in order
      for (const migration of pendingMigrations) {
        console.log(`Running migration to version ${migration.version}...`);
        const result = await migration.migrationFn();
        
        if (!result.success) {
          console.error(`Migration to version ${migration.version} failed:`, result.error);
          return { 
            success: false, 
            error: 'MIGRATION_FAILED', 
            version: migration.version,
            details: result.error || result.message
          };
        }
        
        // Update version after successful migration
        this.currentVersion = migration.version;
        localStorage.setItem('vanessa_schema_version', String(this.currentVersion));
        console.log(`✓ Migration to version ${migration.version} completed`);
      }
      
      return { 
        success: true, 
        message: `Migrations completed. Current version: ${this.currentVersion}`,
        currentVersion: this.currentVersion,
        migrationsRun: pendingMigrations.length
      };
    } catch (error) {
      console.error('Error during migrations:', error);
      return { 
        success: false, 
        error: 'MIGRATION_ERROR', 
        message: error.message 
      };
    }
  }
}




