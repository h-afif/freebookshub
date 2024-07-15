// Function to retrieve search query from URL
function getQueryParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

// Function to handle displaying search results on search.html
function displaySearchResultsOnPage() {
    // Check if the current page is search.html
    if (window.location.pathname.endsWith('/search.html')) {
        const query = getQueryParams().query;
        const searchResults = document.getElementById('searchResults');
        let html = '';

        if (query && query.trim() !== '') {
            // Display search results based on the query
            html += '<h2>Search Results</h2>';
            html += `<p>Display search results for: <strong>${query}</strong></p>`;

            // Fetch books.json data
            fetch('books.json')
                .then(response => response.json())
                .then(data => {
                    const filteredBooks = data.filter(book => {
                        // Case insensitive search for book titles
                        return book.title.toLowerCase().includes(query.toLowerCase());
                    });

                    if (filteredBooks.length > 0) {
                        html += '<ul class="book-list">';
                        filteredBooks.forEach((book, index) => {
                            html += `<li class="book-item">
                                        <a href="book.html?index=${data.indexOf(book)}"> <!-- Use index of book in data -->
                                            <img src="${book.image}" alt="${book.title}">
                                            <p>${book.title}</p>
                                        </a>
                                    </li>`;
                        });
                        html += '</ul>';
                    } else {
                        html += '<p>No books found.</p>';
                    }

                    // Display the constructed HTML in searchResults div
                    searchResults.innerHTML = html;
                })
                .catch(error => {
                    console.error('Error fetching book data:', error);
                    searchResults.innerHTML = '<p>Error fetching data. Please try again later.</p>';
                });
        } else {
            // Handle case where query is empty or undefined
            html += '<h2>No Search Results</h2>';
            html += '<p>Please enter a search query above.</p>';
            searchResults.innerHTML = html;
        }
    }
}

// Function to fetch book data from JSON using index
function fetchBookData(bookIndex) {
    fetch('books.json')
        .then(response => response.json())
        .then(data => {
            const book = data[bookIndex];
            if (book) {
                displayBookDetails(book);
            } else {
                console.error('Book not found in database.');
            }
        })
        .catch(error => console.error('Error fetching book data:', error));
}

// Function to display book details on book.html
function displayBookDetails(book) {
    document.getElementById('bookImage').src = book.image;
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookDescription').textContent = book.description;

    // Display audiobook if available
    const audiobookSection = document.getElementById('audiobookSection');
    if (book.audiobook) {
        document.getElementById('audiobookSource').src = book.audiobook;
        document.getElementById('audiobookPlayer').load();
        audiobookSection.style.display = 'block';
    } else {
        audiobookSection.style.display = 'none';
    }

    // Display PDF if available
    const pdfSection = document.getElementById('pdfSection');
    if (book.pdf) {
        document.getElementById('pdfViewer').src = book.pdf;
        document.getElementById('pdfDownload').href = book.pdf;
        pdfSection.style.display = 'block';

        // PDF.js rendering
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument(book.pdf);
        loadingTask.promise.then(function(pdf) {
            console.log('PDF loaded');
            const pdfViewer = document.getElementById('pdfViewer');

            // Render all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                    console.log('Page loaded');

                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    page.render(renderContext).promise.then(function() {
                        console.log('Page rendered');
                        pdfViewer.appendChild(canvas);
                    });
                });
            }
        }, function(reason) {
            console.error('Error loading PDF: ' + reason);
        });
    } else {
        pdfSection.style.display = 'none';
    }
}

// Extract book index from URL query parameter
function getBookIndexFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookIndex = urlParams.get('index');
    return bookIndex;
}

// Load book details on page load
window.onload = function() {
    // Check if on book.html page
    if (window.location.pathname.endsWith('/book.html')) {
        const bookIndex = getBookIndexFromURL();
        if (bookIndex !== null) {
            fetchBookData(bookIndex);
        } else {
            console.error('Book index not provided.');
        }
    }

    // Display search results on search.html page
    displaySearchResultsOnPage();

    // Handle search form submission on index.html
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput').value;
            if (searchInput.trim() !== '') {
                window.location.href = `search.html?query=${searchInput}`;
            }
        });

        // Handle dynamic search on index.html
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.trim().toLowerCase();
            if (query !== '') {
                handleDynamicSearch(query);
            }
        });
    }
};

// Function to handle dynamic search and display results
function handleDynamicSearch(query) {
    fetch('books.json')
        .then(response => response.json())
        .then(data => {
            const filteredBooks = data.filter(book => {
                return book.title.toLowerCase().includes(query);
            });

            const searchResults = document.getElementById('searchResults');
            let html = '';

            if (filteredBooks.length > 0) {
                html += '<ul class="search-list">';
                filteredBooks.forEach((book, index) => {
                    html += `<li class="search-item">
                                <a href="book.html?index=${data.indexOf(book)}"> <!-- Use index of book in data -->
                                    <img src="${book.image}" alt="${book.title}">
                                    <p>${book.title}</p>
                                </a>
                            </li>`;
                });
                html += '</ul>';
            } else {
                html += '<p>No results found.</p>';
            }

            searchResults.innerHTML = html;
        })
        .catch(error => console.error('Error fetching book data:', error));
}
