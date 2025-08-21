#!/usr/bin/env python3
"""
Database migration runner for NC Healthcare Vulnerability Index.
Executes SQL migration files in order.
"""

import sys
import os
from pathlib import Path
import psycopg2
import logging
from typing import List

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.database import check_database_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_migration_files(migrations_dir: Path) -> List[Path]:
    """
    Get list of migration files in order.
    
    Args:
        migrations_dir: Directory containing migration files
        
    Returns:
        List of migration file paths in execution order
    """
    migration_files = []
    
    for file_path in migrations_dir.glob("*.sql"):
        migration_files.append(file_path)
    
    # Sort by filename (should start with numbers like 001_, 002_, etc.)
    migration_files.sort(key=lambda x: x.name)
    
    return migration_files


def create_migrations_table(cursor) -> None:
    """Create table to track executed migrations."""
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            success BOOLEAN DEFAULT TRUE,
            error_message TEXT
        );
    """)
    
    logger.info("Created schema_migrations table")


def get_executed_migrations(cursor) -> set:
    """Get set of already executed migration filenames."""
    
    try:
        cursor.execute("SELECT filename FROM schema_migrations WHERE success = TRUE;")
        executed = {row[0] for row in cursor.fetchall()}
        logger.info(f"Found {len(executed)} previously executed migrations")
        return executed
    except psycopg2.Error:
        # Table doesn't exist yet
        return set()


def execute_migration(cursor, migration_file: Path) -> bool:
    """
    Execute a single migration file.
    
    Args:
        cursor: Database cursor
        migration_file: Path to migration file
        
    Returns:
        True if successful, False otherwise
    """
    filename = migration_file.name
    
    try:
        logger.info(f"Executing migration: {filename}")
        
        # Read migration file
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        cursor.execute(migration_sql)
        
        # Record successful execution
        cursor.execute("""
            INSERT INTO schema_migrations (filename, success)
            VALUES (%s, %s)
            ON CONFLICT (filename) DO UPDATE SET
                executed_at = NOW(),
                success = %s,
                error_message = NULL;
        """, (filename, True, True))
        
        logger.info(f"Successfully executed migration: {filename}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to execute migration {filename}: {error_msg}")
        
        # Record failed execution
        try:
            cursor.execute("""
                INSERT INTO schema_migrations (filename, success, error_message)
                VALUES (%s, %s, %s)
                ON CONFLICT (filename) DO UPDATE SET
                    executed_at = NOW(),
                    success = %s,
                    error_message = %s;
            """, (filename, False, error_msg, False, error_msg))
        except:
            pass  # Don't fail if we can't record the error
        
        return False


def run_migrations() -> bool:
    """
    Run all pending database migrations.
    
    Returns:
        True if all migrations successful, False otherwise
    """
    migrations_dir = backend_dir / "migrations"
    
    if not migrations_dir.exists():
        logger.error(f"Migrations directory not found: {migrations_dir}")
        return False
    
    # Check database connection
    if not check_database_connection():
        logger.error("Cannot connect to database")
        return False
    
    # Get migration files
    migration_files = get_migration_files(migrations_dir)
    
    if not migration_files:
        logger.info("No migration files found")
        return True
    
    logger.info(f"Found {len(migration_files)} migration files")
    
    # Connect to database
    try:
        # Extract connection parameters from DATABASE_URL_SYNC
        db_url = settings.DATABASE_URL_SYNC
        
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cursor = conn.cursor()
        
        # Create migrations tracking table
        create_migrations_table(cursor)
        conn.commit()
        
        # Get already executed migrations
        executed_migrations = get_executed_migrations(cursor)
        
        # Execute pending migrations
        success_count = 0
        total_migrations = len(migration_files)
        
        for migration_file in migration_files:
            filename = migration_file.name
            
            if filename in executed_migrations:
                logger.info(f"Skipping already executed migration: {filename}")
                success_count += 1
                continue
            
            if execute_migration(cursor, migration_file):
                conn.commit()
                success_count += 1
            else:
                conn.rollback()
                logger.error(f"Migration failed: {filename}")
                break
        
        # Close connection
        cursor.close()
        conn.close()
        
        if success_count == total_migrations:
            logger.info(f"All {total_migrations} migrations completed successfully")
            return True
        else:
            logger.error(f"Only {success_count}/{total_migrations} migrations completed")
            return False
            
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def reset_database() -> bool:
    """
    Reset database by dropping all tables and re-running migrations.
    USE WITH CAUTION - THIS WILL DELETE ALL DATA.
    
    Returns:
        True if successful, False otherwise
    """
    logger.warning("RESETTING DATABASE - ALL DATA WILL BE LOST")
    
    try:
        conn = psycopg2.connect(settings.DATABASE_URL_SYNC)
        conn.autocommit = False
        cursor = conn.cursor()
        
        # Drop all tables
        cursor.execute("""
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE EXTENSION IF NOT EXISTS postgis_topology;
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("Database reset completed")
        
        # Run migrations
        return run_migrations()
        
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        return False


def main():
    """Main function with command line argument handling."""
    
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        # Reset database
        confirmation = input("Are you sure you want to reset the database? This will delete ALL data. Type 'yes' to confirm: ")
        
        if confirmation.lower() == 'yes':
            success = reset_database()
        else:
            logger.info("Database reset cancelled")
            return
    else:
        # Run normal migrations
        success = run_migrations()
    
    if success:
        logger.info("Migration process completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration process failed")
        sys.exit(1)


if __name__ == "__main__":
    main()