/* ====================================================
   SISTEMA DE COTIZACIONES — app.js
   Maria Gomez / Confección y Tapizados
   ==================================================== */

// ===== EMPRESA INFO (editar aquí si cambia) =====
const EMPRESA = {
  nombre: 'MARIA GOMEZ',
  ruc: 'R.U.C. E8-94-182  *  D.V.: 01',
  tagline: 'Todo en confección y tapizados de muebles, cenefas, cortinas, papel tapiz e instalaciones',
  celular: '+507 6634-9909',
  email: 'betsygomezr@hotmail.com',
  moneda: 'B/.',
};

// ===== STATE =====
let items = [];
let nextId = 1;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Load persisted data
  loadPersistedData();

  // Default date = today
  const dateInput = document.getElementById('fecha');
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Start with 3 empty rows if no items
  if (items.length === 0) {
    addItem();
    addItem();
    addItem();
  }

  updateBadge();
  bindEvents();
});

// ===== PERSISTENCE =====
function loadPersistedData() {
  // Invoice Number
  const savedNum = localStorage.getItem('mg_invoice_num');
  const numInput = document.getElementById('numero');
  if (savedNum) {
    numInput.value = savedNum;
  } else {
    numInput.value = '176'; // Default as requested
    localStorage.setItem('mg_invoice_num', '176');
  }

  // Client Suggestions
  const savedClients = JSON.parse(localStorage.getItem('mg_clients') || '[]');
  updateClientDatalist(savedClients);
}

function saveInvoiceNumber() {
  const num = document.getElementById('numero').value;
  localStorage.setItem('mg_invoice_num', num);
}

function saveClient(name) {
  if (!name || name.trim() === '' || name === '—') return;

  let clients = JSON.parse(localStorage.getItem('mg_clients') || '[]');
  if (!clients.includes(name)) {
    clients.unshift(name); // Add to front
    clients = clients.slice(0, 15); // Keep last 15
    localStorage.setItem('mg_clients', JSON.stringify(clients));
    updateClientDatalist(clients);
  }
}

function updateClientDatalist(clients) {
  const datalist = document.getElementById('clientes-list');
  if (!datalist) return;
  datalist.innerHTML = '';
  clients.forEach(client => {
    const opt = document.createElement('option');
    opt.value = client;
    datalist.appendChild(opt);
  });
}

// ===== BIND EVENTS =====
function bindEvents() {
  document.getElementById('btn-add-item').addEventListener('click', () => { addItem(); });
  document.getElementById('btn-preview').addEventListener('click', showPreview);
  document.getElementById('btn-pdf').addEventListener('click', downloadPDF);
  document.getElementById('btn-pdf2').addEventListener('click', downloadPDF);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-close2').addEventListener('click', closeModal);
  document.getElementById('btn-nueva').addEventListener('click', newCotizacion);
  document.getElementById('numero').addEventListener('input', () => {
    updateBadge();
    saveInvoiceNumber();
  });
  document.getElementById('toggle-itbms').addEventListener('change', recalcTotals);

  // Close on backdrop click
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });
}

// ===== ADD ITEM =====
function addItem() {
  const id = nextId++;
  items.push({ id, cant: '', desc: '', precio: '' });

  const container = document.getElementById('items-body');
  const card = document.createElement('div');
  card.className = 'item-row';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="item-col item-cant">
      <label class="item-lbl">Cant.</label>
      <input class="cant-input" type="number" min="0" step="any" placeholder="1" data-id="${id}" data-field="cant" />
    </div>
    <div class="item-col item-desc">
      <label class="item-lbl">Descripción</label>
      <input class="desc-input" type="text" placeholder="Descripción del servicio o producto…" data-id="${id}" data-field="desc" />
    </div>
    <div class="item-col item-price">
      <label class="item-lbl">Precio/U</label>
      <input class="price-input" type="number" min="0" step="0.01" placeholder="0.00" data-id="${id}" data-field="precio" />
    </div>
    <div class="item-col item-total">
      <label class="item-lbl">Total</label>
      <div class="total-cell" id="total-row-${id}">—</div>
    </div>
    <div class="item-col item-del">
      <button class="btn-del" data-id="${id}" title="Eliminar">✕</button>
    </div>
  `;
  container.appendChild(card);

  card.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const item = items.find(i => i.id === +inp.dataset.id);
      if (item) item[inp.dataset.field] = inp.value;
      recalcTotals();
    });
  });
  card.querySelector('.btn-del').addEventListener('click', (e) => {
    deleteItem(+e.target.dataset.id);
  });
}

// ===== DELETE ITEM =====
function deleteItem(id) {
  if (items.length <= 1) return;
  items = items.filter(i => i.id !== id);
  const card = document.querySelector(`.item-row[data-id="${id}"]`);
  if (card) card.remove();
  recalcTotals();
}

// ===== RECALC =====
function recalcTotals() {
  let subtotal = 0;
  items.forEach(item => {
    const cant = parseFloat(item.cant) || 0;
    const precio = parseFloat(item.precio) || 0;
    const rowTotal = cant * precio;
    subtotal += rowTotal;
    const cell = document.getElementById(`total-row-${item.id}`);
    if (cell) {
      cell.textContent = rowTotal > 0 ? `${EMPRESA.moneda} ${fmt(rowTotal)}` : '—';
    }
  });

  const useITBMS = document.getElementById('toggle-itbms').checked;
  const itbms = useITBMS ? subtotal * 0.07 : 0;
  const total = subtotal + itbms;

  document.getElementById('subtotal-val').textContent = `${EMPRESA.moneda} ${fmt(subtotal)}`;
  document.getElementById('itbms-val').textContent = `${EMPRESA.moneda} ${fmt(itbms)}`;
  document.getElementById('total-val').textContent = `${EMPRESA.moneda} ${fmt(total)}`;
}

// ===== FORMAT NUMBER =====
function fmt(n) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== UPDATE BADGE =====
function updateBadge() {
  const num = document.getElementById('numero').value || '1';
  document.getElementById('badge-numero').textContent = `COT-${String(num).padStart(3, '0')}`;
}

// ===== BUILD INVOICE HTML =====
function buildInvoiceHTML() {
  const numero = document.getElementById('numero').value || '1';
  const fecha = document.getElementById('fecha').value;
  const cliente = document.getElementById('cliente').value || '—';
  const direccion = document.getElementById('direccion').value;
  const nota = document.getElementById('nota').value;
  const useITBMS = document.getElementById('toggle-itbms').checked;

  // Format date nicely
  const fechaFmt = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // Build rows
  const filledItems = items.filter(i => i.cant || i.desc || i.precio);
  let rowsHTML = '';
  let subtotal = 0;

  filledItems.forEach((item, idx) => {
    const cant = parseFloat(item.cant) || 0;
    const precio = parseFloat(item.precio) || 0;
    const rowTotal = cant * precio;
    subtotal += rowTotal;
    rowsHTML += `
      <tr>
        <td class="right">${item.cant || ''}</td>
        <td class="desc">${escapeHTML(item.desc || '')}</td>
        <td class="right">${precio > 0 ? EMPRESA.moneda + ' ' + fmt(precio) : ''}</td>
        <td class="right" style="font-weight:600;">${rowTotal > 0 ? EMPRESA.moneda + ' ' + fmt(rowTotal) : ''}</td>
      </tr>`;
  });

  const itbms = useITBMS ? subtotal * 0.07 : 0;
  const total = subtotal + itbms;

  const itbmsRow = useITBMS ? `
    <div class="inv-totals-row">
      <span>ITBMS (7%)</span>
      <span>${EMPRESA.moneda} ${fmt(itbms)}</span>
    </div>` : '';

  const notaHTML = nota ? `
    <div class="inv-note-box">
      <strong>Nota:</strong> ${escapeHTML(nota)}
    </div>` : '';

  const dirHTML = direccion
    ? `<div class="dir">📍 ${escapeHTML(direccion)}</div>`
    : '';

  return `
  <div id="invoice-print">
    <div class="inv-header">
      <div class="inv-company">
        <h2>${EMPRESA.nombre}</h2>
        <div class="ruc">${EMPRESA.ruc}</div>
        <div class="tagline">${EMPRESA.tagline}</div>
        <div class="ruc" style="margin-top:8px;">📱 ${EMPRESA.celular} &nbsp;|&nbsp; ✉️ ${EMPRESA.email}</div>
      </div>
      <div class="inv-meta">
        <div class="cot-label">Cotización</div>
        <div class="cot-num">No. ${String(numero).padStart(3, '0')}</div>
        <div class="fecha">📅 ${fechaFmt}</div>
        <div class="fecha" style="margin-top:4px;color:#555;">Panamá</div>
      </div>
    </div>

    <div class="inv-client-box">
      <div class="lbl">Cliente</div>
      <div class="name">${escapeHTML(cliente)}</div>
      ${dirHTML}
    </div>

    <table class="inv-table">
      <thead>
        <tr>
          <th class="right" style="width:55px;">Cant.</th>
          <th>Descripción</th>
          <th class="right" style="width:110px;">Precio/U</th>
          <th class="right" style="width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML || '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">Sin artículos</td></tr>'}
      </tbody>
    </table>

    <div style="display:flex; justify-content:flex-end;">
      <div class="inv-totals">
        <div class="inv-totals-row">
          <span>Subtotal</span>
          <span>${EMPRESA.moneda} ${fmt(subtotal)}</span>
        </div>
        ${itbmsRow}
        <div class="inv-totals-row">
          <span>TOTAL</span>
          <span>${EMPRESA.moneda} ${fmt(total)}</span>
        </div>
      </div>
    </div>

    ${notaHTML}

    <div class="inv-footer">
      ${EMPRESA.nombre} &nbsp;·&nbsp; ${EMPRESA.celular} &nbsp;·&nbsp; ${EMPRESA.email}
      <br/>Esta cotización no constituye una factura legal.
    </div>
  </div>`;
}

// ===== SHOW PREVIEW =====
function showPreview() {
  const cliente = document.getElementById('cliente').value;
  saveClient(cliente);
  document.getElementById('preview-area').innerHTML = buildInvoiceHTML();
  document.getElementById('modal-backdrop').classList.add('open');
}

// ===== CLOSE MODAL =====
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

// ===== DOWNLOAD PDF =====
function downloadPDF() {
  const numero = document.getElementById('numero').value || '1';
  let cliente = document.getElementById('cliente').value.trim() || 'Cliente';
  saveClient(cliente);

  // Format filename: COT-NUM-CLIENTE.pdf
  // Replace spaces and special chars with underscores, but keep it readable
  const cleanCliente = cliente.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `COT-${numero}-${cleanCliente}.pdf`;

  // Create temporary container
  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildInvoiceHTML();
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  document.body.appendChild(wrapper);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid-all' }
  };

  html2pdf().set(opt).from(wrapper.firstChild).save().then(() => {
    document.body.removeChild(wrapper);
  });
}

// ===== NUEVA COTIZACION =====
function newCotizacion() {
  if (!confirm('¿Crear una nueva cotización? Se perderán los datos actuales.')) return;

  // Increment number
  const numInput = document.getElementById('numero');
  numInput.value = +numInput.value + 1;
  saveInvoiceNumber();

  // Clear fields
  document.getElementById('cliente').value = '';
  document.getElementById('direccion').value = '';
  document.getElementById('nota').value = '';
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('toggle-itbms').checked = false;

  // Clear items
  items = [];
  nextId = 1;
  document.getElementById('items-body').innerHTML = '';
  addItem(); addItem(); addItem();

  updateBadge();
  recalcTotals();
}

// ===== ESCAPE HTML =====
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
