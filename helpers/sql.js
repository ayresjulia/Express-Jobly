const { BadRequestError } = require("../expressError");

/**
 * partial update to sql columns for company, user, job
 * no data returns custom BadRequestError
 * dataToUpdate: pass data necessary to update the table
 * jsToSql: turn keys to have numbered $1 $2 values
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	// get all keys from the data provided, throw an error if empty
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
