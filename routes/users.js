"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");

const { ensureIsAdmin, ensureIsAdminOrUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const { createToken } = require("../helpers/tokens");
const User = require("../models/user");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post("/", ensureIsAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, userNewSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.register(req.body);
		const token = createToken(user);
		return res.status(201).json({ user, token });
	} catch (err) {
		return next(err);
	}
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get("/", ensureIsAdmin, async (req, res, next) => {
	try {
		const users = await User.findAll();
		return res.json({ users });
	} catch (err) {
		return next(err);
	}
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureIsAdminOrUser, async (req, res, next) => {
	try {
		const user = await User.get(req.params.username);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureIsAdminOrUser, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, userUpdateSchema);
		if (!validator.valid) {
			const errs = validator.errors.map(e => e.stack);
			throw new BadRequestError(errs);
		}

		const user = await User.update(req.params.username, req.body);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureIsAdminOrUser, async (req, res, next) => {
	try {
		const { username } = req.params;
		await User.remove(username);
		return res.json({ deleted: username });
	} catch (err) {
		return next(err);
	}
});

router.post("/:username/jobs/:id", ensureIsAdminOrUser, async (req, res, next) => {
	try {
		const { username } = req.params;
		const { id } = req.params;
		await User.apply(username, id);

		return res.json({ applied: +id });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
