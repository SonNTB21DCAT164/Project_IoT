function getData() {
  fetch("../json/data_sensor.json")
    .then(function (response) {
      return response.json();
    })
    .then(function (datas) {
      let placeholder = document.querySelector("#data-output");

      // Khởi tạo phân trang và trạng thái tìm kiếm, sắp xếp
      let currentPage = 1;
      let rowsPerPage = parseInt(document.querySelector("#itemperpage").value);
      let searchValue = ""; // giá trị tìm kiếm hiện tại
      let searchByColumn = "id";  // cột hiện tại muốn tìm kiếm
      let sortColumn = 0; // chỉ số của cột hiện tại đang được sắp xếp
      let sortAsc = true; // trạng thái sắp xếp, true: tăng dần
      let startDate = null;
      let endDate = null;

      // Hàm chuyển đổi chuỗi thời gian sang định dạng phù hợp với `datetime-local`
      function convertToDatetimeLocalFormat(dateString) {
        const [date, time] = dateString.split(" ");
        return `${date}T${time}`; // Kết hợp lại theo định dạng datetime-local
      }

      function displayTable() {
        // Lọc và sắp xếp dữ liệu
        const filteredData = datas // mảng lưu trữ các hàng có giá trị chứa dữ liệu được lọc và sắp xếp
        // lọc dữ liệu dựa trên giá trị tìm kiếm
          .filter((data) => {
            // nếu chưa nhập gì thì giữ lại hết, còn không thì giữ lại các hàng match với kết quả tìm kiếm (theo cột)
            // if (searchValue === "") return true;
            // return data[searchByColumn].toString().toLowerCase().includes(searchValue);

            // Lọc theo giá trị tìm kiếm
            if (searchValue !== "" && !data[searchByColumn].toString().toLowerCase().includes(searchValue)) {
              return false;
            }
            // Lọc theo thời gian
            if (startDate || endDate) {
              const dataTime = new Date(convertToDatetimeLocalFormat(data.time)); // Chuyển đổi chuỗi thành `Date` object
              if (startDate && dataTime < startDate) return false;
              if (endDate && dataTime > endDate) return false;
            }
            return true;
          })

        // sắp xếp dữ liệu dựa trên cột hiện tại (sortColumn)
        // nếu là số thì so sánh dưới dạng số, nếu không thì so sánh dạng chuỗi
          .sort((a, b) => {
            const firstRow = a[Object.keys(a)[sortColumn]].toString().toLowerCase();
            const secondRow = b[Object.keys(b)[sortColumn]].toString().toLowerCase();
            if (!isNaN(firstRow) && !isNaN(secondRow)) {
              return sortAsc ? firstRow - secondRow : secondRow - firstRow;
            } else {
              return sortAsc
                ? firstRow.localeCompare(secondRow)
                : secondRow.localeCompare(firstRow);
            }
          });

        // Tính toán phân trang dựa trên dữ liệu đã lọc
        const totalRows = filteredData.length; // số hàng sau khi lọc
        const totalPages = Math.ceil(totalRows / rowsPerPage); // Tính tổng số trang
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * rowsPerPage; // chỉ số hàng bắt đầu cho trang hiện tại
        const end = Math.min(start + rowsPerPage, totalRows);
        //const end = start + rowsPerPage; // chỉ số hàng kết thúc cho trang hiện tại
        const paginatedData = filteredData.slice(start, end); // phân trang dữ liệu bằng cách cắt mảng filteredData

        // Hiển thị dữ liệu đã phân trang
        let out = "";
        paginatedData.forEach((data) => {
          out += `
                <tr>
                    <td>${data.id}</td>
                    <td>${data.temperature}</td>
                    <td>${data.humidity}</td>
                    <td>${data.light}</td>
                    <td>${data.time}</td>
                </tr>
            `;
        });
        placeholder.innerHTML = out;
        // hiển thị số dòng hiện có trên 1 trang
        document.getElementById("row-info").textContent = `Showing ${paginatedData.length} of ${totalRows} rows`;
        // Cập nhật phân trang
        renderPagination(totalRows);
        
      }

      // Hàm phân trang
      function renderPagination(totalRows) {
        const pagination = document.querySelector(".pagination");
        pagination.innerHTML = ""; // reset thanh phân trang
        const totalPages = Math.ceil(totalRows / rowsPerPage); // tổng số trang hiện tại
        const maxVisiblePages = 5; // số trang tối đa hiển thị cùng 1 lúc trên thanh phân trang
    
        // Tạo nút "First" và "Prev"
        pagination.innerHTML += `<li class="first"><a href="#" id="first">First</a></li>`;
        pagination.innerHTML += `<li class="prev"><a href="#" id="prev">&#139;</a></li>`;
    
        // Hiển thị số trang
        if (totalPages <= maxVisiblePages) {
          // tạo các nút từ 1 đến totalPages, nút tương ứng với trang hiện tại có thêm class active
          for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<li class="page ${i === currentPage ? 'active' : ''}"><a href="#" data-page="${i}">${i}</a></li>`;
          }
        } else {
          // đảm bảo các trang được hiển thị xung quanh currentPage. startPage không nhỏ hơn 1, khi số trang hiện tại lớn hơn 5 thì startPage bắt đầu trước trang hiện tại 2 trang, endPage không lớn hơn totalPage, khi số trang hiện tại lớn hơn 5 thì endPage kết thúc sau trang hiện tại 2 trang
          let startPage = Math.max(1, currentPage - 2);
          let endPage = Math.min(totalPages, currentPage + 2);
          
          // nếu startPage>1, hiển thị nút cho trang đầu tiên là 1, hiển thị dấu ... trong trường hợp startPage>2
          if (startPage > 1) {
            pagination.innerHTML += `<li class="page"><a href="#" data-page="1">1</a></li>`;
            if (startPage > 2) pagination.innerHTML += `<li class="dots">...</li>`;
          }
          
          // nút tương ứng với trang hiện tại có thêm class active
          for (let i = startPage; i <= endPage; i++) {
            pagination.innerHTML += `<li class="page ${i === currentPage ? 'active' : ''}"><a href="#" data-page="${i}">${i}</a></li>`;
          }
          
          if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagination.innerHTML += `<li class="dots">...</li>`;
            pagination.innerHTML += `<li class="page ${totalPages === currentPage ? 'active' : ''}"><a href="#" data-page="${totalPages}">${totalPages}</a></li>`;
          }
        }
    
        // Tạo nút "Next" và "Last"
        pagination.innerHTML += `<li class="next"><a href="#" id="next">&#155;</a></li>`;
        pagination.innerHTML += `<li class="last"><a href="#" id="last">Last</a></li>`;
    
        // Cập nhật trạng thái của các nút
        updatePaginationState(totalPages);
      }

      function updatePaginationState(totalPages) {
        const firstButton = document.getElementById("first");
        const prevButton = document.getElementById("prev");
        const nextButton = document.getElementById("next");
        const lastButton = document.getElementById("last");

        firstButton.classList.toggle("disabled", currentPage === 1);
        prevButton.classList.toggle("disabled", currentPage === 1);
        nextButton.classList.toggle("disabled", currentPage === totalPages);
        lastButton.classList.toggle("disabled", currentPage === totalPages);
      }

      // Xử lý sự kiện phân trang
      document.querySelector(".pagination").addEventListener("click", function (e) {
        if (e.target.tagName === "A") { // nếu thẻ hiện tại là thẻ a
          e.preventDefault(); // ngăn không cho tải lại trang
          const page = e.target.dataset.page;
          const totalPages = Math.ceil(
            datas.filter((data) => data[searchByColumn].toString().toLowerCase().includes(searchValue)).length / rowsPerPage
          ); // Cập nhật lại tổng số trang dựa trên kết quả tìm kiếm

          if (page) {  
            currentPage = parseInt(page);
          } else if (e.target.id === "first") {
            currentPage = 1;
          } else if (e.target.id === "last") {
            currentPage = totalPages; // Sử dụng tổng số trang đã lọc
          } else if (e.target.id === "prev" && currentPage > 1) {
            currentPage--;
          } else if (e.target.id === "next" && currentPage < totalPages) {
            currentPage++;
          }
          displayTable();
        }
      });
      // Sự kiện cho bộ lọc thời gian
      document.querySelector("#startTime").addEventListener("change", function () {
        startDate = new Date(this.value); // Chuyển đổi giá trị đầu vào thành đối tượng `Date`
        currentPage = 1;
        displayTable();
      });
      document.querySelector("#endTime").addEventListener("change", function () {
        endDate = new Date(this.value); // Chuyển đổi giá trị đầu vào thành đối tượng `Date`
        currentPage = 1;
        displayTable();
      });
      // Xử lý sự kiện thay đổi số dòng hiển thị
      document.querySelector("#itemperpage").addEventListener("change", function () {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        displayTable();
      });

      // Xử lý sự kiện tìm kiếm
      const searchInput = document.querySelector(".input-group input");
      const searchSelect = document.querySelector("#searchBy");

      searchInput.addEventListener("input", function () {
        searchValue = this.value.toLowerCase(); // chuyển giá trị nhập vào về lowerCase
        currentPage = 1; // đảm bảo tìm kiếm bắt đầu từ trang 1
        displayTable(); // gọi hàm để tiến hành lọc và hiển thị
      });

      // Xử lý sự kiện thay đổi cột tìm kiếm
      searchSelect.addEventListener("change", function () {
        searchByColumn = this.value; // cập nhật xem tìm kiếm theo cột nào
        currentPage = 1; // đảm bảo tìm kiếm bắt đầu từ trang 1
        displayTable();
      });

      // Xử lý sự kiện sắp xếp
      const table_headings = document.querySelectorAll("thead th");
      table_headings.forEach((head, i) => {
        let sort_asc = true;
        head.onclick = () => {
          table_headings.forEach((h) => h.classList.remove("active"));
          head.classList.add("active"); // nếu tiêu đề cột được click, thêm class active vào tiêu đề đó
          // thêm hoặc loại bỏ class asc để chỉnh thứ tự sắp xếp và đảo ngược trạng thái cho lần thay đổi tiếp theo
          head.classList.toggle("asc", sort_asc); 
          sortAsc = head.classList.contains("asc");
          sortColumn = i;
          sort_asc = !sort_asc;
          displayTable();
        };
      });

      // Hiển thị bảng lần đầu (khi chưa áp dụng sắp xếp, tìm kiếm)
      displayTable();
    });
}

getData();