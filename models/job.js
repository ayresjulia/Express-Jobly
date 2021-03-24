"use strict";
const { NotFoundError } = require("../expressError");
const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { id, title, salary, equity, company_handle }
	 *
	 * Returns { id, title, salary, equity, company_handle }
	 *
	 * Throws BadRequestError if job already in database.
	 * */

	static async create({ title, salary, equity, companyHandle }) {
		const result = await db.query(
			`INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[title, salary, equity, companyHandle]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
	 *
	 * Returns [{ id, title, salary, equity, companyHandle }, ...]
	 *
	 * Filter jobs by minSalary, title or hasEquity.
	 * */

	static async findAll(searchFilters = {}) {
		let query = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                 FROM jobs`;

		let whereExpressions = [];
		let queryValues = [];

		const { title, minSalary, hasEquity } = searchFilters;

		if (title !== undefined) {
			queryValues.push(`%${title}%`);
			whereExpressions.push(`title ILIKE $${queryValues.length}`);
		}

		if (minSalary !== undefined) {
			queryValues.push(minSalary);
			whereExpressions.push(`salary >= $${queryValues.length}`);
		}

		if (hasEquity === true) {
			queryValues.push(hasEquity);
			whereExpressions.push(`equity > 0`);
		}

		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		query += " ORDER BY id";
		const jobsRes = await db.query(query, queryValues);
		return jobsRes.rows;
	}

	/** Given a job id, return data about a job.
	 *
	 * Returns { id, title, salary, equity, companyHandle, company }
	 *   where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(id) {
		const jobRes = await db.query(
			`SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[id]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job found with ID: ${id}`);

		const companyRes = await db.query(
			`
        SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
        FROM companies WHERE handle = $1`,
			[job.companyHandle]
		);

		job.company = companyRes.rows;

		return job;
	}

	/** Update job data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {title, salary, equity, companyHandle}
	 *
	 * Returns {id, title, salary, equity, companyHandle}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});
		const idVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job found with ID: ${id}`);

		return job;
	}

	/** Delete given job from database; returns undefined.
	 *
	 * Throws NotFoundError if job not found.
	 **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
			[id]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job found with ID: ${id}`);
	}
}

module.exports = Job;
