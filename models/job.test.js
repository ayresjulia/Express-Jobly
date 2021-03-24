"use strict";

const db = require("../db.js");
const { BadRequestError } = require("../expressError");
const Job = require("./job.js");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("creating a job", () => {
	const newJob = {
		title: "new",
		salary: 100,
		equity: "0",
		companyHandle: "c1"
	};

	test("create new job", async () => {
		let job = await Job.create(newJob);

		expect(job).toEqual({
			...newJob,
			id: expect.any(Number)
		});
	});
});

describe("get all jobs", () => {
	test("findAll jobs", async () => {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
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
		]);
	});
	test("error if invalid job id", async () => {
		try {
			await Job.get("nope");
			fail();
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
});

describe("get a job by id", () => {
	test("works", async () => {
		let test = await Job.create({
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3"
		});
		let targetId = test.id;

		let job = await Job.get(targetId);
		expect(job).toEqual({
			id: targetId,
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3",
			company: [
				{
					handle: "c3",
					name: "C3",
					description: "Desc3",
					numEmployees: 3,
					logoUrl: "http://c3.img"
				}
			]
		});
	});

	test("not found if no such job", async () => {
		try {
			await Job.get("nope");
			fail();
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
});

describe("update a job", () => {
	const updateData = {
		title: "New",
		salary: 75
	};

	test("creating test job and updating partially", async () => {
		let test = await Job.create({
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3"
		});
		let targetId = test.id;

		let job = await Job.update(targetId, updateData);
		expect(job).toEqual({
			id: targetId,
			companyHandle: "c3",
			equity: "0",
			...updateData
		});
	});

	test("works with null fields", async () => {
		const updateDataSetNulls = {
			title: "New Title",
			salary: null,
			equity: null
		};
		let test = await Job.create({
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3"
		});

		let targetId = test.id;

		let job = await Job.update(targetId, updateDataSetNulls);
		expect(job).toEqual({
			id: targetId,
			companyHandle: "c3",
			...updateDataSetNulls
		});
	});
	test("not found if no such job", async () => {
		try {
			await Job.update("nope", updateData);
			fail();
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
	test("bad request with no data", async () => {
		try {
			let test = await Job.create({
				title: "test",
				salary: 100,
				equity: "0",
				companyHandle: "c3"
			});

			let targetId = test.id;
			await Job.update(targetId, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

describe("remove a job", () => {
	test("works", async () => {
		let test = await Job.create({
			title: "test",
			salary: 100,
			equity: "0",
			companyHandle: "c3"
		});
		let targetId = test.id;
		await Job.remove(targetId);

		const res = await db.query("SELECT id FROM jobs WHERE id=$1", [targetId]);
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such job", async () => {
		try {
			await Job.remove("nope");
			fail();
		} catch (err) {
			expect(err).toBeTruthy();
		}
	});
});
