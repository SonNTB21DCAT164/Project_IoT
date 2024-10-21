var filter = {
    limit: 10,
    sorts: '-time',
    search: '',
    col: 'id',
    count: 0,
    total: 0,
    page: 1,
    sensorData: [], // Thêm biến để lưu dữ liệu sensor
    getSkip() {
      return (this.page - 1) * this.limit;
    },
    getSortCol() {
      return this.sorts.substring(1);
    },
    isSortAsc() {
      return this.sorts.substring(0, 1) == "+";
    }
  };
  
  $(document).ready(function () {
    // Lần đầu tiên load trang sẽ tải dữ liệu
    getSensorData(true); // true để chỉ tải dữ liệu mới lần đầu
  });
  
  $(document).on('change', '#itemperpage', (e) => {
    filter.limit = parseInt(e.target.value);
    if (filter.getSkip() > filter.total) {
      filter.page = Math.ceil(filter.total / filter.limit);
    }
    getSensorData(false); // false để không tải lại dữ liệu mới khi chuyển trang
  });
  
  $(document).on('change', '#searchBy', (e) => {
    filter.col = e.target.value;
    getSensorData(false);
  });
  
  let searchTimeout = null;
  
  $(document).on('keyup', '#search', (e) => {
    clearTimeout(searchTimeout);
    filter.search = e.target.value;
    filter.page = 1;
    searchTimeout = setTimeout(() => {
      getSensorData(false);
    }, 300);
  });
  
  $(document).on('click', '.sensor-col', function () {
    var sortCol = filter.getSortCol();
    var isSortAsc = filter.isSortAsc();
    var col = $(this).attr("value");
    if (col == sortCol) {
      if (isSortAsc) {
        $(this).find('.icon-arrow').html("&DownArrow;");
        filter.sorts = `-${$(this).attr('value')}`;
      } else {
        $(this).find('.icon-arrow').html("&UpArrow;");
        filter.sorts = `+${$(this).attr('value')}`;
      }
    } else {
      $(this).siblings().find('.icon-arrow').html('');
      $(this).find('.icon-arrow').html("&DownArrow;");
      filter.sorts = `-${$(this).attr('value')}`;
    }
    getSensorData(false);
  });
  
  // Hàm lấy dữ liệu sensor, kiểm soát khi tải dữ liệu
  function getSensorData(loadNewData = false) {
    if (loadNewData) {
      // Chỉ tải dữ liệu từ server nếu loadNewData là true
      fetch(`http://localhost:3000/api?search=${filter.search}&col=${filter.col}&limit=${filter.limit}&skip=${filter.getSkip()}&sorts=${filter.sorts}`)
        .then(response => response.json())
        .then(data => {
          filter.sensorData = data; // Lưu dữ liệu vào biến toàn cục
          filter.count = data.length;
          getSensorCount();
          renderTableData(); // Hiển thị dữ liệu
        })
        .catch(error => console.error('Error fetching data:', error));
    } else {
      // Chỉ hiển thị lại dữ liệu đã lưu khi chuyển trang
      renderTableData();
    }
  }
  
  // Hàm hiển thị dữ liệu lên bảng
  function renderTableData() {
    const tableBody = document.getElementById('data-output');
    tableBody.innerHTML = ''; // Xóa dữ liệu cũ trước khi thêm dữ liệu mới
  
    const dataToDisplay = filter.sensorData.slice(filter.getSkip(), filter.getSkip() + filter.limit);
    dataToDisplay.forEach(row => {
      const date = new Date(row.time);
  
      // Format lại thời gian
      const formattedTime = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
  
      const newRow = `
        <tr>
          <td>${row.id}</td>
          <td>${row.temperature}</td>
          <td>${row.humidity}</td>
          <td>${row.light}</td>
          <td>${formattedTime}</td>
        </tr>
      `;
      tableBody.innerHTML += newRow;
    });
  }
  
  // Đếm số lượng bản ghi
  function getSensorCount() {
    fetch(`http://localhost:3000/api/data-sensor/count?search=${filter.search}&col=${filter.col}&limit=${filter.limit}&skip=${filter.getSkip()}&sorts=${filter.sorts}`)
      .then(response => response.json())
      .then(data => {
        filter.total = data.count;
        let { limit } = filter;
        if (filter.total === 0) {
          $('#row-info').text("No matching rows");
        } else {
          $('#row-info').text(`Showing ${filter.getSkip() + 1} - ${filter.getSkip() + (filter.count < limit ? filter.count : limit)} of ${filter.total} rows`);
        }
        renderPagination(filter.page, filter.limit, filter.total);
      })
      .catch(error => console.error('Error fetching data:', error));
  }
  
  function renderPagination(currentPage, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);
    let paginationHtml = '';
  
    // Tính toán số trang
    let startPage = Math.max(currentPage - 1, 1);
    let endPage = Math.min(currentPage + 1, totalPages);
  
    if (currentPage === 1) {
      endPage = Math.min(3, totalPages);
    } else if (currentPage === totalPages) {
      startPage = Math.max(totalPages - 2, 1);
    }
  
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        paginationHtml += `<li class="page active"><a href="#">${i}</a></li>`;
      } else {
        paginationHtml += `<li class="page"><a href="#" onclick="goToPage(${i})">${i}</a></li>`;
      }
    }
  
    const paginationContainer = document.querySelector('.pagination');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
  
    const existingPages = paginationContainer.querySelectorAll('.page');
    existingPages.forEach(page => page.remove());
  
    nextButton.parentElement.insertAdjacentHTML('beforebegin', paginationHtml);
  
    document.getElementById('first').onclick = () => goToPage(1);
    document.getElementById('prev').onclick = () => currentPage > 1 && goToPage(currentPage - 1);
    document.getElementById('next').onclick = () => currentPage < totalPages && goToPage(currentPage + 1);
    document.getElementById('last').onclick = () => goToPage(totalPages);
  
    document.getElementById('first').parentElement.classList.toggle('disabled', currentPage === 1);
    document.getElementById('prev').parentElement.classList.toggle('disabled', currentPage === 1);
    document.getElementById('next').parentElement.classList.toggle('disabled', currentPage === totalPages);
    document.getElementById('last').parentElement.classList.toggle('disabled', currentPage === totalPages);
  }
  
  function goToPage(page) {
    filter.page = page;
    getSensorData(false); // Chỉ chuyển trang, không tải lại dữ liệu mới
  }
  