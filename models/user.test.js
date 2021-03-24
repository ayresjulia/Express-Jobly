"use strict";

const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const Job = require("./job.js");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("authenticate a user", () => {
	test("authenticating with username and password", async () => {
		const user = await User.authenticate("u1", "password1");
		expect(user).toEqual({
			username: "u1",
			firstName: "U1F",
			lastName: "U1L",
			email: "u1@email.com",
			isAdmin: false
		});
	});

	test("unauth if no such user", async () => {
		try {
			await User.authenticate("nope", "password");
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});

	test("unauth if wrong password", async () => {
		try {
			await User.authenticate("c1", "wrong");
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

describe("register a user", () => {
	const newUser = {
		username: "new",
		firstName: "Test",
		lastName: "Tester",
		email: "test@test.com",
		isAdmin: false
	};

	test("register user with data and valid password", async () => {
		let user = await User.register({
			...newUser,
			password: "password"
		});
		expect(user).toEqual(newUser);
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(false);
		expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
	});

	test("works if adds admin auth", async () => {
		let user = await User.register({
			...newUser,
			password: "password",
			isAdmin: true
		});
		expect(user).toEqual({ ...newUser, isAdmin: true });
		const found = await db.query("SELECT * FROM users WHERE username = 'new'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(true);
		expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
	});

	test("bad request with duplicate data", async () => {
		try {
			await User.register({
				...newUser,
				password: "password"
			});
			await User.register({
				...newUser,
				password: "password"
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("findAll users", () => {
	test("works to search for all users", async () => {
		const users = await User.findAll();
		expect(users).toEqual([
			{
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "u1@email.com",
				isAdmin: false
			},
			{
				username: "u2",
				firstName: "U2F",
				lastName: "U2L",
				email: "u2@email.com",
				isAdmin: false
			}
		]);
	});
});

describe("get a user", () => {
	test("get user by username", async () => {
		let user = await User.get("u1");
		expect(user).toEqual({
			username: "u1",
			firstName: "U1F",
			lastName: "U1L",
			email: "u1@email.com",
			isAdmin: false,
			applications: []
		});
	});

	test("not found if no such user", async () => {
		try {
			await User.get("nope");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("update a user", () => {
	const updateData = {
		firstName: "NewF",
		lastName: "NewF",
		email: "new@email.com",
		isAdmin: true
	};

	test("updating user data", async () => {
		let job = await User.update("u1", updateData);
		expect(job).toEqual({
			username: "u1",
			...updateData
		});
	});

	test("setting new password", async () => {
		let job = await User.update("u1", {
			password: "new"
		});
		expect(job).toEqual({
			username: "u1",
			firstName: "U1F",
			lastName: "U1L",
			email: "u1@email.com",
			isAdmin: false
		});
		const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
	});

	test("not found if no such user", async () => {
		try {
			await User.update("nope", {
				firstName: "test"
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request if no data", async () => {
		expect.assertions(1);
		try {
			await User.update("c1", {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("remove a user", () => {
	test("works", async function () {
		await User.remove("u1");
		const res = await db.query("SELECT * FROM users WHERE username='u1'");
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such user", async () => {
		try {
			await User.remove("nope");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe("apply for job", () => {
	test("works if admin or logged in user", async () => {
		let test = await Job.create({
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3"
		});
		let targetId = test.id;

		await User.apply("u1", targetId);
		const res = await db.query(`SELECT * FROM applications WHERE job_id=$1`, [targetId]);
		expect(res.rows).toEqual([
			{
				job_id: targetId,
				username: "u1"
			}
		]);
	});
	test("error if invalid user", async () => {
		try {
			await User.apply("xxx", expect.any(Number));
			expect(res.rows.length).toEqual(0);
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
	test("error if invalid job", async () => {
		try {
			await User.apply("u1", 9999);
			expect(res.rows.length).toEqual(0);
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
});
