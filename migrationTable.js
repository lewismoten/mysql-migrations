var config = require('./config');

const create = () => `
    CREATE TABLE IF NOT EXISTS \`${config.table}\` (
      \`timestamp\` varchar(254) NOT NULL UNIQUE
    )
  `;

const selectLatest = (count = 1) => `
    SELECT \`timestamp\`
    FROM \`${config.table}\`
    ORDER BY \`timestamp\` DESC
    LIMIT ${count}
  `;

const selectAll = () => `
    SELECT \`timestamp\`
    FROM \`${config.table}\`
  `;

const insertOne = (timestamp) => `
    INSERT INTO ${config.table} (
      \`timestamp\`
    ) VALUES (
      '${timestamp}'
    )
`;
const deleteOne = (timestamp) => `
    DELETE FROM
      ${config.table}
    WHERE
      \`timestamp\` = '${timestamp}'
`;

module.exports = {
  create,
  selectLatest,
  selectAll,
  insertOne,
  deleteOne
}