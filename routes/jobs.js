"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization only by admin
 */

router.post("/", ensureIsAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
	try {
		const q = req.query;
		if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
		if (q.hasEquity) q.hasEquity === "true";
		const jobs = await Job.findAll(q);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const job = await Job.get(id);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[id] => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization only by admin
 */

router.patch("/:id", ensureIsAdmin, async (req, res, next) => {
	try {
		const { id } = req.params;
		const validator = jsonschema.validate(req.body, jobUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.update(id, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization only by admin
 */

router.delete("/:id", ensureIsAdmin, async (req, res, next) => {
	try {
		const { id } = req.params;
		await Job.remove(id);
		return res.json({ deleted: +id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
