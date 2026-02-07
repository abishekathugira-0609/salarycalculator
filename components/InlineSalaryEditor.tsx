"use client";

type Props = {
  currentSalary: number;
  stateCode: string;
};

export default function InlineSalaryEditor({
  currentSalary,
  stateCode,
}: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const input = form.elements.namedItem("salary") as HTMLInputElement;

    const salary = input.value;
    if (!salary) return;

    window.location.href = `/calculator?salary=${salary}&state=${stateCode}`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex flex-col sm:flex-row gap-3"
    >
      <input
        name="salary"
        type="number"
        defaultValue={currentSalary}
        min={10000}
        step={1000}
        className="border rounded-lg px-3 py-2 w-48"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Calculate
      </button>
    </form>
  );
}
