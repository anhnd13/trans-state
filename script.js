let transactions = [];
let itemsPerPage = 10;
let lastSearch = '';
let isDataLoaded = false;

// Function to load and cache data
async function loadTransactions() {
    if (isDataLoaded) return; // Avoid loading data multiple times
    try {
        const response = await fetch('bank-trans.bank-var.json');
        if (!response.ok) throw new Error('Network response was not ok');
        transactions = await response.json();
        isDataLoaded = true;
        searchTransactions(); // Perform search after loading data
    } catch (error) {
        console.error('Lỗi tải giao dịch:', error);
    }
}

// Function to perform search and display results
function searchTransactions() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();
    if (searchInput === lastSearch) return;

    lastSearch = searchInput;
    const searchTerms = new Set(searchInput.split(' ').filter(term => term.length > 1));

    const matchedTransactions = transactions
        .map((transaction, index) => {
            const matchScore = Array.from(searchTerms).reduce((score, term) => {
                if (transaction.date.toLowerCase().includes(term)) score += 3;
                if (transaction.notes.toLowerCase().includes(term)) score += 2;
                if (transaction.transfer_money.toString().includes(term)) score += 1;
                return score;
            }, 0);
            return { transaction, matchScore };
        })
        .filter(item => item.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

    displayResults(matchedTransactions, 1, itemsPerPage, searchTerms);
}

// Function to highlight search terms in text
function highlightText(text, searchTerms) {
    let highlightedText = text;
    searchTerms.forEach(term => {
        const regex = new RegExp(term, 'gi');
        highlightedText = highlightedText.replace(regex, match => `<span class="highlight">${match}</span>`);
    });
    return highlightedText;
}

// Function to display results and pagination
function displayResults(matchedTransactions, page = 1, itemsPerPage = 10, searchTerms) {
    const resultsBody = document.getElementById('results');
    const paginationDiv = document.getElementById('pagination');
    resultsBody.innerHTML = '';
    paginationDiv.innerHTML = '';

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = matchedTransactions.slice(startIndex, endIndex);

    if (paginatedTransactions.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="3" class="py-4 px-4 text-center text-gray-600">Không tìm thấy kết quả.</td></tr>';
    } else {
        paginatedTransactions.forEach(({ transaction }, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
            row.innerHTML = `
                <td class="py-3 px-4">${highlightText(transaction.date, searchTerms)}</td>
                <td class="py-3 px-4">${highlightText(transaction.notes, searchTerms)}</td>
                <td class="py-3 px-4">${highlightText(transaction.transfer_money.toString(), searchTerms)}</td>
            `;
            resultsBody.appendChild(row);
        });

        const totalPages = Math.ceil(matchedTransactions.length / itemsPerPage);
        const maxPageButtons = 5;
        const startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = `pagination-button ${page === i ? 'active' : ''}`;
            pageButton.addEventListener('click', () => displayResults(matchedTransactions, i, itemsPerPage, searchTerms));
            paginationDiv.appendChild(pageButton);
        }

        if (startPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = '...';
            prevButton.className = 'pagination-button';
            prevButton.disabled = true;
            paginationDiv.appendChild(prevButton);
        }
        if (endPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = '...';
            nextButton.className = 'pagination-button';
            nextButton.disabled = true;
            paginationDiv.appendChild(nextButton);
        }
    }
}

// Event listeners
document.getElementById('searchButton').addEventListener('click', searchTransactions);
document.getElementById('pageSize').addEventListener('change', function () {
    itemsPerPage = parseInt(this.value);
    searchTransactions();
});
document.getElementById('searchInput').addEventListener('input', debounce(searchTransactions, 300));

// Load data when the DOM is ready
window.addEventListener('DOMContentLoaded', loadTransactions);

// Debounce function to limit how often the search is executed
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
