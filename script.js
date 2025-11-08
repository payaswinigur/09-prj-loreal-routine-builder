/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");

let allProducts = [];
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, index) => `
    <div class="product-card" data-index="${index}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add click listeners for selecting products
  document.querySelectorAll(".product-card").forEach((card, i) => {
    card.addEventListener("click", () => toggleProductSelection(products[i], card));
  });
}

/* Handle selecting/unselecting products */
function toggleProductSelection(product, card) {
  const isSelected = selectedProducts.find((p) => p.name === product.name);

  if (isSelected) {
    // Remove from selected list
    selectedProducts = selectedProducts.filter((p) => p.name !== product.name);
    card.classList.remove("selected");
  } else {
    // Add to selected list
    selectedProducts.push(product);
    card.classList.add("selected");
  }

  updateSelectedList();
}

/* Update the visual selected products list */
function updateSelectedList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p style="color:#666;">No products selected yet.</p>`;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (p) => `
      <div class="selected-item">
        <img src="${p.image}" alt="${p.name}">
        <span>${p.name}</span>
      </div>
    `
    )
    .join("");
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const selectedCategory = e.target.value;
  const products = await loadProducts();

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Generate Routine Button */
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      "Please select some products before generating your routine!";
    return;
  }

  chatWindow.innerHTML = "✨ Generating your personalized routine...";

  // Example placeholder for OpenAI integration
  // Replace with API call later if needed
  const routineText = `
    Here's your L'Oréal-inspired routine:
    1️⃣ Cleanser: ${selectedProducts[0]?.name || "Pick a cleanser"}
    2️⃣ Treatment: ${selectedProducts[1]?.name || "Add a serum/moisturizer"}
    3️⃣ Finishing: ${selectedProducts[2]?.name || "Add a sunscreen or fragrance"}
    🌟 Stay consistent for radiant results!
  `;

  chatWindow.innerHTML = `<pre>${routineText}</pre>`;
});

/* Chat form submission handler - placeholder */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value;
  chatWindow.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
  chatWindow.innerHTML += `<p><strong>Bot:</strong> Connect to the OpenAI API for a response!</p>`;
  chatForm.reset();
});
