var filter = {
  limit: 10,
  sorts: '-time',
  search: '',
  col: 'id',
  count: 0,
  total: 0, 
  page: 1,
  getSkip(){
    return (this.page - 1)*this.limit;
  },
  getSortCol(){
    return this.sorts.substring(1);
  },
  isSortAsc(){
    return this.sorts.substring(0,1) == "+";
  }
}

$(document).ready(function(){
  getSensorData();
});

$(document).on('change', '#itemperpage', (e)=>{
  filter.limit = parseInt(e.target.value);
  if (filter.getSkip()>filter.total){
    filter.page = Math.ceil(filter.total/filter.limit);
  }
  getSensorData();
})

$(document).on('change', '#searchBy', (e)=>{
  filter.col = e.target.value;
  getSensorData();
})

let searchTimeout = null;

$(document).on('keyup', '#search', (e)=>{
  clearTimeout(searchTimeout);
  filter.search = e.target.value;
  filter.page = 1;
  searchTimeout = setTimeout(()=>{
    getSensorData();
  },300);
})

$(document).on('click', '.sensor-col', function(){
  var sortCol = filter.getSortCol();
  var isSortAsc = filter.isSortAsc();
  var col = $(this).attr("value");
  if (col==sortCol){
    if (isSortAsc){
      $(this).find('.icon-arrow').html("&DownArrow;");
      filter.sorts = `-${$(this).attr('value')}`
    }else{
      $(this).find('.icon-arrow').html("&UpArrow;");
      filter.sorts = `+${$(this).attr('value')}`
    }
  }else{
    $(this).siblings().find('.icon-arrow').html('');
      $(this).find('.icon-arrow').html("&DownArrow;");
      filter.sorts = `-${$(this).attr('value')}`
  }
  getSensorData();
})



function getSensorData(){
  fetch(`http://localhost:3000/api?search=${filter.search}&col=${filter.col}&limit=${filter.limit}&skip=${filter.getSkip()}&sorts=${filter.sorts}`)
  .then(response => response.json())
  .then(data => {
    filter.count = data.length;
    getSensorCount();
    const tableBody = document.getElementById('data-output');
    tableBody.innerHTML = ''; // Clear the table before inserting new data

    // Loop through the data and add rows to the table
    data.forEach(row => {
      const date = new Date(row.time);
      
      // Manually format the date to 'YYYY-MM-DD HH:mm:ss'
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
  })
  .catch(error => console.error('Error fetching data:', error));
}

// đếm số lượng bản ghi thỏa mãn điều kiện tìm kiếm và cập nhật giao diện
function getSensorCount(){
  fetch(`http://localhost:3000/api/data-sensor/count?search=${filter.search}&col=${filter.col}&limit=${filter.limit}&skip=${filter.getSkip()}&sorts=${filter.sorts}`)
  .then(response => response.json())
  .then(data => {
    filter.total = data.count;
    let {limit} = filter;
    if (filter.total === 0){
      $('#row-info').text("No matching rows");
    }else{
      $('#row-info').text(`Showing ${filter.getSkip() + 1} - ${filter.getSkip() + (filter.count < limit? filter.count: limit)} of ${filter.total} rows`);
    }
  renderPagination(filter.page, filter.limit, filter.total);
  })
  .catch(error => console.error('Error fetching data:', error));
}

function renderPagination(currentPage, limit, totalItems) {
  const totalPages = Math.ceil(totalItems / limit);
  let paginationHtml = '';

  // Calculate start and end page numbers for pagination
  let startPage = Math.max(currentPage - 1, 1); // At least the first page
  let endPage = Math.min(currentPage + 1, totalPages); // At most the last page

  // Adjust if less than 3 pages are shown
  if (currentPage === 1) {
      endPage = Math.min(3, totalPages);
  } else if (currentPage === totalPages) {
      startPage = Math.max(totalPages - 2, 1);
  }

  // Add page number buttons
  for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
          paginationHtml += `<li class="page active"><a href="#">${i}</a></li>`;
      } else {
          paginationHtml += `<li class="page"><a href="#" onclick="goToPage(${i})">${i}</a></li>`;
      }
  }

  // Insert pagination HTML between prev and next buttons
  const paginationContainer = document.querySelector('.pagination');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');

  // Remove existing page items before adding new ones
  const existingPages = paginationContainer.querySelectorAll('.page');
  existingPages.forEach(page => page.remove());

  // Insert new pagination items before the next button
  nextButton.parentElement.insertAdjacentHTML('beforebegin', paginationHtml);

  // Enable or disable Prev/First and Next/Last buttons
  document.getElementById('first').onclick = () => goToPage(1);
  document.getElementById('prev').onclick = () => currentPage > 1 && goToPage(currentPage - 1);
  document.getElementById('next').onclick = () => currentPage < totalPages && goToPage(currentPage + 1);
  document.getElementById('last').onclick = () => goToPage(totalPages);

  // Disable buttons if necessary
  document.getElementById('first').parentElement.classList.toggle('disabled', currentPage === 1);
  document.getElementById('prev').parentElement.classList.toggle('disabled', currentPage === 1);
  document.getElementById('next').parentElement.classList.toggle('disabled', currentPage === totalPages);
  document.getElementById('last').parentElement.classList.toggle('disabled', currentPage === totalPages);

  // Disable button links to avoid clicking them when disabled
  document.getElementById('first').classList.toggle('disabled-link', currentPage === 1);
  document.getElementById('prev').classList.toggle('disabled-link', currentPage === 1);
  document.getElementById('next').classList.toggle('disabled-link', currentPage === totalPages);
  document.getElementById('last').classList.toggle('disabled-link', currentPage === totalPages);
}


function goToPage(page) {
  console.log(`Go to page ${page}`);
  filter.page = page;
  getSensorData();
}
