import database from "infra/database.js";

async function status(req, res) {
  const updatedAt = new Date().toISOString();
  const pgSettingsQuery = await database.query("SHOW ALL;");

  const databaseName = process.env.POSTGRES_DB;
  const currentConnectionsQuery = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1",
    values: [databaseName],
  });

  const openedConnections = currentConnectionsQuery.rows[0].count;

  const { server_version, max_connections } = pgSettingsQuery.rows
    .filter(
      (row) => row.name === "max_connections" || row.name === "server_version",
    )
    .reduce((acc, row) => {
      acc[row.name] = row.setting;
      return acc;
    }, {});

  res.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: server_version,
        max_connections: parseInt(max_connections),
        opened_connections: openedConnections,
      },
    },
  });
}

export default status;
