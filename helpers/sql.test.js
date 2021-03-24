const { sqlForPartialUpdate } = require("./sql");

describe("partial update columns", () => {
	test("update firstName, add new key", () => {
		const result = sqlForPartialUpdate({ firstName: "Aliya" }, { firstName: "Alla", age: 40 });
		expect(result).toEqual({ setCols: '"Alla"=$1', values: ["Aliya"] });
	});
	test("keep one column, update the second", () => {
		const result = sqlForPartialUpdate({ firstName: "Aliya", age: 47 }, { age: "age1" });
		expect(result).toEqual({ setCols: '"firstName"=$1, "age1"=$2', values: ["Aliya", 47] });
	});
});
