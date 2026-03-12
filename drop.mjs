import mysql from 'mysql2/promise';
import 'dotenv/config';

async function limparBanco() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ ERRO: DATABASE_URL não encontrada no ficheiro .env");
    process.exit(1);
  }

  try {
    const conn = await mysql.createConnection(dbUrl);
    console.log("⏳ Conectado ao banco. Iniciando limpeza profunda...");

    // 1. Desliga a verificação de chaves estrangeiras (O segredo para não dar erro!)
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 2. Busca o nome de todas as tabelas do seu banco de dados
    const [tables] = await conn.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE();
    `);

    // 3. Deleta cada tabela encontrada
    for (const t of tables) {
      const tableName = t.table_name || t.TABLE_NAME;
      await conn.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      console.log(`🗑️  Tabela '${tableName}' apagada.`);
    }

    // 4. Volta a ligar a verificação de chaves estrangeiras por segurança
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log("✅ Banco de dados completamente zerado com sucesso!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro ao limpar o banco:", error);
    process.exit(1);
  }
}

limparBanco();