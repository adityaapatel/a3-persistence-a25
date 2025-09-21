// // FRONT-END (CLIENT) JAVASCRIPT HERE

// const submit = async function( event ) {
//   // stop form submission from trying to load
//   // a new .html page for displaying results...
//   // this was the original browser behavior and still
//   // remains to this day
//   event.preventDefault()
  
//   const input = document.querySelector( "#yourname" ),
//         json = { yourname: input.value },
//         body = JSON.stringify( json )

//   const response = await fetch( "/submit", {
//     method:"POST",
//     body 
//   })

//   const text = await response.text()

//   console.log( "text:", text )
// }

// window.onload = function() {
//    const button = document.querySelector("button");
//   button.onclick = submit;
// }

const $ = (id) => document.getElementById(id);
const toDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "");
const toDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : "");

// API helpers
async function getAll() {
  const r = await fetch("/results");
  if (!r.ok) throw new Error("Failed to load items");
  return r.json();
}

async function addItem(body) {
  const r = await fetch("/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Failed to add item");
  return r.json();
}

async function markCompleted(rowIndex) {
  const r = await fetch("/results", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ row: rowIndex }),
  });
  if (!r.ok) throw new Error("Failed to mark completed");
  return r.text();
}

function showAlert(msg) {
  const alertDiv = $("form-alert");
  if (alertDiv) {
    alertDiv.textContent = msg;
    alertDiv.classList.remove("d-none");
  }
}

function hideAlert() {
  const alertDiv = $("form-alert");
  if (alertDiv) {
    alertDiv.textContent = "";
    alertDiv.classList.add("d-none");
  }
}

// form submit for index.html
function bindForm() {
  const form = $("bucketform");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const title = $("title").value.trim();
    const category = $("category").value;
    const priority = $("priority").value;
    const targetDate = $("targetDate") ? $("targetDate").value : "";

    // Check required fields
    if (!title || !category || !priority) {
      showAlert("Please fill out all required fields.");
      return;
    }

    // Optionally, check for valid date
    if (targetDate && isNaN(Date.parse(targetDate))) {
      showAlert("Please enter a valid date.");
      return;
    }

    try {
      await addItem({ title, category, priority, targetDate });
      form.reset(); // clear fields
      window.location.href = "results.html"; // redirect
    } catch (err) {
      showAlert("Error adding item. Try again.");
      console.error(err);
    }
  });
}

// render tables for results.html
async function renderResults() {
  const tbody = $("items-body");
  const completedBody = $("completed-body");
  if (!tbody) return;

  try {
    const data = await getAll();
    tbody.innerHTML = "";
    if (completedBody) completedBody.innerHTML = "";

    data.forEach((row, idx) => {
      if (row.completed) {
        // completed table
        if (completedBody) {
          const tr = document.createElement("tr");
          ["title", "category", "priority", "targetDate", "daysLeft", "addedAt"].forEach(key => {
            const td = document.createElement("td");
            td.textContent = key === "targetDate" || key === "addedAt"
              ? toDate(row[key])
              : row[key] ?? "—";
            tr.appendChild(td);
          });
          completedBody.appendChild(tr);
        }
      } else {
        // active table
        const tr = document.createElement("tr");
        const tdTitle = document.createElement("td");
        tdTitle.textContent = row.title;
        const tdCat = document.createElement("td");
        tdCat.textContent = row.category;
        const tdPri = document.createElement("td");
        tdPri.textContent = row.priority;
        const tdTarget = document.createElement("td");
        tdTarget.textContent = toDate(row.targetDate);
        const tdDays = document.createElement("td");
        tdDays.textContent = typeof row.daysLeft === "number" ? row.daysLeft : "—";
        const tdAdded = document.createElement("td");
        tdAdded.textContent = toDate(row.addedAt) || toDateTime(row.addedAt);

        const tdActions = document.createElement("td");
        const completeBtn = document.createElement("button");
        completeBtn.className = "btn btn-success btn-sm";
        completeBtn.textContent = "Mark Completed";
        completeBtn.addEventListener("click", async () => {
          try {
            await markCompleted(idx);
            await renderResults();
          } catch (err) {
            console.error(err);
            alert("Failed to mark completed.");
          }
        });

        tdActions.appendChild(completeBtn);
        tr.append(tdTitle, tdCat, tdPri, tdTarget, tdDays, tdAdded, tdActions);
        tbody.appendChild(tr);
      }
    });
  } catch (err) {
    console.error(err);
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "Failed to load items.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

// run on page load
window.addEventListener("DOMContentLoaded", async () => {
  bindForm();
  await renderResults();
});