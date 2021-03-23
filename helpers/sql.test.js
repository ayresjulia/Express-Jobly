const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("partial update columns", function () {
	test("update firstName, add new key", function () {
		const result = sqlForPartialUpdate({ firstName: "Aliya" }, { firstName: "Alla", age: 40 });
		expect(result).toBe({ setCols: '"Alla"=$1', values: ["Aliya"] });
	});
});
