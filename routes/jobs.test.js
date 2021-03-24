"use strict";

const request = require("supertest");

const app = require("../app");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, adminToken, jobIds } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /jobs -> create a new job", () => {
	const newJob = {
		title: "new",
		salary: 100,
		equity: "0",
		companyHandle: "c3"
	};

	test("OK only for admins", async () => {
		const resp = await request(app).post("/jobs").send(newJob).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: { id: expect.any(Number), title: "new", salary: 100, equity: "0", companyHandle: "c3" }
		});
	});

	test("bad request with missing data", async () => {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "bad",
				companyHandle: "c1"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async () => {
		const resp = await request(app)
			.post("/jobs")
			.send({
				...newJob,
				salary: "not-a-salary"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

describe("GET /jobs -> get all jobs ", () => {
	test("ok for anyone to get", async () => {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "j1",
					salary: 100,
					equity: "0",
					companyHandle: "c1"
				},
				{
					id: expect.any(Number),
					title: "j2",
					salary: 200,
					equity: "0",
					companyHandle: "c2"
				},
				{
					id: expect.any(Number),
					title: "j3",
					salary: 300,
					equity: "0",
					companyHandle: "c3"
				}
			]
		});
	});
});

describe("GET /jobs/:id -> get job by id", () => {
	test("ok for anyone to get", async () => {
		const resp = await request(app).get(`/jobs/${jobIds[1]}`);
		expect(resp.body).toEqual({
			job: {
				id: jobIds[1],
				title: "j2",
				salary: 200,
				equity: "0",
				companyHandle: "c2",
				company: [
					{
						description: "Desc2",
						handle: "c2",
						logoUrl: "http://c2.img",
						name: "C2",
						numEmployees: 2
					}
				]
			}
		});
	});

	test("job id doesn't exist", async () => {
		const resp = await request(app).get(`/jobs/999`);
		expect(resp.statusCode).toEqual(404);
	});
});

describe("PATCH /jobs/:id -> update data for jobs", () => {
	test("OK only for admins", async () => {
		const resp = await request(app)
			.patch(`/jobs/${jobIds[1]}`)
			.send({
				title: "jjj2"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			job: {
				id: jobIds[1],
				title: "jjj2",
				salary: 200,
				equity: "0",
				companyHandle: "c2"
			}
		});
	});

	test("unauth if NOT an admin", async () => {
		const resp = await request(app).patch(`/jobs/${jobIds[1]}`).send({
			name: "j1-new"
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("job id not found", async () => {
		const resp = await request(app)
			.patch(`/jobs/9999`)
			.send({
				name: "will not work"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async () => {
		const resp = await request(app)
			.patch(`/jobs/${jobIds[1]}`)
			.send({
				salary: "bad salary"
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

describe("DELETE /jobs/:id -> delete job by id", () => {
	test("OK only for admins", async () => {
		const resp = await request(app).delete(`/jobs/${jobIds[1]}`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: jobIds[1] });
	});

	test("unauth if NOT an admin", async () => {
		const resp = await request(app).delete(`/jobs/${jobIds[1]}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("job id doesn't exist", async () => {
		const resp = await request(app).delete(`/jobs/6578909`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
