const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runPerformanceIndexes() {
  try {
    console.log('Adding performance indexes...');
    
    const sqlFile = path.join(__dirname, 'prisma', 'migrations', 'add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(trimmedStatement);
      }
    }
    
    console.log('Performance indexes added successfully!');
  } catch (error) {
    console.error('Error adding performance indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runPerformanceIndexes();