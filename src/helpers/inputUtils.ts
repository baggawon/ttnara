export const inputToLocaleString = ({
  event,
  decimal,
  setValues,
}: {
  event: any;
  decimal?: number;
  setValues?: any;
}) => {
  if (event.target.value === "") return;
  const value = Number(
    event.target.value ? event.target.value.replace(/,/g, "") : ""
  );
  if (Number.isNaN(value)) {
    event.target.value = Number(
      event.target.value.replace(/[^0-9.]/g, "")
    ).toLocaleString() as any;
    if (setValues) {
      setValues(event.target.name, event.target.value);
    }
    return;
  }
  if (decimal) {
    const convertValue = event.target.value.replace(/[^0-9.]/g, "");
    const [first, second] = convertValue.split(".");
    if (second?.length > decimal) {
      event.target.value = Number(
        `${first}.${second.slice(0, decimal)}`
      ).toLocaleString();
      if (setValues) {
        setValues(event.target.name, event.target.value);
      }
      return;
    } else {
      event.target.value = `${Number(first).toLocaleString()}${second || convertValue.includes(".") ? `.${second ?? ""}` : ""}`;
      if (setValues) {
        setValues(event.target.name, event.target.value);
      }
      return;
    }
  }
  event.target.value = value.toLocaleString();
  if (setValues) {
    setValues(event.target.name, event.target.value);
  }
};
