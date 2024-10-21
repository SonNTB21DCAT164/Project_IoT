// chọn ô input và các hàng trong bảng
const search = document.querySelector(".input-group input");
table_rows = document.querySelectorAll("tbody tr");

// search
search.addEventListener("input", function () {
  // duyệt từng hàng, lấy dữ liệu và kiểm tra xem dữ liệu trong hàng có chứa dữ liệu được nhập vào hay không
  table_rows.forEach((row, i) => {
    let table_data = row.textContent.toLowerCase(),
      search_data = search.value.toLowerCase();
    // nếu chứa thì bỏ class hidden, nếu không chứa thì gọi class hidden
    row.classList.toggle("hidden", table_data.indexOf(search_data) < 0);
    // set thời gian trượt của từng hàng tăng dần
    row.style.setProperty("--delay", i / 25 + "s");
    // xét các hàng query thành công, đặt lại background cho xen kẽ như ban đầu
    document
      .querySelectorAll("tbody tr:not(.hidden)")
      .forEach((visible_row, i) => {
        visible_row.style.backgroundColor =
          i % 2 == 0 ? "transparent" : "#e2dfdf";
      });
  });
});

// sort
// chọn header
const table_headings = document.querySelectorAll("thead th");
// duyệt qua từng header
table_headings.forEach((head, i) => {
  let sort_asc = true;
  // nếu được click thì kích hoạt class active
  head.onclick = () => {
    table_headings.forEach((head) => head.classList.remove("active"));
    head.classList.add("active");
    // reset lại table data
    document
      .querySelectorAll("td")
      .forEach((td) => td.classList.remove("active"));
    // duyệt từng hàng và thêm class active cho từng table data
    table_rows.forEach((row) => {
      row.querySelectorAll("td")[i].classList.add("active");
    });
    // quay ngược icon arrow mỗi khi click vào header và nếu chứa class asc thì sắp xếp tăng dần
    head.classList.toggle("asc", sort_asc);
    // nếu chứa class asc (mũi tên đang quay lên) thì trả về true (sắp xếp tăng dần)
    sort_asc = head.classList.contains("asc") ? false : true;
    sortTable(i, sort_asc);
  };
});

function sortTable(column, sort_asc) {
  // lấy ra các hàng trong table body
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  // sắp xếp các hàng
  rows.sort((a, b) => {
    // so sánh các table data ở 2 hàng trên cùng 1 cột
    let first_row = a.querySelectorAll("td")[column].textContent.toLowerCase();
    let second_row = b.querySelectorAll("td")[column].textContent.toLowerCase();
    // kiểm tra cả 2 trường hợp table data là số hoặc không
    if (!isNaN(first_row) && !isNaN(second_row)) {
      return sort_asc
        ? parseInt(first_row) - parseInt(second_row)
        : parseInt(second_row) - parseInt(first_row);
    } else {
      return sort_asc
        ? first_row.localeCompare(second_row)
        : second_row.localeCompare(first_row);
    }
  });
  // thêm các hàng đã sắp xếp vào table body
  rows.forEach((row) => tbody.appendChild(row));
  // xét các hàng query thành công, đặt lại background cho xen kẽ như ban đầu
  document
    .querySelectorAll("tbody tr:not(.hidden)")
    .forEach((visible_row, i) => {
      visible_row.style.backgroundColor =
        i % 2 == 0 ? "transparent" : "#e2dfdf";
    });
}
// function sortTable(column, sort_asc) {
//   [...table_rows]
//     .sort((a, b) => {
//       let first_row = a
//           .querySelectorAll("td")
//           [column].textContent.toLowerCase(),
//         second_row = b.querySelectorAll("td")[column].textContent.toLowerCase();

//       return sort_asc
//         ? first_row < second_row
//           ? 1
//           : -1
//         : first_row < second_row
//         ? -1
//         : 1;
//     })
//     .map((sorted_row) =>
//       document.querySelector("tbody").appendChild(sorted_row)
//     );
// }
