async function loadIntoTable(url, table) {
  const tableHead = table.querySelector("thead");
  const tableBody = table.querySelector("tbody");
  //   await để ngăn đoạn mã ở dưới chạy khi api chưa về
  const response = await fetch(url);
  const { header, rows } = await response.json();
  //   clear the table
  tableHead.innerHTML = "<tr></tr>";
  tableBody.innerHTML = "";
  // fill data into header
  for (const headerText of header) {
    const headerElement = document.createElement("th");
    headerElement.textContent = headerText;
    tableHead.querySelector("tr").appendChild(headerElement);
  }

  // fill data into rows
  for (const row of rows) {
    const rowElement = document.createElement("tr");
    for (const cellText of row) {
      const cellElement = document.createElement("td");
      cellElement.textContent = cellText;
      rowElement.appendChild(cellElement);
    }
    tableBody.appendChild(rowElement);
  }
}

loadIntoTable("../json/data.json", document.querySelector("table"));
