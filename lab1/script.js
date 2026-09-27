// Данные о товарах
const products = {
  1: { name: 'Сила веры', price: 4200 },
  2: { name: 'Торжество', price: 3800 },
  3: { name: 'Роза среди навоза', price: 3500 },
  4: { name: 'Дракон', price: 6000 },
  5: { name: 'Пингвин', price: 5000 },
  6: { name: 'Гладиатор или рыцарь', price: 5500 },
};

// Состояние корзины
//cart хранится как объект { id: количество }, например { 1: 2, 3: 1 }
//При старте пробуем достать корзину из localStorage, если её там нет — пустой объект.
let cart = JSON.parse(localStorage.getItem('cart')) || {};

const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const cartModal = document.getElementById('cart-modal');
const cartItemsEl = document.getElementById('cart-items');
const modalTotalEl = document.getElementById('modal-total');
const orderModal = document.getElementById('order-modal');
const orderForm = document.getElementById('order-form');
const orderSuccessEl = document.getElementById('order-success');

// Сохранение корзины в localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Пересчёт суммы корзины
function getCartTotal() {
  let total = 0;
  for (const id in cart) {
    total += products[id].price * cart[id];
  }
  return total;
}

function getCartCount() {
  let count = 0;
  for (const id in cart) {
    count += cart[id];
  }
  return count;
}

// Обновление счётчика и суммы в шапке сайта 
function updateHeader() {
  cartCountEl.textContent = getCartCount();
  cartTotalEl.textContent = getCartTotal();
}

// Отрисовка содержимого модального окна корзины
function renderCartModal() {
  cartItemsEl.innerHTML = ''; //очищаем список перед перерисовкой

  const ids = Object.keys(cart);

  if (ids.length === 0) {
    cartItemsEl.innerHTML = '<li>Корзина пуста</li>';
  }

  ids.forEach((id) => {
    const product = products[id];
    const qty = cart[id];

    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <span class="cart-item-name">${product.name}</span>
      <div class="cart-item-controls">
        <button class="qty-btn" data-id="${id}" data-action="decrease">−</button>
        <span>${qty}</span>
        <button class="qty-btn" data-id="${id}" data-action="increase">+</button>
        <button class="remove-btn" data-id="${id}">Удалить</button>
      </div>
      <span class="cart-item-price">${product.price * qty} ₽</span>
    `;
    cartItemsEl.appendChild(li);
  });

  modalTotalEl.textContent = getCartTotal();
}

// Добавление товара в корзину
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateHeader();
}

// Изменение количества товара
function changeQty(id, action) {
  if (action === 'increase') {
    cart[id]++;
  } else if (action === 'decrease') {
    cart[id]--;
    if (cart[id] <= 0) {
      delete cart[id]; //если количество 0 — удаляем товар совсем
    }
  }
  saveCart();
  updateHeader();
  renderCartModal();
}

// Удаление товара из корзины
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  updateHeader();
  renderCartModal();
}

// Обработчики кликов по кнопкам "Добавить в корзину"
document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card'); // ближайшая карточка-родитель
    const id = card.dataset.id; // читаем data-id="..." из HTML
    addToCart(id);
  });
});

// Открытие/закрытие корзины
document.getElementById('cart-btn').addEventListener('click', () => {
  renderCartModal();
  cartModal.classList.remove('hidden');
});

document.getElementById('close-cart').addEventListener('click', () => {
  cartModal.classList.add('hidden');
});

// Клики внутри корзины: +, −
cartItemsEl.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return; // клик мимо кнопки

  if (e.target.classList.contains('qty-btn')) {
    changeQty(id, e.target.dataset.action);
  }

  if (e.target.classList.contains('remove-btn')) {
    removeFromCart(id);
  }
});

// Переход из корзины к оформлению заказа
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (Object.keys(cart).length === 0) {
    alert('Корзина пуста — добавьте хотя бы одно кольцо');
    return;
  }
  cartModal.classList.add('hidden');
  orderModal.classList.remove('hidden');
});

document.getElementById('close-order').addEventListener('click', () => {
  orderModal.classList.add('hidden');
});

// Отправка формы заказа
orderForm.addEventListener('submit', (e) => {
  e.preventDefault(); 

  orderForm.classList.add('hidden');
  orderSuccessEl.classList.remove('hidden');

  //Очищаем корзину — заказ оформлен
  cart = {};
  saveCart();
  updateHeader();

  //Через 2 секунды закрываем окно и возвращаем форму в исходное состояние
  setTimeout(() => {
    orderModal.classList.add('hidden');
    orderForm.classList.remove('hidden');
    orderSuccessEl.classList.add('hidden');
    orderForm.reset();
  }, 2000);
});

updateHeader();
