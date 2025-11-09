/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSelected");

let allProducts = [];
let selectedProducts = [];
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [
  { role: "system", content: "You are a helpful L'Oréal skincare advisor." }
];

/* ✅ Load selected products from localStorage if they exist */
const savedProducts = JSON.parse(localStorage.getItem("selectedProducts"));
if (savedProducts && Array.isArray(savedProducts)) {
  selectedProducts = savedProducts;
  updateSelectedList();
}

/* ✅ Load saved chat history */
if (chatHistory.length > 1) {
  chatWindow.innerHTML = chatHistory
    .filter(m => m.role !== "system")
    .map(m => `<p><strong>${m.role === "user" ? "You" : "Bot"}:</strong> ${m.content}</p>`)
    .join("");
}

/* ✅ Clear selected products button */
clearBtn.addEventListener("click", () => {
  selectedProducts = [];
  localStorage.removeItem("selectedProducts");
  updateSelectedList();
});

/* Initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or use the search to view products
  </div>`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Display product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, index) => `
        <div class="product-card" data-index="${index}">
          <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-tooltip">
              ${product.description}
            </div>
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
        </div>
      `
    )
    .join("");

  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card, i) => {
    const product = products[i];

    if (selectedProducts.some((p) => p.name === product.name)) {
      card.classList.add("selected");
    }

    card.addEventListener("click", () => toggleProductSelection(product, card));
  });
}

/* Handle selecting/unselecting products */
function toggleProductSelection(product, card) {
  const isSelected = selectedProducts.find((p) => p.name === product.name);

  if (isSelected) {
    selectedProducts = selectedProducts.filter((p) => p.name !== product.name);
    card.classList.remove("selected");
  } else {
    selectedProducts.push(product);
    card.classList.add("selected");
  }

  updateSelectedList();
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Update visual selected products list */
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

/* Filter by category */
categoryFilter.addEventListener("change", async (e) => {
  const selectedCategory = e.target.value;
  const products = await loadProducts();

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* ✅ Product search box */
searchInput.addEventListener("input", async (e) => {
  const query = e.target.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const products = await loadProducts();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  displayProducts(filteredProducts);
});

/* ✅ Generate Routine Button */
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += "<p>Please select some products before generating your routine!</p>";
    return;
  }

  chatWindow.innerHTML += "<p><strong>Bot:</strong> ✨ Generating your personalized routine...</p>";

  // Add user request to history
  chatHistory.push({
    role: "user",
    content: `Create a skincare routine using: ${selectedProducts.map(p => p.name).join(", ")}`
  });

  try {
    const response = await fetch("https://routineadvisorloreal.gurung-38.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory,
        selectedProducts
      })
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Error generating routine.";

    chatHistory.push({ role: "assistant", content: aiMessage });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

    chatWindow.innerHTML += `<p><strong>Bot:</strong> ${aiMessage}</p>`;
  } catch (error) {
    console.error(error);
    chatWindow.innerHTML += `<p><strong>Bot:</strong> ❌ Something went wrong connecting to the server.</p>`;
  }
});

/* ✅ Chat submission (Follow-up questions) */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  chatWindow.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
  chatForm.reset();

  chatWindow.innerHTML += `<p><strong>Bot:</strong> ✨ Thinking...</p>`;

  // Add user message to history
  chatHistory.push({ role: "user", content: userInput });

  try {
    const response = await fetch("https://routineadvisorloreal.gurung-38.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory,
        selectedProducts
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response.";

    chatHistory.push({ role: "assistant", content: aiMessage });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

    chatWindow.innerHTML += `<p><strong>Bot:</strong> ${aiMessage}</p>`;
  } catch (error) {
    console.error(error);
    chatWindow.innerHTML += `<p><strong>Bot:</strong> ❌ Something went wrong connecting to the server.</p>`;
  }
});

// ✅ Clear chat history button
const clearChatBtn = document.getElementById("clearChat");

clearChatBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the chat?")) {
    chatWindow.innerHTML = "";
    chatHistory = [
      { role: "system", content: "You are a helpful L'Oréal skincare advisor." }
    ];
    localStorage.removeItem("chatHistory");
  }
});
