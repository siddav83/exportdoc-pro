// CSV Template Functions
function downloadCSVTemplate(type) {
  let csvContent = "";
  let filename = "";

  if (type === "packing") {
    csvContent = `Pallet #,SKU,Product Name,Quantity,Cartons,Batch Code,Expiration Date,Dimensions`;
    filename = "packing_list_template.csv";
  } else if (type === "invoice") {
    csvContent = `Quantity,Cartons,Product SKU,Unit of Measure,HS Code,Unit Price`;
    filename = "commercial_invoice_template.csv";
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadCompanyPreset(type) {
  const preset = companyPresets[type];
  if (!preset) return;

  if (type === "pbo") {
    document.getElementById("seller-company").value = preset.company;
    document.getElementById("seller-address").value = preset.address;
    document.getElementById("seller-duns").value = preset.duns;
    document.getElementById("seller-registration").value = preset.registration;
  } else if (type === "amazon") {
    document.getElementById("buyer-company").value = preset.company;
    document.getElementById("buyer-address").value = preset.address;
    document.getElementById("buyer-tax").value = preset.tax;
  } else if (type === "nutrition") {
    document.getElementById("manufacturer-company").value = preset.company;
    document.getElementById("manufacturer-address").value = preset.address;
    document.getElementById("facility-registration").value = preset.facility;
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".form-section").forEach((section) => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");

  document.getElementById("preview").style.display = "none";
}

function addInvoiceItem() {
  const container = document.getElementById("invoice-items");
  const newRow = document.createElement("div");
  newRow.className = "item-row";
  newRow.innerHTML = `
        <input type="number" placeholder="Qty" class="item-quantity" min="1" oninput="calculateRowTotal(this)">
        <input type="number" placeholder="Cartons" class="item-cartons" min="1">
        <input type="text" placeholder="Product SKU" class="item-sku" onchange="autoFillProductData(this)">
        <select class="item-unit">
            <option value="Pccs">Pccs</option>
            <option value="Kg">Kg</option>
            <option value="Units">Units</option>
            <option value="Boxes">Boxes</option>
        </select>
        <input type="text" placeholder="HS Code" class="item-hs" value="2106909849">
        <input type="number" placeholder="Unit Price" class="item-price" step="0.01" oninput="calculateRowTotal(this)">
        <input type="number" placeholder="Total" class="item-total" readonly>
        <button class="remove-item" onclick="removeItem(this)">×</button>
    `;
  container.appendChild(newRow);
}

function addPackingItem() {
  const container = document.getElementById("packing-items");
  const newRow = document.createElement("div");
  newRow.className = "item-row packing-item-row";
  newRow.innerHTML = `
        <input type="number" placeholder="Pallet #" class="item-pallet" min="1">
        <input type="text" placeholder="SKU" class="item-sku" onchange="autoFillPackingData(this)">
        <input type="text" placeholder="Product Name" class="item-description">
        <input type="number" placeholder="Quantity" class="item-quantity" min="1">
        <input type="number" placeholder="Cartons" class="item-cartons" min="1">
        <input type="text" placeholder="Batch Code" class="item-batch">
        <input type="date" placeholder="Expiration Date" class="item-expiry">
        <input type="text" placeholder="Dimensions" class="item-dimensions">
        <button class="remove-item" onclick="removeItem(this)">×</button>
    `;
  container.appendChild(newRow);
}

function autoFillProductData(skuInput) {
  const sku = skuInput.value;
  const product = productData[sku];
  if (product) {
    const row = skuInput.closest(".item-row");
    row.querySelector(".item-price").value = product.price;
    calculateRowTotal(skuInput);
  }
}

function autoFillPackingData(skuInput) {
  const sku = skuInput.value;
  const product = productData[sku];
  if (product) {
    const row = skuInput.closest(".item-row");
    row.querySelector(".item-description").value = product.name;
  }
}

function removeItem(button) {
  const row = button.closest(".item-row");
  const container = row.parentNode;
  if (container.children.length > 1) {
    row.remove();
    updateSummaryStats();
  }
}

function calculateRowTotal(input) {
  const row = input.closest(".item-row");
  const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
  const price = parseFloat(row.querySelector(".item-price").value) || 0;
  const total = quantity * price;
  row.querySelector(".item-total").value = total.toFixed(2);
  updateSummaryStats();
}

function updateSummaryStats() {
  const rows = document.querySelectorAll("#invoice-items .item-row");
  let totalItems = 0;
  let totalCartons = 0;
  let totalValue = 0;
  const currency = document.getElementById("currency").value;

  rows.forEach((row) => {
    const quantity = parseFloat(row.querySelector(".item-quantity").value) || 0;
    const cartons = parseFloat(row.querySelector(".item-cartons").value) || 0;
    const total = parseFloat(row.querySelector(".item-total").value) || 0;

    totalItems += quantity;
    totalCartons += cartons;
    totalValue += total;
  });

  document.getElementById("total-items").textContent =
    totalItems.toLocaleString();
  document.getElementById("total-cartons").textContent =
    totalCartons.toLocaleString();
  document.getElementById("total-value").textContent = `${getCurrencySymbol(
    currency
  )}${totalValue.toFixed(2)}`;
}

function getCurrencySymbol(currency) {
  const symbols = { GBP: "£", USD: "$", EUR: "€" };
  return symbols[currency] || currency;
}

function handleFileUpload(input, type) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const content = e.target.result;
      const lines = content.split("\n").filter((line) => line.trim() !== "");

      if (lines.length < 2) {
        alert(
          "File appears to be empty or invalid. Please check the CSV format."
        );
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      console.log("Headers:", headers);

      const container =
        type === "invoice"
          ? document.getElementById("invoice-items")
          : document.getElementById("packing-items");

      while (container.children.length > 1) {
        container.removeChild(container.lastChild);
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const data = parseCSVLine(line);
          console.log("Processing row:", data);

          if (type === "invoice") {
            addInvoiceItem();
            populateInvoiceRow(container.lastChild, data);
          } else {
            addPackingItem();
            populatePackingRow(container.lastChild, data);
          }
        }
      }
      updateSummaryStats();
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please ensure it's a valid CSV format.");
    }
  };
  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function populateInvoiceRow(row, data) {
  if (data.length >= 6) {
    row.querySelector(".item-quantity").value = data[0] || "";
    row.querySelector(".item-cartons").value = data[1] || "";
    row.querySelector(".item-sku").value = data[2] || "";
    row.querySelector(".item-unit").value = data[3] || "Pccs";
    row.querySelector(".item-hs").value = data[4] || "2106909849";
    row.querySelector(".item-price").value = data[5] || "";
    calculateRowTotal(row.querySelector(".item-quantity"));
  }
}

function populatePackingRow(row, data) {
  console.log("Populating packing row with data:", data);

  if (data.length >= 1) {
    // Pallet #
    const palletInput = row.querySelector(".item-pallet");
    if (palletInput) palletInput.value = data[0] || "";

    // SKU
    const skuInput = row.querySelector(".item-sku");
    if (skuInput) {
      skuInput.value = data[1] || "";
      // Auto-fill product name if SKU is recognized
      if (data[1] && productData[data[1]]) {
        row.querySelector(".item-description").value =
          productData[data[1]].name;
      }
    }

    // Product Name
    const descInput = row.querySelector(".item-description");
    if (descInput) descInput.value = data[2] || "";

    // Quantity
    const qtyInput = row.querySelector(".item-quantity");
    if (qtyInput) qtyInput.value = data[3] || "";

    // Cartons
    const cartonInput = row.querySelector(".item-cartons");
    if (cartonInput) cartonInput.value = data[4] || "";

    // Batch Code
    const batchInput = row.querySelector(".item-batch");
    if (batchInput) batchInput.value = data[5] || "";

    // Expiration Date - convert from MM/DD/YYYY to YYYY-MM-DD
    const expiryInput = row.querySelector(".item-expiry");
    if (expiryInput && data[6]) {
      const dateStr = data[6];
      if (dateStr.includes("/")) {
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const month = parts[0].padStart(2, "0");
          const day = parts[1].padStart(2, "0");
          const year = parts[2];
          expiryInput.value = `${year}-${month}-${day}`;
        } else {
          expiryInput.value = dateStr;
        }
      } else {
        expiryInput.value = dateStr;
      }
    }

    // Dimensions (if available)
    const dimInput = row.querySelector(".item-dimensions");
    if (dimInput && data[7]) dimInput.value = data[7] || "";
  }
}

function generateInvoice() {
  const preview = document.getElementById("preview");
  const items = document.querySelectorAll("#invoice-items .item-row");
  const currency = document.getElementById("currency").value;
  const currencySymbol = getCurrencySymbol(currency);

  let itemsHtml = "";
  let grandTotal = 0;

  items.forEach((item, index) => {
    const quantity =
      parseFloat(item.querySelector(".item-quantity").value) || 0;
    const cartons = parseFloat(item.querySelector(".item-cartons").value) || 0;
    const sku = item.querySelector(".item-sku").value;
    const unit = item.querySelector(".item-unit").value;
    const hsCode = item.querySelector(".item-hs").value;
    const price = parseFloat(item.querySelector(".item-price").value) || 0;
    const total = quantity * price;

    if (quantity > 0) {
      itemsHtml += `
                <tr>
                    <td class="center">${quantity}</td>
                    <td class="center">${cartons}</td>
                    <td>${sku}</td>
                    <td class="center">${unit}</td>
                    <td class="center">${hsCode}</td>
                    <td class="number">${price.toFixed(2)}</td>
                    <td class="number">${total.toFixed(2)}</td>
                </tr>
            `;
      grandTotal += total;
    }
  });

  const html = `
        <div class="document-header">
            <div class="document-title">COMMERCIAL INVOICE</div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Seller/Shipper/Importer:</h4>
                <div>${
                  document.getElementById("seller-company").value ||
                  "Your Company"
                }</div>
                <div>${
                  document
                    .getElementById("seller-address")
                    .value.replace(/\n/g, "<br>") || "Your Address"
                }</div>
                <br>
                <div><strong>DUNs no.</strong> ${
                  document.getElementById("seller-duns").value || ""
                }</div>
            </div>
            <div class="info-block">
                <div style="margin-bottom: 15px;">
                    <strong>Invoice no.</strong> ${
                      document.getElementById("doc-number").value || "INV-001"
                    }<br>
                    <strong>Date:</strong> ${
                      document.getElementById("doc-date").value ||
                      new Date().toISOString().split("T")[0]
                    }
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Terms of Sale:</strong> ${
                      document.getElementById("terms").value
                    }<br>
                    <strong>Currency of settlement:</strong> ${
                      currency === "GBP" ? "Pounds (£)" : currency
                    }<br>
                    <strong>Mode of shipment:</strong> ${
                      document.getElementById("shipment-mode").value
                    }
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Consignee:</h4>
                <div>${
                  document.getElementById("buyer-company").value ||
                  "Buyer Company"
                }</div>
                <div>${
                  document
                    .getElementById("buyer-address")
                    .value.replace(/\n/g, "<br>") || "Buyer Address"
                }</div>
            </div>
            <div class="info-block">
                <div><strong>Net weight (Kgs):</strong> ${
                  document.getElementById("net-weight").value || "0"
                }</div>
                <div><strong>Gross Weight (Kgs):</strong> ${
                  document.getElementById("gross-weight").value || "0"
                }</div>
                <div><strong>No. of Pallets:</strong> ${
                  document.getElementById("num-pallets").value || "0"
                }</div>
                <div><strong>Country of Origin:</strong> ${
                  document.getElementById("origin-country").value ||
                  "United Kingdom"
                }</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Manufacturer:</h4>
                <div>${
                  document.getElementById("manufacturer-company").value ||
                  "Manufacturer"
                }</div>
                <div>${
                  document
                    .getElementById("manufacturer-address")
                    .value.replace(/\n/g, "<br>") || "Manufacturer Address"
                }</div>
                <div><strong>Registration no.</strong> ${
                  document.getElementById("seller-registration").value || ""
                }</div>
                <div><strong>Facility Reg. no.</strong> ${
                  document.getElementById("facility-registration").value || ""
                }</div>
            </div>
            <div class="info-block">
                <div style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
                    <div>merch process fee</div>
                    <div>duties fee</div>
                    <div>harbour fee</div>
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Quantity</th>
                    <th>Cartons</th>
                    <th>ProductSKU</th>
                    <th>Unit of Measure</th>
                    <th>HS Code</th>
                    <th>PRICE PER UNIT</th>
                    <th>TOTAL VALUE</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div style="margin: 20px 0;">
            <div><strong>Packing Instructions</strong></div>
            <div>${
              document.getElementById("packing-instructions").value ||
              "Packed in carton containers on a standard wooden pallet"
            }</div>
        </div>

        <div class="totals">
            <div class="total-row">
                <span><strong>Total Commercial Value</strong></span>
                <span><strong>${currencySymbol}${grandTotal.toFixed(
    2
  )}</strong></span>
            </div>
            <div class="total-row grand-total">
                <span><strong>Total Invoice Value</strong></span>
                <span><strong>${currencySymbol}${grandTotal.toFixed(
    2
  )}</strong></span>
            </div>
        </div>

        <div class="certification">
            <p><strong>I certify that the stated export prices and description of goods are true and correct</strong></p>
            <br>
            <div><strong>${
              document.getElementById("auth-person").value ||
              "Authorized Person"
            }</strong></div>
            <div>${
              document.getElementById("auth-title").value || "Senior Manager"
            }</div>
            <br><br>
            <div class="signature-section">
                <div>
                    <strong>SIGNED</strong><br>
                    ________________________
                </div>
                <div>
                    <strong>DATE</strong> ${
                      document.getElementById("signature-date").value ||
                      new Date().toISOString().split("T")[0]
                    }<br>
                    ________________________
                </div>
            </div>
        </div>
    `;

  preview.innerHTML = html;
  preview.style.display = "block";
}

function generatePackingList() {
  const preview = document.getElementById("preview");
  const items = document.querySelectorAll("#packing-items .item-row");

  let itemsHtml = "";

  items.forEach((item, index) => {
    const pallet = item.querySelector(".item-pallet").value;
    const sku = item.querySelector(".item-sku").value;
    const description = item.querySelector(".item-description").value;
    const quantity = item.querySelector(".item-quantity").value;
    const cartons = item.querySelector(".item-cartons").value;
    const batch = item.querySelector(".item-batch").value;
    const expiry = item.querySelector(".item-expiry").value;

    if (sku || description) {
      const expiryFormatted = expiry
        ? new Date(expiry).toLocaleDateString("en-GB")
        : "";
      itemsHtml += `
                <tr>
                    <td class="center">${pallet || ""}</td>
                    <td>${sku}</td>
                    <td>${description}</td>
                    <td class="center">${quantity}</td>
                    <td class="center">${cartons}</td>
                    <td class="center">${batch}</td>
                    <td class="center">${expiryFormatted}</td>
                </tr>
            `;
    }
  });

  const html = `
        <div class="document-header">
            <div class="document-title">Packing list</div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Seller:</h4>
                <div>${
                  document.getElementById("seller-company").value ||
                  "Your Company"
                }</div>
                <div>${
                  document
                    .getElementById("seller-address")
                    .value.replace(/\n/g, "<br>") || "Your Address"
                }</div>
                <br>
                <div><strong>DUNs no.</strong> ${
                  document.getElementById("seller-duns").value || ""
                }</div>
            </div>
            <div class="info-block">
                <div style="margin-bottom: 15px;">
                    <strong>Invoice no.</strong> ${
                      document.getElementById("doc-number").value || "PL-001"
                    }<br>
                    <strong>Date:</strong> ${
                      document.getElementById("doc-date").value ||
                      new Date().toISOString().split("T")[0]
                    }
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Terms of Sale:</strong> ${
                      document.getElementById("terms").value
                    }<br>
                    <strong>Mode of shipment:</strong> ${
                      document.getElementById("shipment-mode").value
                    }
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Consignee:</h4>
                <div>${
                  document.getElementById("buyer-company").value ||
                  "Buyer Company"
                }</div>
                <div>${
                  document
                    .getElementById("buyer-address")
                    .value.replace(/\n/g, "<br>") || "Buyer Address"
                }</div>
            </div>
            <div class="info-block">
                <div><strong>Net weight (Kgs):</strong> ${
                  document.getElementById("net-weight").value || "0"
                }</div>
                <div><strong>Gross Weight (Kgs):</strong> ${
                  document.getElementById("gross-weight").value || "0"
                }</div>
                <div><strong>No. of Pallets:</strong> ${
                  document.getElementById("num-pallets").value || "0"
                }</div>
                <div><strong>Country of Origin:</strong> ${
                  document.getElementById("origin-country").value ||
                  "United Kingdom"
                }</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-block">
                <h4>Manufacturer:</h4>
                <div>${
                  document.getElementById("manufacturer-company").value ||
                  "Manufacturer"
                }</div>
                <div>${
                  document
                    .getElementById("manufacturer-address")
                    .value.replace(/\n/g, "<br>") || "Manufacturer Address"
                }</div>
                <div><strong>Registration no.</strong> ${
                  document.getElementById("seller-registration").value || ""
                }</div>
                <div><strong>Facility Reg. no.</strong> ${
                  document.getElementById("facility-registration").value || ""
                }</div>
            </div>
            <div></div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Pallet #</th>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Cartons</th>
                    <th>Batch Code</th>
                    <th>Expiration Date</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div style="margin: 20px 0;">
            <div><strong>Packing Instructions</strong></div>
            <div>${
              document.getElementById("packing-instructions").value ||
              "Packed in carton containers on a standard wooden pallet"
            }</div>
        </div>

        <div class="certification">
            <p><strong>I certify that the stated export prices and description of goods are true and correct</strong></p>
            <br>
            <div><strong>${
              document.getElementById("auth-person").value ||
              "Authorized Person"
            }</strong></div>
            <div>${
              document.getElementById("auth-title").value || "Senior Manager"
            }</div>
            <br><br>
            <div class="signature-section">
                <div>
                    <strong>SIGNED</strong><br>
                    ________________________
                </div>
                <div>
                    <strong>DATE</strong> ${
                      document.getElementById("signature-date").value ||
                      new Date().toISOString().split("T")[0]
                    }<br>
                    ________________________
                </div>
            </div>
        </div>
    `;

  preview.innerHTML = html;
  preview.style.display = "block";
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("doc-date").value = today;
  document.getElementById("signature-date").value = today;

  // Auto-generate document number
  // const docNumber = `AMZUS-${new Date()
  //   .toISOString()
  //   .split("T")[0]
  //   .replace(/-/g, "")}-001-REG`;
  // document.getElementById("doc-number").value = docNumber;

  updateSummaryStats();
});

// Auto-calculate weights and totals when items change
document.addEventListener("input", function (e) {
  if (
    e.target.classList.contains("item-quantity") ||
    e.target.classList.contains("item-price")
  ) {
    updateSummaryStats();
  }
});
