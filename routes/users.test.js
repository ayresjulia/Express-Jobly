"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, adminToken, jobIds } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /users -> create a user", () => {
	test("works for only admin: create non-admin", async () => {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: false
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: false
			},
			token: expect.any(String)
		});
	});

	test("works for only admin: create admin", async () => {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: true
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: true
			},
			token: expect.any(String)
		});
	});

	test("unauth for users", async () => {
		const resp = await request(app).post("/users").send({
			username: "u-new",
			firstName: "First-new",
			lastName: "Last-newL",
			password: "password-new",
			email: "new@email.com",
			isAdmin: true
		});

		expect(resp.statusCode).toEqual(401);
	});

	test("bad request if missing data", async () => {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request if invalid data", async () => {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "not-an-email",
				isAdmin: true
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

describe("GET /users -> get all users", () => {
	test("works for only admins", async () => {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			users: [
				{
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false
				},
				{
					username: "u2",
					firstName: "U2F",
					lastName: "U2L",
					email: "user2@user.com",
					isAdmin: false
				},
				{
					username: "u3",
					firstName: "U3F",
					lastName: "U3L",
					email: "user3@user.com",
					isAdmin: false
				}
			]
		});
	});

	test("unauth for anon", async () => {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: test next() handler", async () => {
		await db.query("DROP TABLE users CASCADE");
		const resp = await request(app).get("/users").set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(500);
	});
});

describe("GET /users/:username -> get user by username", () => {
	test("works for users", async () => {
		const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
				applications: []
			}
		});
	});

	test("unauth for anon", async () => {
		const resp = await request(app).get(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user not found", async () => {
		const resp = await request(app).get(`/users/nope`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});

describe("PATCH /users/:username -> update user data", () => {
	test("works for users", async () => {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false
			}
		});
	});

	test("unauth for anon", async () => {
		const resp = await request(app).patch(`/users/u1`).send({
			firstName: "New"
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if no such user", async () => {
		const resp = await request(app)
			.patch(`/users/nope`)
			.send({
				firstName: "Nope"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request if invalid data", async () => {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 42
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("works: set new password", async () => {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				password: "new-password"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false
			}
		});
		const isSuccessful = await User.authenticate("u1", "new-password");
		expect(isSuccessful).toBeTruthy();
	});
});

describe("DELETE /users/:username -> delete user by username", () => {
	test("works for users", async () => {
		const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("unauth for anon", async () => {
		const resp = await request(app).delete(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user missing", async () => {
		const resp = await request(app).delete(`/users/nope`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});

describe("POST /users/:username/jobs/:id -> user can apply for job", () => {
	test("works for admin", async () => {
		const resp = await request(app).post(`/users/u1/jobs/${jobIds[1]}`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ applied: jobIds[1] });
	});

	test("works for same user", async () => {
		const resp = await request(app).post(`/users/u1/jobs/${jobIds[1]}`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ applied: jobIds[1] });
	});

	test("unauth if NOT admin and NOT user", async () => {
		const resp = await request(app).post(`/users/u1/jobs/${jobIds[1]}`);
		expect(resp.statusCode).toEqual(401);
	});
});
