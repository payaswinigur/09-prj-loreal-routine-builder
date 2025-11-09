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
  let data;
try {
  data = await response.json();
} catch {
  return new Response(JSON.stringify({ error: "OpenAI response not valid JSON" }), {
    status: 500,
    headers: corsHeaders,
  });
}
response.json();
  allProducts = data.products;
  return allProducts;
}

/* Create HTML for displaying product cards */
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

  // ✅ 2. Now select the created cards
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card, i) => {
    const product = products[i];

    // ✅ Restore highlight if it was already selected
    if (selectedProducts.some((p) => p.name === product.name)) {
      card.classList.add("selected");
    }

    // ✅ Add click event to toggle selection
    card.addEventListener("click", () => toggleProductSelection(product, card));
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

generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = "Please select some products before generating your routine!";
    return;
  }

  chatWindow.innerHTML = "✨ Generating your personalized routine...";

  try {
    const response = await fetch("https://routineadvisorloreal.gurung-38.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selectedProducts: selectedProducts
      })
    });

    const data = await response.json();

    const aiMessage = data.choices?.[0]?.message?.content || "Error generating routine.";

    chatWindow.innerHTML = `<pre>${aiMessage}</pre>`;
  } catch (error) {
    console.error(error);
    chatWindow.innerHTML = "❌ Something went wrong connecting to the server.";
  }
});


/* Chat form submission handler - placeholder */
/* Chat form submission handler - real OpenAI call */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  // Show user's message
  chatWindow.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
  chatForm.reset();

  // Show loading indicator
  chatWindow.innerHTML += `<p><strong>Bot:</strong> ✨ Thinking...</p>`;

  try {
    const response = await fetch("https://routineadvisorloreal.gurung-38.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedProducts: selectedProducts.length > 0 ? selectedProducts : [],
        userMessage: userInput
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response.";

    chatWindow.innerHTML += `<p><strong>Bot:</strong> ${aiMessage}</p>`;
  } catch (error) {
    console.error(error);
    chatWindow.innerHTML += `<p><strong>Bot:</strong> ❌ Something went wrong connecting to the server.</p>`;
  }
});

