"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const { authenticateJWT, ensureLoggedIn, ensureIsAdmin, ensureIsAdminOrUser } = require("./auth");

const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

describe("authenticateJWT", () => {
	test("works: via header", () => {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${testJwt}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({
			user: {
				iat: expect.any(Number),
				username: "test",
				isAdmin: false
			}
		});
	});

	test("works: no header", () => {
		expect.assertions(2);
		const req = {};
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});

	test("works: invalid token", () => {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${badJwt}` } };
		const res = { locals: {} };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
});

describe("ensureLoggedIn", () => {
	test("works", function () {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: "test", is_admin: false } } };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		ensureLoggedIn(req, res, next);
	});

	test("unauth if no login", () => {
		expect.assertions(1);
		const req = {};
		const res = { locals: {} };
		const next = function (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureLoggedIn(req, res, next);
	});
});

describe("ensureIsAdmin", () => {
	test("error if not an admin", () => {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: "test", isAdmin: false } } };
		const next = function (err) {
			expect(err).toBeTruthy();
		};
		ensureIsAdmin(req, res, next);
	});
});

describe("ensureIsAdminOrUser", () => {
	test("is admin && is current user", () => {
		expect.assertions(1);
		const req = { params: { username: "test" } };
		const res = { locals: { user: { username: "test", isAdmin: true } } };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		ensureIsAdminOrUser(req, res, next);
	});
	test("is NOT admin && is current user", () => {
		expect.assertions(1);
		const req = { params: { username: "test" } };
		const res = { locals: { user: { username: "test", isAdmin: false } } };
		const next = function (err) {
			expect(err).toBeFalsy();
		};
		ensureIsAdminOrUser(req, res, next);
	});
	test("throw error : is NOT admin && is NOT current user", () => {
		expect.assertions(1);
		const req = { params: { username: "test" } };
		const res = { locals: { user: { username: "notuser", isAdmin: false } } };
		const next = function (err) {
			expect(err).toBeTruthy();
		};
		ensureIsAdminOrUser(req, res, next);
	});
});
